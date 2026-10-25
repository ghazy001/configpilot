/** JSON escapes controls in labels while preserving the parsed report exactly. */
export function formatJson(value) {
  return (
    JSON.stringify(value, null, 2).replace(
      /[\u007f-\u009f\p{Cf}\u2028\u2029]/gu,
      (character) =>
        character
          .split("")
          .map(
            (unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`,
          )
          .join(""),
    ) + "\n"
  );
}
