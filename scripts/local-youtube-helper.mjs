#!/usr/bin/env node

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";

const PORT = Number(process.env.GOMDOL_HELPER_PORT || 8787);
const HOST = process.env.GOMDOL_HELPER_HOST || "127.0.0.1";
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const COOKIE_BROWSER = (process.env.YT_HELPER_COOKIES_BROWSER || "chrome").trim();

const MEDIA_URL_RE = /^https?:\/\/(www\.)?((youtube\.com\/(watch\?.*v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+|instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+)/i;

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, Content-Type, X-Gomdol-Helper",
    "Private-Network-Access-ID": "02:00:00:00:87:87",
    "Private-Network-Access-Name": "gomdol-local-youtube-helper",
    "X-Gomdol-Helper": "local-youtube",
    ...extra,
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, corsHeaders({ "Content-Type": "application/json; charset=utf-8" }));
  res.end(JSON.stringify(payload));
}

function sanitizeFilename(name) {
  return name
    .normalize("NFC")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "youtube-download";
}

function contentTypeFor(file) {
  const ext = extname(file).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".wav") return "audio/wav";
  return "audio/mpeg";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("요청이 너무 큽니다."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function run(command, args, timeoutMs = 30 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} 실행 시간이 너무 오래 걸립니다.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `${command} exit ${code}`));
    });
  });
}

function cookieArgs() {
  if (!COOKIE_BROWSER || COOKIE_BROWSER.toLowerCase() === "none") return [];
  return ["--cookies-from-browser", COOKIE_BROWSER];
}

function ytdlpArgs(url, format, outPattern) {
  const common = [
    ...cookieArgs(),
    "--no-playlist",
    "--output",
    outPattern,
    "--quiet",
    "--no-warnings",
  ];

  if (format === "video" || format === "video-hq") {
    return [
      ...common,
      "--format",
      format === "video-hq"
        ? "bestvideo[height<=1080][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
        : "22/18/best[ext=mp4][vcodec^=avc1][acodec!=none][height<=720]/best[ext=mp4][acodec!=none][height<=720]/best[height<=720]",
      "--merge-output-format",
      "mp4",
      url,
    ];
  }

  const audioFormat = format === "audio-m4a" ? "m4a" : format === "audio-wav" ? "wav" : "mp3";
  return [
    ...common,
    "--format",
    "bestaudio/best",
    "--extract-audio",
    "--audio-format",
    audioFormat,
    ...(audioFormat === "mp3" ? ["--audio-quality", "0"] : []),
    url,
  ];
}

async function findOutputFile(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    if (entry.endsWith(".part") || entry.endsWith(".ytdl")) continue;
    const fullPath = join(dir, entry);
    const info = await stat(fullPath).catch(() => null);
    if (info?.isFile()) files.push({ fullPath, size: info.size });
  }
  files.sort((a, b) => b.size - a.size);
  return files[0] ?? null;
}

async function handleDownload(req, res) {
  const body = await readBody(req);
  const payload = JSON.parse(body || "{}");
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const format = typeof payload.format === "string" ? payload.format : "audio-mp3";

  if (!MEDIA_URL_RE.test(url)) {
    sendJson(res, 400, { error: "유효한 YouTube 또는 Instagram URL을 입력해 주세요." });
    return;
  }

  const workDir = await mkdtemp(join(tmpdir(), `gomdol-yt-${randomUUID()}-`));
  const outPattern = join(workDir, "%(title).180B.%(ext)s");

  try {
    await run(YTDLP, ytdlpArgs(url, format, outPattern));
    const file = await findOutputFile(workDir);
    if (!file) throw new Error("다운로드 결과 파일을 찾지 못했습니다.");

    const filename = sanitizeFilename(basename(file.fullPath));
    res.writeHead(200, corsHeaders({
      "Content-Type": contentTypeFor(file.fullPath),
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    }));

    const stream = createReadStream(file.fullPath);
    stream.pipe(res);
    res.on("close", () => {
      rm(workDir, { recursive: true, force: true }).catch(() => {});
    });
  } catch (error) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    sendJson(res, 500, {
      error: error instanceof Error ? error.message.slice(0, 900) : "로컬 다운로드에 실패했습니다.",
    });
  }
}

async function handleHealth(res) {
  try {
    const { stdout } = await run(YTDLP, ["--version"], 10000);
    sendJson(res, 200, {
      ok: true,
      helper: "gomdol-local-youtube",
      ytdlp: stdout.trim(),
      cookiesFromBrowser: COOKIE_BROWSER || null,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "yt-dlp를 실행할 수 없습니다.",
    });
  }
}

createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    if (req.method === "GET" && url.pathname === "/health") {
      await handleHealth(res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/download") {
      await handleDownload(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "로컬 헬퍼 오류",
    });
  }
}).listen(PORT, HOST, () => {
  console.log(`Gomdol local YouTube helper: http://${HOST}:${PORT}`);
  console.log(`yt-dlp: ${YTDLP}`);
  console.log(`cookies browser: ${COOKIE_BROWSER || "none"}`);
});
