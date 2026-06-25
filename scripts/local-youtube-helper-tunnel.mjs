#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.GOMDOL_HELPER_PORT || 8787);
const HOST = process.env.GOMDOL_HELPER_HOST || "127.0.0.1";
const ORIGIN = `http://${HOST}:${PORT}`;

let helperProcess = null;
let tunnelProcess = null;
let printedTunnelUrl = false;

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isHelperReady() {
  try {
    const res = await fetch(`${ORIGIN}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    env: process.env,
    ...options,
  });

  child.on("error", (error) => {
    console.error(`${command} 실행 실패: ${error.message}`);
  });

  return child;
}

async function ensureHelper() {
  if (await isHelperReady()) {
    console.log(`Gomdol local YouTube helper already running: ${ORIGIN}`);
    return;
  }

  const helperScript = join(__dirname, "local-youtube-helper.mjs");
  helperProcess = spawnChild(process.execPath, [helperScript], { stdio: "inherit" });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(500);
    if (await isHelperReady()) return;
  }

  throw new Error("로컬 헬퍼가 시작되지 않았습니다.");
}

function printTunnelHint(url) {
  if (printedTunnelUrl) return;
  printedTunnelUrl = true;
  console.log("");
  console.log("Gomdol helper HTTPS tunnel:");
  console.log(url);
  console.log("");
  console.log("배포 페이지의 '배포용 헬퍼 주소'에 위 HTTPS 주소를 저장하세요.");
  console.log("");
}

function pipeTunnelOutput(stream) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match) printTunnelHint(match[0]);
  });
}

function cleanup() {
  if (tunnelProcess && !tunnelProcess.killed) tunnelProcess.kill("SIGTERM");
  if (helperProcess && !helperProcess.killed) helperProcess.kill("SIGTERM");
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

try {
  await ensureHelper();
  tunnelProcess = spawnChild("npx", [
    "--yes",
    "cloudflared@0.7.1",
    "tunnel",
    "--url",
    ORIGIN,
  ], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  pipeTunnelOutput(tunnelProcess.stdout);
  pipeTunnelOutput(tunnelProcess.stderr);

  tunnelProcess.on("close", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  cleanup();
  process.exit(1);
}
