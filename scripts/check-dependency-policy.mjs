import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const serverPackagePath = path.join(root, "server", "package.json");
const webPackagePath = path.join(root, "web", "package.json");
const localAgentPackagePath = path.join(root, "local-agent", "package.json");
const rootPackagePath = path.join(root, "package.json");
const serverLockPath = path.join(root, "server", "package-lock.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const problems = [];

const rootPackage = readJson(rootPackagePath);
const serverPackage = readJson(serverPackagePath);
const webPackage = readJson(webPackagePath);
const localAgentPackage = readJson(localAgentPackagePath);

for (const [name, pkg] of [
  ["root", rootPackage],
  ["server", serverPackage],
  ["web", webPackage],
  ["local-agent", localAgentPackage],
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

// Test tooling must stay on a matching pair: ts-jest 29.x supports jest 30.
// A forced audit fix once downgraded ts-jest to 25.x, which breaks tests.
const tsJest = serverPackage.devDependencies?.["ts-jest"];
if (!/^[\^~]?29\./u.test(String(tsJest ?? ""))) {
  problems.push(`ts-jest must stay on 29.x for jest 30; found ${JSON.stringify(tsJest)}`);
}
const jestVersion = serverPackage.devDependencies?.jest;
if (!/^[\^~]?30\./u.test(String(jestVersion ?? ""))) {
  problems.push(`jest must stay on 30.x; found ${JSON.stringify(jestVersion)}`);
}

// Multer 2.0.0 - 2.4.0 is affected by GHSA-3pph-fpjx-jg34 and GHSA-q7qp-rjg7-q26m.
const MULTER_MIN = [2, 4, 1];
const MULTER_MIN_TEXT = MULTER_MIN.join(".");

const parseVersion = (value) => {
  const match = String(value ?? "").match(/^[\^~]?(\d+)\.(\d+)\.(\d+)$/u);
  return match ? match.slice(1, 4).map(Number) : null;
};

const atLeast = (version, minimum) => {
  for (let index = 0; index < minimum.length; index += 1) {
    if (version[index] !== minimum[index]) return version[index] > minimum[index];
  }
  return true;
};

const multerOverride = parseVersion(serverPackage.overrides?.multer);
if (!multerOverride || multerOverride[0] !== 2 || !atLeast(multerOverride, MULTER_MIN)) {
  problems.push(`server package must override multer to a 2.x release >= ${MULTER_MIN_TEXT}`);
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

  const swagger = packages["node_modules/@nestjs/swagger"];
  if (swagger && parseMajor(swagger.version) !== 11) {
    problems.push(
      `lockfile resolves @nestjs/swagger ${swagger.version}; Swagger 11.x is required with Nest 11 (run npm run repair:server-deps)`,
    );
  }

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
    const resolved = parseVersion(multer.version);
    if (!resolved || !atLeast(resolved, MULTER_MIN)) {
      problems.push(
        `lockfile resolves vulnerable/unsupported multer ${multer.version}; require >=${MULTER_MIN_TEXT} (run npm --prefix server install)`,
      );
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(
  `dependency policy ok: Nest 11 pinned, Multer >= ${MULTER_MIN_TEXT}${
    fs.existsSync(serverLockPath) ? ", lockfile checked" : ", no lockfile yet"
  }`,
);
