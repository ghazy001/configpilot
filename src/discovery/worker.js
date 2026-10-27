import { parentPort } from "node:worker_threads";
import { scanSource } from "./source.js";
parentPort.on("message", ({ source, file }) => {
  try {
    parentPort.postMessage(scanSource(source, { file }));
  } catch {
    parentPort.postMessage({ failed: true });
  }
});
