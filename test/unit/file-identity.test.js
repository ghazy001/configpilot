import assert from "node:assert/strict";
import test from "node:test";
import { sameFileIdentity } from "../../src/utils/read-config-file.js";

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
