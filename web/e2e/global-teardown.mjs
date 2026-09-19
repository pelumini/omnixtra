import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";

const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const fixtureRouteTarget = path.resolve("src", "app", "e2e");

export default async function globalTeardown() {
  await rm(fixtureRouteTarget, { force: true, recursive: true });
  await freePort(port);
}

function freePort(portValue) {
  if (process.platform === "win32") {
    return freeWindowsPort(portValue);
  }
  return freeUnixPort(portValue);
}

function freeWindowsPort(portValue) {
  const script = [
    `$port = ${JSON.stringify(portValue)}`,
    "$ids = netstat -ano | Select-String (':' + $port) | ForEach-Object {",
    "  $columns = -split $_.Line.Trim()",
    "  if ($columns.Length -ge 5 -and $columns[1] -match (':' + $port + '$') -and $columns[3] -eq 'LISTENING') { $columns[4] }",
    "} | Sort-Object -Unique",
    "foreach ($id in $ids) {",
    "  if ($id -match '^\\d+$') { Stop-Process -Id ([int]$id) -Force -ErrorAction SilentlyContinue }",
    "}",
  ].join("; ");

  return run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
}

function freeUnixPort(portValue) {
  return run("sh", ["-c", `command -v fuser >/dev/null 2>&1 && fuser -k ${portValue}/tcp || true`]);
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = execFile(command, args, { windowsHide: true }, () => {
      resolve();
    });
    child.once("error", () => {
      resolve();
    });
  });
}
