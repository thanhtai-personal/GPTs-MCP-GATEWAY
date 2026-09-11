import fs from "node:fs";
import path from "node:path";

const serverRoot = path.resolve(import.meta.dirname, "..");
const targets = [
  path.join(serverRoot, "node_modules"),
  path.join(serverRoot, "package-lock.json"),
];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.log(`skip: ${path.basename(target)} does not exist`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed: ${path.basename(target)}`);
}

console.log("");
console.log("Dependency tree reset.");
console.log("Next:");
console.log("  npm install");
console.log(
  "  npm ls @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger @nestjs/testing multer",
);
console.log("  npm audit --audit-level=high");
console.log("  npm run typecheck && npm run build && npm test -- --runInBand");
console.log("");
console.log("Do not run npm audit fix --force.");
