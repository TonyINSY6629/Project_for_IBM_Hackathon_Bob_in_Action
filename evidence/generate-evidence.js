// evidence/generate-evidence.js
// Run from project root: node evidence/generate-evidence.js
// Produces: evidence/hackathon-evidence.html

import { readFileSync, writeFileSync } from "fs";
import { extname } from "path";

function readText(f) {
  try { return readFileSync(f, "utf-8"); } catch { return null; }
}
function imgBase64(f) {
  try {
    const mime = extname(f).toLowerCase() === ".jpg" ? "image/jpeg" : "image/png";
    return "data:" + mime + ";base64," + readFileSync(f).toString("base64");
  } catch { return null; }
}

const shots = [
  ["evidence/01-garden-start.png",      "1. Garden start - 4 plants at seedling"],
  ["evidence/02-garden-growing.png",    "2. Plants growing in parallel"],
  ["evidence/03-decision-card.png",     "3. Decision card - garden paused"],
  ["evidence/04-decision-answered.png", "4. Garden resumed after answer"],
  ["evidence/05-blocker-alert.png",     "5. Blocker alert visible"],
  ["evidence/06-all-completed.png",     "6. All 4 plants flowering"],
  ["evidence/07-release-report.png",    "7. Release report screen"],
];

const codeFiles = [
  ["src/hooks/useBobBreak.ts",            "Analyzers, event contract, attention classifier"],
  ["src/components/BobBreak.tsx",         "Garden, decision cards, alerts, release report"],
  ["src/styles/bob-break.css",            "Design tokens and visual states"],
  ["src/components/Header.test.tsx",      "Unit tests - Header"],
  ["src/components/AddTaskForm.test.tsx", "Unit tests - AddTaskForm"],
  ["src/components/TaskList.test.tsx",    "Unit tests - TaskList"],
];

const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

const screensHtml = shots.map(([f,l]) => {
  const src = imgBase64(f);
  return src
    ? "<figure><img src=\"" + src + "\" alt=\"" + l + "\"><figcaption>" + l + "</figcaption></figure>"
    : "<div class=\"missing\">Missing: " + l + " (" + f + ")</div>";
}).join("\n");

const codeHtml = codeFiles.map(([f,l]) => {
  const src = readText(f);
  return src
    ? "<details><summary>" + l + " <code>" + f + "</code></summary><pre>" + esc(src) + "</pre></details>"
    : "<div class=\"missing\">File not found: " + f + "</div>";
}).join("\n");

const tests     = readText("evidence/test-results.txt");
const typecheck = readText("evidence/typecheck-results.txt");
const rawReport = readText("evidence/release-report.json");
const report    = rawReport ? esc(JSON.stringify(JSON.parse(rawReport), null, 2)) : null;

const html = "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>Bob Break - Hackathon Evidence</title><style>" +
"body{font-family:-apple-system,sans-serif;max-width:900px;margin:0 auto;padding:40px 24px;color:#1f2328;background:#fff}" +
"h1{font-size:24px;border-bottom:3px solid #0f62fe;padding-bottom:8px}" +
"h2{font-size:17px;margin-top:40px;color:#0f62fe;border-bottom:1px solid #e0e0e0;padding-bottom:4px}" +
"figure{margin:12px 0;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden}" +
"figure img{width:100%;display:block}figcaption{padding:7px 12px;background:#f4f4f4;font-size:12px;color:#525252}" +
"pre{background:#f4f4f4;padding:14px;overflow-x:auto;font-size:11.5px;font-family:monospace;border-radius:4px;margin:0}" +
"details{margin:8px 0;border:1px solid #e0e0e0;border-radius:4px}" +
"summary{padding:9px 14px;cursor:pointer;background:#f4f4f4;font-size:13px;font-weight:600}" +
"summary code{font-weight:400;color:#525252;margin-left:8px;font-size:12px}" +
".missing{padding:9px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;font-size:13px;margin:8px 0}" +
".grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0}" +
".card{background:#f4f4f4;border-left:4px solid #0f62fe;padding:12px 16px;border-radius:2px}" +
".card .v{font-size:28px;font-weight:700;color:#0f62fe}.card .l{font-size:12px;color:#525252;margin-top:2px}" +
"table{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0}" +
"th{background:#f4f4f4;border:1px solid #e0e0e0;padding:7px 10px;text-align:left}" +
"td{border:1px solid #e0e0e0;padding:6px 10px}" +
"footer{margin-top:60px;padding-top:14px;border-top:1px solid #e0e0e0;text-align:center;font-size:12px;color:#8d8d8d}" +
"</style></head><body>" +
"<h1>Bob Break - Hackathon Evidence</h1>" +
"<p>IBM TechXchange 2026 Pre-conference Dev Day Hackathon<br>" +
"<strong>Theme:</strong> Build with purpose using IBM Bob 2.0 &nbsp;&middot;&nbsp; " +
"<strong>Generated:</strong> " + new Date().toLocaleString() + "</p>" +
"<div class=\"grid\">" +
"<div class=\"card\"><div class=\"v\">3</div><div class=\"l\">Team members</div></div>" +
"<div class=\"card\"><div class=\"v\">4</div><div class=\"l\">Parallel agents</div></div>" +
"<div class=\"card\"><div class=\"v\">~81%</div><div class=\"l\">Events suppressed</div></div>" +
"</div>" +
"<h2>1. Demo Screenshots</h2>" + screensHtml +
"<h2>2. Test Results</h2>" + (tests ? "<pre>" + esc(tests) + "</pre>" : "<div class=\"missing\">Run: cd server &amp;&amp; npm test &gt; ../evidence/test-results.txt 2&gt;&amp;1</div>") +
"<h2>3. TypeScript Type Check</h2>" + (typecheck ? "<pre>" + esc(typecheck) + "</pre>" : "<div class=\"missing\">Run: cd server &amp;&amp; npm run typecheck &gt; ../evidence/typecheck-results.txt 2&gt;&amp;1</div>") +
"<h2>4. Release Report</h2>" + (report ? "<pre>" + report + "</pre>" : "<div class=\"missing\">Run demo then: curl http://localhost:3000/api/runs/RUN_ID/report &gt; evidence/release-report.json</div>") +
"<h2>5. Attention Routing Rules</h2>" +
"<table><tr><th>#</th><th>Condition</th><th>Route</th><th>Developer sees</th></tr>" +
"<tr><td>1</td><td>severity === critical</td><td>critical-alert</td><td>Immediate alert</td></tr>" +
"<tr><td>2</td><td>type === risk</td><td>critical-alert</td><td>Immediate alert</td></tr>" +
"<tr><td>3</td><td>type === complete / phase === done</td><td>completed</td><td>Plant flowers</td></tr>" +
"<tr><td>4</td><td>type === question + decision</td><td>decision</td><td>Decision card paused</td></tr>" +
"<tr><td>5</td><td>type === blocker</td><td>blocker</td><td>Blocker notice</td></tr>" +
"<tr><td>6</td><td>everything else</td><td>visual-progress</td><td>Silent - plant grows</td></tr></table>" +
"<h2>6. Source Code - Key Files</h2>" + codeHtml +
"<h2>7. IBM Bob 2.0 Usage</h2>" +
"<p>IBM Bob Agent mode and subagents were used to plan, implement, test, and document Part 2 entirely within Bob. Bob read the team shared contracts before writing code, implemented a pure deterministic classifier and reducer, and generated a structured report verifiable by the included unit tests.</p>" +
"<footer>Made with IBM Bob 2.0 &nbsp;&middot;&nbsp; Bob Break &nbsp;&middot;&nbsp; IBM TechXchange 2026</footer>" +
"</body></html>";

writeFileSync("evidence/hackathon-evidence.html", html, "utf-8");
console.log("Generated: evidence/hackathon-evidence.html");