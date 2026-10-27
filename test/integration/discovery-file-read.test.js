import assert from "node:assert/strict";
import { constants } from "node:fs";
import {
  mkdtemp,
  writeFile,
  realpath,
  lstat,
  open,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readConfigFile } from "../../src/utils/read-config-file.js";

test("discovery reads an unchanged regular file with no-follow identity checks on every supported OS", async (t) => {
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "configpilot read é ")),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = join(root, "source.ts");
  await writeFile(path, "process.env.PORT");
  const before = await lstat(path, { bigint: true });
  const file = await open(path, constants.O_RDONLY);
  const opened = await file.stat({ bigint: true });
  await file.close();
  const context = JSON.stringify({
    canonical: (await realpath(path)) === path,
    pathDevice: before.dev.toString(),
    handleDevice: opened.dev.toString(),
    sameDevice: opened.dev === before.dev,
    sameWindowsVolumeSerial:
      BigInt.asUintN(32, opened.dev) === BigInt.asUintN(32, before.dev),
    sameInode: opened.ino === before.ino,
    noFollowFlag: constants.O_NOFOLLOW ?? 0,
    nonblockFlag: constants.O_NONBLOCK ?? 0,
  });
  t.diagnostic(context);
  let result;
  try {
    result = await readConfigFile(path, { noFollow: true });
  } catch (error) {
    result = error.code;
  }
  assert.equal(result, "process.env.PORT", context);
});
