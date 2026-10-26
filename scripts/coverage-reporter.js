/** Structured Node coverage events avoid version-specific terminal table layouts. */
export default async function* coverageReporter(events) {
  for await (const event of events) {
    if (event.type === "test:coverage")
      yield JSON.stringify(
        event.data.summary.files.map(
          ({ path, coveredLinePercent, coveredBranchPercent }) => ({
            path,
            coveredLinePercent,
            coveredBranchPercent,
          }),
        ),
      ) + "\n";
  }
}
