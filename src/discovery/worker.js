import { parentPort } from "node:worker_threads";
import { scanSource } from "./source.js";
parentPort.on("message", async ({ source, file }) => {
  try {
    const result = file.endsWith(".vue")
      ? (await import("./vue.js")).scanVueSource(source, { file })
      : scanSource(source, { file });
    parentPort.postMessage(result);
  } catch {
    parentPort.postMessage({ failed: true });
  }
});
