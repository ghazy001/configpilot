import { createIssue } from "../diagnostics/issue-codes.js";

const MAX_SOURCE_LENGTH = 1_048_576;
const ASSIGNMENT =
  /^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*/;
const QUOTES = new Set(["'", '"', "`"]);

// Values are scanned only to find boundaries. Never decode or retain them.
function closingQuote(line, start, quote) {
  for (let index = start; index < line.length; index += 1) {
    if (line[index] === "\\") {
      index += 1;
    } else if (line[index] === quote) {
      return index;
    }
  }
  return -1;
}

// Invalid assignments can still introduce quoted credentials. Quarantine any
// unterminated quote instead of interpreting subsequent body lines as keys.
function unclosedQuote(line, offset = 0) {
  for (let index = offset; index < line.length; index += 1) {
    if (line[index] === "#") break;
    if (QUOTES.has(line[index])) {
      const end = closingQuote(line, index + 1, line[index]);
      if (end === -1) return line[index];
      index = end;
    }
  }
  return null;
}

function skipQuotedBlock(lines, start, quote) {
  for (let index = start + 1; index < lines.length; index += 1) {
    const end = closingQuote(lines[index], 0, quote);
    if (end !== -1) {
      // A malformed closing line can open another quoted block. Continue
      // quarantine iteratively so chained blocks cannot leak or grow the stack.
      quote = unclosedQuote(lines[index], end + 1);
      if (quote === null) return { end: index, closed: true };
    }
  }
  return { end: lines.length, closed: false };
}

function skipMalformedBlock(lines, start, offset = 0) {
  const quote = unclosedQuote(lines[start], offset);
  return quote === null ? start : skipQuotedBlock(lines, start, quote).end;
}

/**
 * Parse a documented subset of dotenv syntax without retaining any values.
 * @param {string} source UTF-16 text, limited to 1,048,576 code units.
 * @param {{file?: string}} [options] File label only; never read from disk.
 * @returns {{declarations: Array<{key: string, location: {file: string, line: number}}>, issues: Array<object>}}
 * @throws {TypeError} For invalid argument types (without echoing arguments).
 * @throws {RangeError} If source exceeds the documented size limit.
 */
export function parseDotenv(source, options = {}) {
  if (typeof source !== "string") {
    throw new TypeError("source must be a string.");
  }
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new RangeError(
      "source exceeds the limit of 1,048,576 UTF-16 code units.",
    );
  }
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new TypeError("options must be an object.");
  }
  const file = options.file === undefined ? "<input>" : options.file;
  if (typeof file !== "string" || file.length === 0) {
    throw new TypeError("options.file must be a non-empty string.");
  }

  const lines = (source.startsWith("\uFEFF") ? source.slice(1) : source).split(
    /\r\n|\n|\r/,
  );
  const declarations = [];
  const issues = [];
  const firstLocations = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const location = { file, line: index + 1 };
    if (line.includes("\0")) {
      issues.push(createIssue("INVALID_DECLARATION", location));
      index = skipMalformedBlock(lines, index);
      continue;
    }
    if (/^[ \t]*(?:#|$)/.test(line)) continue;

    const assignment = ASSIGNMENT.exec(line);
    if (!assignment) {
      issues.push(createIssue("INVALID_DECLARATION", location));
      index = skipMalformedBlock(lines, index);
      continue;
    }

    const start = assignment[0].length;
    const quote = line[start];
    if (QUOTES.has(quote)) {
      const end = closingQuote(line, start + 1, quote);
      if (end === -1) {
        const block = skipQuotedBlock(lines, index, quote);
        issues.push(
          createIssue(
            block.closed ? "UNSUPPORTED_MULTILINE" : "INVALID_DECLARATION",
            location,
          ),
        );
        index = block.end;
        continue;
      }
      if (!/^[ \t]*(?:#|$)/.test(line.slice(end + 1))) {
        issues.push(createIssue("INVALID_DECLARATION", location));
        index = skipMalformedBlock(lines, index, end + 1);
        continue;
      }
    }

    const key = assignment[1];
    declarations.push({ key, location });
    if (firstLocations.has(key)) {
      issues.push({
        ...createIssue("DUPLICATE_KEY", location),
        key,
        relatedLocation: { ...firstLocations.get(key) },
      });
    } else {
      firstLocations.set(key, { ...location });
    }
  }

  return { declarations, issues };
}
