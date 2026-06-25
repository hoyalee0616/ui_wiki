import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CookieStatus = {
  configured: boolean;
  source: "path" | "base64" | "raw" | null;
};

let cachedCookieFile: string | null = null;
let cachedCookieHash: string | null = null;

export function getYtDlpCookieStatus(): CookieStatus {
  if ((process.env.YT_COOKIES_PATH || process.env.YOUTUBE_COOKIES_PATH)?.trim()) {
    return { configured: true, source: "path" };
  }

  if ((process.env.YT_COOKIES_B64 || process.env.YOUTUBE_COOKIES_B64)?.trim()) {
    return { configured: true, source: "base64" };
  }

  if ((process.env.YT_COOKIES || process.env.YOUTUBE_COOKIES)?.trim()) {
    return { configured: true, source: "raw" };
  }

  return { configured: false, source: null };
}

export async function getYtDlpCookieArgs() {
  const cookiePath = (process.env.YT_COOKIES_PATH || process.env.YOUTUBE_COOKIES_PATH)?.trim();
  if (cookiePath) return ["--cookies", cookiePath];

  const base64Cookies = (process.env.YT_COOKIES_B64 || process.env.YOUTUBE_COOKIES_B64)?.trim();
  const rawCookies = (process.env.YT_COOKIES || process.env.YOUTUBE_COOKIES)?.trim();
  const content = base64Cookies
    ? Buffer.from(base64Cookies, "base64").toString("utf8")
    : rawCookies?.replace(/\\n/g, "\n");

  if (!content) return [];

  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
  if (cachedCookieFile && cachedCookieHash === hash) return ["--cookies", cachedCookieFile];

  const file = join(tmpdir(), `gomdol-yt-cookies-${hash}.txt`);
  await writeFile(file, content, { mode: 0o600 });
  cachedCookieFile = file;
  cachedCookieHash = hash;
  return ["--cookies", file];
}

export function cleanYtDlpError(message: string) {
  return message
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("Traceback"))
    .slice(0, 8)
    .join("\n")
    .trim();
}

export function formatYtDlpError(message: string) {
  const clean = cleanYtDlpError(message);
  if (/confirm you'?re not a bot|sign in to confirm|cookies/i.test(clean)) {
    return [
      "YouTube가 배포 서버 접속을 봇 확인으로 막았습니다.",
      "서버 환경변수에 YT_COOKIES_B64를 설정하거나, URL 대신 파일 업로드로 분리해 주세요.",
    ].join("\n");
  }

  return clean || "다운로드 실패";
}
