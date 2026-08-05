import { spawn } from "node:child_process";
import http from "node:http";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const isWindows = process.platform === "win32";
const buildTimeoutMs = numberFromEnv("E2E_BUILD_TIMEOUT_MS", 240_000);
const serverTimeoutMs = numberFromEnv("E2E_SERVER_TIMEOUT_MS", 60_000);
const testTimeoutMs = numberFromEnv("E2E_TEST_TIMEOUT_MS", 180_000);

let server;
const e2eEnv = {
  ...process.env,
  OMNIXTRA_E2E_FIXTURES: "1",
};

try {
  const buildExitCode = await run(process.execPath, ["./node_modules/next/dist/bin/next", "build"], {
    env: e2eEnv,
    label: "next build",
    timeoutMs: buildTimeoutMs,
  });
  if (buildExitCode !== 0) {
    process.exitCode = buildExitCode;
    throw new Error(`next build failed with exit code ${buildExitCode}`);
  }

  server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", port],
    {
      env: e2eEnv,
      stdio: "inherit",
    },
  );

  await waitForServer(baseURL, serverTimeoutMs);

  const exitCode = await run(
    process.execPath,
    ["./node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
    {
      env: {
        ...e2eEnv,
        PLAYWRIGHT_BASE_URL: baseURL,
        PLAYWRIGHT_SKIP_WEBSERVER: "1",
      },
      label: "playwright test",
      timeoutMs: testTimeoutMs,
    },
  );

  process.exitCode = exitCode;
} finally {
  await stopServer(server);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      stdio: options.stdio ?? "inherit",
    });
    const timeoutMs = options.timeoutMs ?? 0;
    const label = options.label ?? command;
    const timeout =
      timeoutMs > 0
        ? setTimeout(() => {
            if (settled) {
              return;
            }
            settled = true;
            console.error(`${label} timed out after ${timeoutMs}ms; terminating process ${child.pid}.`);
            void stopProcess(child).finally(() => resolve(124));
          }, timeoutMs)
        : undefined;

    child.once("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      reject(error);
    });
    child.once("exit", (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.once("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 500);
      });

      request.setTimeout(5_000, () => {
        request.destroy();
      });
    };

    check();
  });
}

async function stopServer(child) {
  if (!child?.pid || child.exitCode !== null) {
    return Promise.resolve();
  }

  await stopProcess(child);
}

async function stopProcess(child) {
  if (isWindows) {
    const exitCode = await taskkill(child.pid);
    if (exitCode !== 0 && child.exitCode === null) {
      child.kill();
    }
    child.unref();
    return;
  }

  child.kill("SIGTERM");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function taskkill(pid) {
  return new Promise((resolve) => {
    const child = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
    });
    const timeout = setTimeout(() => {
      child.kill();
      resolve(124);
    }, 10_000);

    child.once("error", () => {
      clearTimeout(timeout);
      resolve(1);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code ?? 1);
    });
  });
}

function numberFromEnv(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
