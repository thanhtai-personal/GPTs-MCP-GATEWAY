import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const viteCli = path.join(webRoot, "node_modules", "vite", "bin", "vite.js");

const child = spawn(
  process.execPath,
  [viteCli, "dev", "--host", "127.0.0.1", ...process.argv.slice(2)],
  {
    cwd: webRoot,
    env: process.env,
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
