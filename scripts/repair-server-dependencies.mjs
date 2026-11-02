import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const serverRoot = path.join(root, "server");
const packagePath = path.join(serverRoot, "package.json");
const lockPath = path.join(serverRoot, "package-lock.json");
const nodeModulesPath = path.join(serverRoot, "node_modules");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

pkg.license = "AGPL-3.0-or-later";
pkg.scripts = {
  ...pkg.scripts,
  build: "nest build --path tsconfig.build.json",
  start: "nest start --path tsconfig.build.json",
  "start:dev": "nest start --watch --path tsconfig.build.json",
  "start:prod": "node dist/main.js",
  typecheck: "tsc --noEmit -p tsconfig.json",
  test: "jest",
  "deps:reset": "node scripts/reset-dependency-tree.mjs",
  audit: "npm audit --audit-level=high",
  "audit:prod": "npm audit --omit=dev --audit-level=high",
};

pkg.dependencies = {
  ...pkg.dependencies,
  "@nestjs/common": "11.2.3",
  "@nestjs/core": "11.2.3",
  "@nestjs/platform-express": "11.2.3",
  "@nestjs/swagger": "11.4.7",
  "@nestjs/throttler": "6.5.0",
};

pkg.devDependencies = {
  ...pkg.devDependencies,
  "@nestjs/cli": "11.0.24",
  "@nestjs/testing": "11.2.3",
  jest: "^30.0.0",
  "ts-jest": "29.4.15",
};

pkg.engines = {
  node: ">=24 <25",
  npm: ">=11",
};

pkg.overrides = {
  ...pkg.overrides,
  multer: "^2.4.1",
};

delete pkg.config?.["legacy-peer-deps"];
delete pkg.config?.force;
if (pkg.config && Object.keys(pkg.config).length === 0) {
  delete pkg.config;
}

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log("rewrote server/package.json to the reviewed Nest 11 dependency policy");

for (const target of [nodeModulesPath, lockPath]) {
  if (!fs.existsSync(target)) {
    console.log(`skip: ${path.relative(root, target)} does not exist`);
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed: ${path.relative(root, target)}`);
}

console.log("");
console.log("Next:");
console.log("  npm --prefix server install");
console.log("  npm --prefix server ls @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger @nestjs/testing multer");
console.log("  npm --prefix server audit --audit-level=high");
console.log("  npm --prefix server run typecheck");
console.log("  npm --prefix server run build");
console.log("  npm --prefix server test -- --runInBand");
console.log("");
console.log("Do not run npm audit fix --force.");
