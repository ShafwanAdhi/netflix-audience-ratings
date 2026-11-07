import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const windows = process.platform === "win32";
const python = resolve(
  windows ? ".venv/Scripts/python.exe" : ".venv/bin/python",
);
if (!existsSync(python)) {
  console.error("Run uv sync --all-packages first.");
  process.exit(1);
}
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    if (windows)
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    else child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 700);
}
function start(command, args, cwd = process.cwd()) {
  const child = spawn(command, args, {
    stdio: "inherit",
    cwd,
    windowsHide: true,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
start(python, [
  "-m",
  "uvicorn",
  "netflix_api.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  "8000",
]);
start(
  process.execPath,
  [
    resolve("apps/web/node_modules/vite/bin/vite.js"),
    "--host",
    "127.0.0.1",
    "--clearScreen",
    "false",
  ],
  resolve("apps/web"),
);
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
