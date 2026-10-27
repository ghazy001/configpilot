import process from "node:process";
import { createInterface } from "node:readline/promises";
import { setTimeout, clearTimeout } from "node:timers";

/** EOF, interruption and idle timeout all default to No; never create here. */
export async function confirmCreation(
  preview,
  question,
  { input = process.stdin, output = process.stdout, timeoutMs = 120000 } = {},
) {
  if (input.destroyed || input.readableEnded) return false;
  const controller = new globalThis.AbortController();
  const cancel = () => controller.abort();
  let prompt, timer;
  try {
    output.once("error", cancel);
    output.write(preview);
    // A yes/no line needs no raw-mode cursor control, including restricted TTYs.
    prompt = createInterface({ input, output, terminal: false });
    prompt.once("close", cancel);
    prompt.once("SIGINT", cancel);
    prompt.once("error", cancel);
    process.once("SIGINT", cancel);
    timer = setTimeout(cancel, timeoutMs);
    timer.unref();
    return /^(?:y|yes)$/i.test(
      (await prompt.question(question, { signal: controller.signal })).trim(),
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    output.removeListener("error", cancel);
    process.removeListener("SIGINT", cancel);
    prompt?.removeListener("close", cancel);
    prompt?.removeListener("SIGINT", cancel);
    prompt?.removeListener("error", cancel);
    prompt?.close();
  }
}
