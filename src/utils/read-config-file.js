import { Buffer } from "node:buffer";
import { constants } from "node:fs";
import { open, stat, lstat } from "node:fs/promises";
import process from "node:process";
import { TextDecoder } from "node:util";

export const MAX_FILE_BYTES = 1_048_576;
const SAFE_CODES = new Set([
  "FILE_NOT_FOUND",
  "FILE_NOT_READABLE",
  "NOT_REGULAR_FILE",
  "FILE_TOO_LARGE",
  "INVALID_ENCODING",
]);

export function inputErrorCode(error) {
  if (SAFE_CODES.has(error?.code)) return error.code;
  if (error?.code === "ENOENT" || error?.code === "ENOTDIR")
    return "FILE_NOT_FOUND";
  if (error?.code === "EISDIR") return "NOT_REGULAR_FILE";
  return "FILE_NOT_READABLE";
}

function fileError(code) {
  return Object.assign(new Error(code), { code });
}

function checkFile(info, maxBytes = MAX_FILE_BYTES) {
  if (!info.isFile()) throw fileError("NOT_REGULAR_FILE");
  if (info.size > maxBytes) throw fileError("FILE_TOO_LARGE");
}

// Match libuv's Windows volume-serial policy (v1.51+). Older versions expose
// a 64-bit path serial but a 32-bit descriptor serial; retain the device check.
export function sameFileIdentity(left, right, platform = process.platform) {
  const device = (value) =>
    platform === "win32" ? BigInt.asUintN(32, value) : value;
  return device(left.dev) === device(right.dev) && left.ino === right.ino;
}

// Some Windows path-stat implementations omit the volume serial entirely. In
// that case compare two independently opened descriptors, keeping full device
// and inode checks, and recheck the named file around that verification.
export async function verifyFileIdentity(
  path,
  before,
  opened,
  flags,
  platform = process.platform,
) {
  if (sameFileIdentity(opened, before, platform)) return;
  if (platform !== "win32" || before.dev !== 0n || before.ino !== opened.ino)
    throw fileError("FILE_NOT_READABLE");
  const current = await lstat(path, { bigint: true });
  checkFile(current);
  if (
    current.ino !== before.ino ||
    (current.dev !== 0n && !sameFileIdentity(current, opened, platform))
  )
    throw fileError("FILE_NOT_READABLE");
  const witness = await open(path, flags);
  try {
    const observed = await witness.stat({ bigint: true });
    checkFile(observed);
    if (!sameFileIdentity(opened, observed, platform))
      throw fileError("FILE_NOT_READABLE");
  } finally {
    await witness.close();
  }
  const after = await lstat(path, { bigint: true });
  checkFile(after);
  if (
    after.ino !== before.ino ||
    (after.dev !== 0n && !sameFileIdentity(after, opened, platform))
  )
    throw fileError("FILE_NOT_READABLE");
}

/** Read only a selected regular UTF-8 file; never expose native error messages. */
export async function readConfigFile(
  path,
  { noFollow = false, maxBytes = MAX_FILE_BYTES } = {},
) {
  try {
    // Reject devices/FIFOs before opening. Recheck the opened descriptor for races;
    // nonblocking opens also protect against a path being replaced by a FIFO.
    const before = await (noFollow
      ? lstat(path, { bigint: true })
      : stat(path));
    checkFile(before, maxBytes);
    const flags =
      constants.O_RDONLY |
      (constants.O_NONBLOCK ?? 0) |
      (noFollow ? (constants.O_NOFOLLOW ?? 0) : 0);
    const file = await open(path, flags);
    try {
      const opened = await file.stat({ bigint: noFollow });
      checkFile(opened, maxBytes);
      if (noFollow) await verifyFileIdentity(path, before, opened, flags);
      const buffer = Buffer.alloc(maxBytes + 1);
      let length = 0;
      while (length < buffer.length) {
        const { bytesRead } = await file.read(
          buffer,
          length,
          buffer.length - length,
          length,
        );
        if (bytesRead === 0) break;
        length += bytesRead;
      }
      if (length > maxBytes) throw fileError("FILE_TOO_LARGE");
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(
          buffer.subarray(0, length),
        );
      } catch {
        throw fileError("INVALID_ENCODING");
      }
    } finally {
      await file.close();
    }
  } catch (error) {
    throw fileError(inputErrorCode(error));
  }
}
