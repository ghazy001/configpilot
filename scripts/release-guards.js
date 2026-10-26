/** Internal development/release guards, excluded from the npm package. */
export function candidateFiles(metadata) {
  const publishing = metadata?.publishConfig;
  const publicCandidate =
    metadata?.private === undefined &&
    typeof metadata?.version === "string" &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(metadata.version) &&
    publishing?.registry === "https://registry.npmjs.org/" &&
    publishing.access === "public" &&
    publishing.tag === "latest" &&
    Object.keys(publishing).length === 3;
  if (
    metadata?.name !== "configpilot" ||
    (metadata.private !== true && !publicCandidate) ||
    !Array.isArray(metadata.files) ||
    metadata.files.length === 0
  )
    throw new Error(
      "Candidate preparation requires private or explicit public-registry ConfigPilot metadata and a file allowlist.",
    );
  const files = [...metadata.files, "package.json", "README.md", "LICENSE"];
  for (const file of files) {
    if (
      typeof file !== "string" ||
      !/^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(file) ||
      file.split("/").some((part) => !part || part.startsWith(".")) ||
      /(?:^|\/)env(?:\.|$)|\.env(?:\.|$)|\.(?:tgz|log)$/i.test(file)
    )
      throw new Error(
        "Candidate allowlist must contain only explicit safe file paths.",
      );
  }
  return [...new Set(files)].sort();
}

export function verifyPack(report, expectedFiles) {
  const actual = Array.isArray(report?.files)
    ? report.files.map((file) => file?.path).sort()
    : undefined;
  if (
    !actual ||
    actual.length !== expectedFiles.length ||
    actual.some((file, index) => file !== expectedFiles[index]) ||
    typeof report.filename !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._+-]*\.tgz$/.test(report.filename)
  )
    throw new Error(
      "Packed contents do not match the reviewed candidate allowlist.",
    );
}

export function qualityGatePassed(checkRuns, commit) {
  if (!Array.isArray(checkRuns)) return false;
  const latest = checkRuns
    .filter(
      (check) =>
        check?.name === "Quality gate" &&
        check.head_sha === commit &&
        check.app?.slug === "github-actions" &&
        Number.isSafeInteger(check.id) &&
        check.id > 0,
    )
    .sort((left, right) => right.id - left.id)[0];
  return latest?.status === "completed" && latest.conclusion === "success";
}
