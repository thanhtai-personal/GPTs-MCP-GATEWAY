import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignored = new Set(["node_modules", "dist", ".git", ".output", ".vite"]);
const markdownFiles = [];

const requiredFiles = [
  "README.md",
  "README.vi.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "SUPPORT.md",
  "CHANGELOG.md",
  "LICENSE",
  "OPEN_SOURCE_POLICY.md",
  "COMMERCIAL.md",
  "docs/README.md",
  "docs/ARCHITECTURE.md",
  "docs/API_REFERENCE.md",
  "docs/GPT_PROTOCOL.md",
  "docs/SELF_HOSTING.md",
  "docs/SECURITY_MODEL.md",
  "docs/DATA_HANDLING.md",
  "docs/ADDING_MCP_PROVIDER.md",
  "docs/PROJECT_STATUS.md",
  "docs/TROUBLESHOOTING.md",
  "docs/OPEN_SOURCE_RELEASE.md",
  "docs/LICENSING.md",
  "docs/DEPENDENCY_SECURITY.md",
  ".github/REPOSITORY_RULES.md",
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) markdownFiles.push(full);
  }
}

walk(root);

const problems = [];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    problems.push(`missing required public document: ${rel}`);
  }
}

for (const file of markdownFiles) {
  const rel = path.relative(root, file);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/u);
  let inFence = false;

  for (const [index, line] of lines.entries()) {
    if (/^\s*```/u.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const links = [...line.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)];
    for (const match of links) {
      const raw = match[1].trim().replace(/^<|>$/gu, "");
      if (
        !raw ||
        raw.startsWith("#") ||
        /^[a-z][a-z0-9+.-]*:/iu.test(raw)
      ) {
        continue;
      }

      const targetRaw = raw.split("#", 1)[0].split("?", 1)[0];
      const target = path.resolve(path.dirname(file), decodeURIComponent(targetRaw));
      if (!fs.existsSync(target)) {
        problems.push(
          `${rel}:${index + 1}: broken relative link ${JSON.stringify(raw)}`,
        );
      }
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(
  `docs check ok: ${markdownFiles.length} markdown files, ${requiredFiles.length} required documents`,
);
