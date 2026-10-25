import { Buffer } from "node:buffer";
import { constants } from "node:fs";
import { open, stat } from "node:fs/promises";
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

function checkFile(info) {
  if (!info.isFile()) throw fileError("NOT_REGULAR_FILE");
  if (info.size > MAX_FILE_BYTES) throw fileError("FILE_TOO_LARGE");
}

/** Read only a selected regular UTF-8 file; never expose native error messages. */
export async function readConfigFile(path) {
  try {
    // Reject devices/FIFOs before opening. Recheck the opened descriptor for races;
    // nonblocking opens also protect against a path being replaced by a FIFO.
    checkFile(await stat(path));
    const file = await open(
      path,
      constants.O_RDONLY | (constants.O_NONBLOCK ?? 0),
    );
    try {
      checkFile(await file.stat());
      const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
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
      if (length > MAX_FILE_BYTES) throw fileError("FILE_TOO_LARGE");
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
