import { spawn } from "node:child_process";
import { cp, rm } from "node:fs/promises";
import path from "node:path";

const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const fixtureFlag =
  process.env.OMNIXTRA_E2E_FIXTURES ?? process.env.NEXT_PUBLIC_OMNIXTRA_E2E_FIXTURES ?? "1";
const isWindows = process.platform === "win32";
const e2eEnv = {
  ...process.env,
  NEXT_PUBLIC_OMNIXTRA_E2E_FIXTURES: fixtureFlag,
  OMNIXTRA_E2E_FIXTURES: fixtureFlag,
};
const fixtureRouteSource = path.resolve("e2e", "fixture-routes", "e2e");
const fixtureRouteTarget = path.resolve("src", "app", "e2e");

let activeProcess;
let stopping = false;

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => {
    void stopActiveProcess().finally(() => {
      process.exit(signal === "SIGINT" ? 130 : 143);
    });
  });
}

try {
  await removeFixtureRoutes();
  if (fixtureFlag === "1") {
    await cp(fixtureRouteSource, fixtureRouteTarget, { recursive: true });
  }

  console.error(`Building Next app for Playwright with e2e fixtures ${fixtureFlag}`);
  const buildExitCode = await runNext(["build"]);
  await removeFixtureRoutes();
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  console.error(`Starting Next production server for Playwright on port ${port}`);
  activeProcess = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", port],
    {
      env: e2eEnv,
      stdio: "inherit",
    },
  );

  activeProcess.once("error", (error) => {
    console.error(error);
    process.exit(1);
  });
  activeProcess.once("exit", (code, signal) => {
    if (stopping) {
      return;
    }
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
} catch (error) {
  await removeFixtureRoutes();
  console.error(error);
  process.exit(1);
}

async function removeFixtureRoutes() {
  await rm(fixtureRouteTarget, { force: true, recursive: true });
}

function runNext(args) {
  return new Promise((resolve, reject) => {
    activeProcess = spawn(process.execPath, ["./node_modules/next/dist/bin/next", ...args], {
      env: e2eEnv,
      stdio: "inherit",
    });
    activeProcess.once("error", reject);
    activeProcess.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`next ${args[0]} exited with signal ${signal}`));
        return;
      }
      activeProcess = undefined;
      resolve(code ?? 1);
    });
  });
}

async function stopActiveProcess() {
  if (stopping || !activeProcess?.pid || activeProcess.exitCode !== null) {
    return;
  }
  stopping = true;

  if (isWindows) {
    await taskkill(activeProcess.pid);
    return;
  }

  activeProcess.kill("SIGTERM");
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      activeProcess?.kill("SIGKILL");
      resolve();
    }, 5_000);
    activeProcess?.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function taskkill(pid) {
  return new Promise((resolve) => {
    const killer = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
    });
    const timeout = setTimeout(() => {
      killer.kill();
      resolve();
    }, 10_000);

    killer.once("error", () => {
      clearTimeout(timeout);
      resolve();
    });
    killer.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
