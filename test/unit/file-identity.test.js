import assert from "node:assert/strict";
import test from "node:test";
import {
  sameFileIdentity,
  verifyFileIdentity,
} from "../../src/utils/read-config-file.js";

test("Windows volume serials normalize to libuv's low 32 bits without discarding device or inode identity", () => {
  const path = { dev: 0x12345678abcdef01n, ino: 9007199254740993n };
  const handle = { dev: 0xabcdef01n, ino: path.ino };
  assert.equal(sameFileIdentity(path, handle, "win32"), true);
  assert.equal(sameFileIdentity(path, handle, "linux"), false);
  assert.equal(sameFileIdentity(path, handle, "darwin"), false);
  assert.equal(
    sameFileIdentity(path, { ...handle, dev: 0xabcdef02n }, "win32"),
    false,
  );
  assert.equal(sameFileIdentity(path, { ...handle, dev: 0n }, "win32"), false);
  assert.equal(
    sameFileIdentity(path, { ...handle, ino: 9007199254740992n }, "win32"),
    false,
  );
  for (const platform of ["linux", "darwin", "win32"]) {
    assert.equal(sameFileIdentity(handle, handle, platform), true);
    assert.equal(
      sameFileIdentity(handle, { ...handle, ino: handle.ino + 1n }, platform),
      false,
    );
  }
});

test("missing Windows path serial still verifies descriptor device identity and rejects replaced files", async (t) => {
  const { mkdtemp, writeFile, open, lstat, rm, rename } =
    await import("node:fs/promises");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { constants } = await import("node:fs");
  const root = await mkdtemp(join(tmpdir(), "configpilot identity "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "source.js");
  await writeFile(path, "process.env.PORT");
  const named = await lstat(path, { bigint: true });
  const file = await open(path, constants.O_RDONLY);
  const opened = await file.stat({ bigint: true });
  await file.close();
  const missing = { dev: 0n, ino: named.ino };
  await verifyFileIdentity(path, missing, opened, constants.O_RDONLY, "win32");
  await assert.rejects(
    verifyFileIdentity(
      path,
      missing,
      { ...opened, dev: opened.dev + 1n },
      constants.O_RDONLY,
      "win32",
    ),
    { code: "FILE_NOT_READABLE" },
  );
  await assert.rejects(
    verifyFileIdentity(
      path,
      missing,
      { ...opened, ino: opened.ino + 1n },
      constants.O_RDONLY,
      "win32",
    ),
    { code: "FILE_NOT_READABLE" },
  );
  await assert.rejects(
    verifyFileIdentity(
      path,
      { ...missing, dev: opened.dev + 1n },
      opened,
      constants.O_RDONLY,
      "win32",
    ),
    { code: "FILE_NOT_READABLE" },
  );
  // Keep the original file alive, preventing filesystem inode recycling.
  await rename(path, join(root, "original.js"));
  await writeFile(path, "process.env.REPLACED");
  await assert.rejects(
    verifyFileIdentity(path, missing, opened, constants.O_RDONLY, "win32"),
    { code: "FILE_NOT_READABLE" },
  );
});
