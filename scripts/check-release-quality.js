import process from "node:process";
import { qualityGatePassed } from "./release-guards.js";

try {
  const { GITHUB_SHA: commit, GH_TOKEN: token } = process.env;
  if (!/^[a-f0-9]{40}$/.test(commit ?? "") || !token) throw new Error();
  const response = await globalThis.fetch(
    `https://api.github.com/repos/ghazy001/configpilot/commits/${commit}/check-runs?per_page=100&filter=latest&check_name=Quality%20gate`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      signal: globalThis.AbortSignal.timeout(10_000),
      redirect: "error",
    },
  );
  if (
    !response.ok ||
    !qualityGatePassed((await response.json()).check_runs, commit)
  )
    throw new Error();
  process.stdout.write(
    "The exact commit has a successful GitHub Actions Quality gate.\n",
  );
} catch {
  process.stderr.write(
    "Candidate preparation requires completed, successful Quality CI for this exact commit.\n",
  );
  process.exitCode = 1;
}
