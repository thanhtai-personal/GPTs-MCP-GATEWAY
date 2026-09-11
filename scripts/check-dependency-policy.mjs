import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const serverPackagePath = path.join(root, "server", "package.json");
const webPackagePath = path.join(root, "web", "package.json");
const rootPackagePath = path.join(root, "package.json");
const serverLockPath = path.join(root, "server", "package-lock.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const problems = [];

const rootPackage = readJson(rootPackagePath);
const serverPackage = readJson(serverPackagePath);
const webPackage = readJson(webPackagePath);

for (const [name, pkg] of [
  ["root", rootPackage],
  ["server", serverPackage],
  ["web", webPackage],
]) {
  if (pkg.license !== "AGPL-3.0-or-later") {
    problems.push(`${name} package license must be AGPL-3.0-or-later`);
  }
}

const expectedNestVersions = {
  "@nestjs/common": "11.2.3",
  "@nestjs/core": "11.2.3",
  "@nestjs/platform-express": "11.2.3",
  "@nestjs/swagger": "11.4.7",
  "@nestjs/throttler": "6.5.0",
  "@nestjs/cli": "11.0.24",
  "@nestjs/testing": "11.2.3",
};

for (const [dependency, expected] of Object.entries(expectedNestVersions)) {
  const actual =
    serverPackage.dependencies?.[dependency] ??
    serverPackage.devDependencies?.[dependency];

  if (actual !== expected) {
    problems.push(
      `${dependency} must be pinned to ${expected}; found ${JSON.stringify(actual)}`,
    );
  }
}

if (serverPackage.overrides?.multer !== "2.3.0") {
  problems.push("server package must override multer to 2.3.0");
}

const invalidInstallFlags = [
  serverPackage.config?.["legacy-peer-deps"],
  serverPackage.config?.force,
].filter(Boolean);

if (invalidInstallFlags.length) {
  problems.push("server package must not enable forced/legacy peer dependency installs");
}

const parseMajor = (version) => {
  const match = String(version ?? "").match(/^(\d+)\./u);
  return match ? Number(match[1]) : null;
};

if (fs.existsSync(serverLockPath)) {
  const lock = readJson(serverLockPath);
  const packages = lock.packages ?? {};

  const resolvedNestPackages = [
    "@nestjs/common",
    "@nestjs/core",
    "@nestjs/platform-express",
    "@nestjs/testing",
  ];

  for (const dependency of resolvedNestPackages) {
    const entry = packages[`node_modules/${dependency}`];
    if (!entry) {
      problems.push(`lockfile is missing ${dependency}`);
      continue;
    }

    if (parseMajor(entry.version) !== 11) {
      problems.push(
        `lockfile resolves ${dependency} to unsupported ${entry.version}; Nest 11 is required`,
      );
    }
  }

  const multer = packages["node_modules/multer"];
  if (!multer) {
    problems.push("lockfile is missing multer");
  } else {
    const [major, minor] = String(multer.version)
      .split(".")
      .slice(0, 2)
      .map(Number);

    if (
      !Number.isInteger(major) ||
      !Number.isInteger(minor) ||
      major < 2 ||
      (major === 2 && minor < 3)
    ) {
      problems.push(
        `lockfile resolves vulnerable/unsupported multer ${multer.version}; require >=2.3.x`,
      );
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(
  `dependency policy ok: Nest 11 pinned, Multer override 2.3.0${
    fs.existsSync(serverLockPath) ? ", lockfile checked" : ", no lockfile yet"
  }`,
);
