import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import process from "node:process";
import { setTimeout } from "node:timers/promises";
import { confirmCreation } from "../../src/initialization/confirm.js";

test("confirmation accepts explicit Yes, defaults No and terminates on EOF or idle timeout", async () => {
  for (const [answer, expected] of [
    ["yes\n", true],
    ["\n", false],
    ["no\n", false],
    ["yesterday\n", false],
    [null, false],
  ]) {
    const input = new PassThrough(),
      output = new PassThrough();
    let text = "";
    output.on("data", (b) => {
      text += b;
    });
    const result = confirmCreation("Safe preview\n", "Create? (y/N) ", {
      input,
      output,
      timeoutMs: 500,
    });
    if (answer === null) input.end();
    else input.write(answer);
    assert.equal(await result, expected);
    assert.ok(text.includes("Safe preview"));
    input.destroy();
    output.destroy();
  }
  const input = new PassThrough(),
    output = new PassThrough();
  const result = confirmCreation("Preview", "Create? ", {
    input,
    output,
    timeoutMs: 20,
  });
  // Keep the event loop alive for the unref'ed safety timer in this synthetic stream.
  await setTimeout(30);
  assert.equal(await result, false);
  input.destroy();
  output.destroy();
});

test("confirmation cancels on output failure without exposing exception text", async () => {
  const input = new PassThrough(),
    output = new PassThrough();
  const result = confirmCreation("Safe preview", "Create? (y/N) ", {
    input,
    output,
    timeoutMs: 500,
  });
  output.destroy(new Error("SYNTHETIC_OUTPUT_SECRET"));
  assert.equal(await result, false);
  input.destroy();
});

test("confirmation uses line input without requiring raw TTY mode and safely handles preview write failure", async (t) => {
  const input = new PassThrough(),
    output = new PassThrough();
  t.after(() => {
    input.destroy();
    output.destroy();
  });
  input.isTTY = true;
  output.isTTY = true;
  input.setRawMode = () => {
    throw new Error("SYNTHETIC_RAW_MODE_DENIED");
  };
  const result = confirmCreation("Safe preview", "Create? ", {
    input,
    output,
    timeoutMs: 500,
  });
  input.write("yes\n");
  assert.equal(await result, true);
  output.write = () => {
    throw new Error("SYNTHETIC_PREVIEW_WRITE_FAILED");
  };
  assert.equal(
    await confirmCreation("Safe preview", "Create? ", {
      input,
      output,
      timeoutMs: 500,
    }),
    false,
  );
  assert.equal(output.listenerCount("error"), 0);
});

test("line confirmation cancels on process interruption and releases its signal listener", async (t) => {
  const input = new PassThrough(),
    output = new PassThrough();
  t.after(() => {
    input.destroy();
    output.destroy();
  });
  const listeners = process.listenerCount("SIGINT");
  const result = confirmCreation("Safe preview", "Create? ", {
    input,
    output,
    timeoutMs: 500,
  });
  assert.equal(process.listenerCount("SIGINT"), listeners + 1);
  process.emit("SIGINT");
  assert.equal(await result, false);
  assert.equal(process.listenerCount("SIGINT"), listeners);
});
