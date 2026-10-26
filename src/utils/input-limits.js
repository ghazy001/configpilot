/** Internal resource budgets, shared by the pure API and CLI. */
export class InputLimitError extends RangeError {
  constructor() {
    super("Input exceeds the declaration or public-metadata budget.");
  }
}

export function inputBudget(file) {
  if (file.length > 4096) throw new InputLimitError();
  let records = 0;
  let metadata = 0;
  return (key = "", duplicate = false) => {
    records += 1;
    // Account for parser declarations and issues, including related locations.
    metadata += key.length + file.length;
    if (duplicate) metadata += key.length + 2 * file.length;
    if (records > 2048 || metadata > 131_072) throw new InputLimitError();
  };
}
