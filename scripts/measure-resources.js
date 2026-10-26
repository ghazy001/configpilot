// Isolated synthetic probes; no project configuration is read or copied.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { URL } from "node:url";
const moduleUrl = new URL("../src/index.js", import.meta.url).href;
const reporterUrl = new URL("../src/reporters/json.js", import.meta.url).href;
for (const scenario of [
  "duplicates",
  "differences",
  "labels",
  "dense-rejection",
  "blank-limit",
]) {
  const source = `
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {analyzeConfig} from ${JSON.stringify(moduleUrl)};
import {formatJson} from ${JSON.stringify(reporterUrl)};
const scenario=${JSON.stringify(scenario)};
let template="", environment="", labels={};
if(scenario==="duplicates") template=environment="A=x\\n".repeat(2048);
if(scenario==="differences") {
 template=Array.from({length:2048},(_,i)=>"EXPECTED_"+i+"=x").join("\\n");
 environment=Array.from({length:2048},(_,i)=>"ACTUAL_"+i+"=y").join("\\n");
}
if(scenario==="labels") { template=environment="bad\\n".repeat(32); labels={templateFile:"\\u0001".repeat(4096),environmentFile:"\\u0001".repeat(4096)}; }
if(scenario==="dense-rejection") environment="A=x\\n".repeat(262144);
if(scenario==="blank-limit") template=environment="\\n".repeat(1048576);
const start=performance.now(); let outputBytes=0;
if(scenario==="dense-rejection") assert.throws(()=>analyzeConfig({template,environment}),RangeError);
else outputBytes=Buffer.byteLength(formatJson(analyzeConfig({template,environment,...labels})));
const maxRssMiB=process.resourceUsage().maxRSS/1024;
assert.ok(outputBytes<=5*1024*1024,"Report exceeds 5 MiB budget.");
assert.ok(maxRssMiB<=256,"Probe exceeds 256 MiB RSS budget.");
console.log(JSON.stringify({scenario,elapsedMs:+(performance.now()-start).toFixed(2),outputBytes,maxRssMiB:+maxRssMiB.toFixed(2),node:process.version,platform:process.platform}));`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", source],
    { encoding: "utf8", timeout: 30_000 },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  process.stdout.write(result.stdout);
}
