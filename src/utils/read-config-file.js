import { Buffer } from "node:buffer";
import { constants } from "node:fs";
import { open, stat, lstat } from "node:fs/promises";
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

/** Read only a selected regular UTF-8 file; never expose native error messages. */
export async function readConfigFile(
  path,
  { noFollow = false, maxBytes = MAX_FILE_BYTES } = {},
) {
  try {
    // Reject devices/FIFOs before opening. Recheck the opened descriptor for races;
    // nonblocking opens also protect against a path being replaced by a FIFO.
    const before = await (noFollow ? lstat(path) : stat(path));
    checkFile(before, maxBytes);
    const file = await open(
      path,
      constants.O_RDONLY |
        (constants.O_NONBLOCK ?? 0) |
        (noFollow ? (constants.O_NOFOLLOW ?? 0) : 0),
    );
    try {
      const opened = await file.stat();
      checkFile(opened, maxBytes);
      if (noFollow && (opened.dev !== before.dev || opened.ino !== before.ino))
        throw fileError("FILE_NOT_READABLE");
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
