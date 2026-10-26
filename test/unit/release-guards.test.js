import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateFiles,
  qualityGatePassed,
  verifyPack,
} from "../../scripts/release-guards.js";

const metadata = {
  name: "configpilot",
  private: true,
  files: ["src/index.js"],
};

test("candidate files require guarded metadata and reject broad, hidden, environment, and traversal paths", () => {
  assert.deepEqual(candidateFiles(metadata), [
    "LICENSE",
    "README.md",
    "package.json",
    "src/index.js",
  ]);
  for (const input of [
    undefined,
    {},
    { ...metadata, private: false },
    { ...metadata, name: "other" },
    { ...metadata, files: [] },
  ])
    assert.throws(() => candidateFiles(input));
  for (const path of [
    "src/**",
    ".env",
    "src/.env.production",
    "secret.env",
    "env.json",
    "src/../secret",
    "/absolute",
    "src//file",
    "src\\file",
    "bad\0file",
    "archive.tgz",
    "debug.log",
    1,
  ])
    assert.throws(() => candidateFiles({ ...metadata, files: [path] }));
});

test("packing fails closed on extra, missing, duplicate or unsafe archive entries", () => {
  const files = candidateFiles(metadata);
  const report = {
    filename: "configpilot-0.1.0.tgz",
    files: files.map((path) => ({ path })),
  };
  verifyPack(report, files);
  for (const paths of [
    files.slice(1),
    [...files, ".env"],
    [...files.slice(1), files[1]],
  ])
    assert.throws(() =>
      verifyPack({ ...report, files: paths.map((path) => ({ path })) }, files),
    );
  for (const filename of [
    "../archive.tgz",
    "/archive.tgz",
    "dir\\archive.tgz",
    "archive.zip",
    undefined,
  ])
    assert.throws(() => verifyPack({ ...report, filename }, files));
  assert.throws(() => verifyPack(undefined, files));
  assert.throws(() => verifyPack({ files: {} }, files));
  assert.throws(() => verifyPack({ ...report, files: [null] }, files));
});

test("public candidates require a stable version and exact explicit registry, access and tag", () => {
  const publishing = {
    registry: "https://registry.npmjs.org/",
    access: "public",
    tag: "latest",
  };
  const publicMetadata = {
    name: "configpilot",
    version: "0.1.0",
    files: ["src/index.js"],
    publishConfig: publishing,
  };
  assert.deepEqual(candidateFiles(publicMetadata), candidateFiles(metadata));
  for (const changed of [
    { private: false },
    { private: "false" },
    { version: "" },
    { version: "v0.1.0" },
    { version: "0.1.0-beta.1" },
    { version: "01.1.0" },
    { publishConfig: undefined },
    { publishConfig: null },
    { publishConfig: {} },
    { publishConfig: { ...publishing, registry: "https://example.invalid/" } },
    { publishConfig: { ...publishing, access: "restricted" } },
    { publishConfig: { ...publishing, tag: "next" } },
    { publishConfig: { ...publishing, unexpected: true } },
  ])
    assert.throws(() => candidateFiles({ ...publicMetadata, ...changed }));
});

test("release quality gate rejects failures, pending/skipped jobs, stale commits and other check providers", () => {
  const commit = "a".repeat(40);
  const success = {
    id: 1,
    name: "Quality gate",
    head_sha: commit,
    app: { slug: "github-actions" },
    status: "completed",
    conclusion: "success",
  };
  assert.equal(qualityGatePassed([success], commit), true);
  assert.equal(
    qualityGatePassed(
      [success, { ...success, id: 2, conclusion: "failure" }],
      commit,
    ),
    false,
  );
  assert.equal(
    qualityGatePassed(
      [{ ...success, id: 2, status: "in_progress" }, success],
      commit,
    ),
    false,
  );
  for (const changed of [
    { conclusion: "failure" },
    { conclusion: "cancelled" },
    { conclusion: "skipped" },
    { status: "in_progress" },
    { head_sha: "b".repeat(40) },
    { name: "other" },
    { app: { slug: "other" } },
    { app: undefined },
  ])
    assert.equal(
      qualityGatePassed([{ ...success, ...changed }], commit),
      false,
    );
  assert.equal(qualityGatePassed([], commit), false);
  assert.equal(qualityGatePassed(undefined, commit), false);
  assert.equal(qualityGatePassed([null], commit), false);
});
