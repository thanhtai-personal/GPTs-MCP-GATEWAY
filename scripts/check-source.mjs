import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignored = new Set(["node_modules", "dist", ".git", ".output", ".vite"]);
const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".mjs"]);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
  }
}

walk(root);

const problems = [];
for (const file of files) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  if (text.includes("SUPABASE_SERVICE_ROLE_KEY") && rel.startsWith("web/")) {
    problems.push(`${rel}: browser source references SUPABASE_SERVICE_ROLE_KEY`);
  }
  if (/['"]\.\.\/\.\.\//u.test(text)) {
    problems.push(`${rel}: deep relative import found; prefer aliases`);
  }
  const lines = text.split(/\r?\n/u).length;
  if (lines > 430) problems.push(`${rel}: ${lines} lines (soft source limit exceeded)`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`source check ok: ${files.length} source files`);
