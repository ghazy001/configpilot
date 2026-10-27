import { Buffer } from "node:buffer";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { discoveryError } from "../discovery/project.js";
import { DISCOVERY_LIMITS } from "../discovery/source.js";

export function validateOutput(output) {
  // Reject terminal controls in destination names.
  // eslint-disable-next-line no-control-regex
  const unsafe = /[/\\:\u0000-\u001f\u007f-\u009f\p{Cf}]/u;
  if (
    typeof output !== "string" ||
    !output ||
    output.length > 255 ||
    output === "." ||
    output === ".." ||
    output.toLowerCase() === ".gitignore" ||
    output.toLowerCase() === ".npmrc" ||
    /[. ]$/.test(output) ||
    /^(?:con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(
      output,
    ) ||
    unsafe.test(output)
  )
    throw discoveryError("INIT_OUTPUT_INVALID");
}
export async function inspectDestination(root, output) {
  validateOutput(output);
  try {
    const base = await realpath(resolve(root));
    const info = await lstat(base);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error();
    try {
      await lstat(join(base, output));
      throw discoveryError("INIT_EXISTS");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return { base, dev: info.dev, ino: info.ino };
  } catch (error) {
    if (error.code === "INIT_EXISTS") throw error;
    throw discoveryError("INIT_OUTPUT_INVALID");
  }
}
export async function gitIgnoreStatus(root, output) {
  validateOutput(output);
  return new Promise((resolve) => {
    execFile(
      "git",
      [
        "-c",
        "core.fsmonitor=false",
        "-c",
        "core.hooksPath=",
        "check-ignore",
        "--quiet",
        "--",
        output,
      ],
      { cwd: root, timeout: 2000, maxBuffer: 4096, windowsHide: true },
      (error) =>
        resolve(
          !error ? "ignored" : error.code === 1 ? "not-ignored" : "unknown",
        ),
    );
  });
}

/** Explicit side effect, never implicit in generation. No overwrite, including links. */
export async function createEnvFile({
  root = ".",
  output = ".env",
  content,
  confirmed = false,
} = {}) {
  if (confirmed !== true) throw discoveryError("INIT_CONFIRMATION_REQUIRED");
  if (
    typeof content !== "string" ||
    !content ||
    Buffer.byteLength(content) > DISCOVERY_LIMITS.outputBytes
  )
    throw discoveryError("INIT_CONTENT_INVALID");
  const before = await inspectDestination(root, output);
  try {
    if ((await realpath(resolve(root))) !== before.base) throw new Error();
    const now = await lstat(before.base);
    if (now.dev !== before.dev || now.ino !== before.ino) throw new Error();
    const file = await open(
      join(before.base, output),
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    try {
      if (!(await file.stat()).isFile())
        throw discoveryError("INIT_OUTPUT_INVALID");
      await file.writeFile(content, "utf8");
    } finally {
      await file.close();
    }
    return { created: true, output };
  } catch (error) {
    if (error.code === "EEXIST") throw discoveryError("INIT_EXISTS");
    // A write failure may leave a partial newly created file. Never delete by
    // pathname after failure: another actor might have replaced the entry.
    throw discoveryError("INIT_WRITE_FAILED");
  }
}
