const fs = require("fs");
const report = require("./.eslint-report.json");
const list = fs
  .readFileSync("./.staged-ts.txt", "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((s) => s.trim().toLowerCase());
const set = new Set(list);
let files = 0;
let errs = 0;
let warns = 0;
for (const f of report) {
  const rel = f.filePath.replace(/\\/g, "/").toLowerCase();
  const i = rel.indexOf("frontend/");
  if (i < 0) continue;
  const p = rel.substring(i);
  if (!set.has(p)) continue;
  if (!f.errorCount && !f.warningCount) continue;
  files += 1;
  errs += f.errorCount;
  warns += f.warningCount;
  console.log(`${f.errorCount}e/${f.warningCount}w ${p}`);
  for (const m of f.messages) {
    if (m.severity === 2) {
      console.log(`   ${m.line}:${m.column} ${m.ruleId} ${m.message.slice(0, 90)}`);
    }
  }
}
console.log("---");
console.log("files", files, "errors", errs, "warnings", warns);
