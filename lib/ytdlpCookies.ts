import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CookieStatus = {
  configured: boolean;
  source: "path" | "base64" | "raw" | null;
};

type NetworkStatus = {
  proxy: boolean;
  forceIp: "4" | "6" | null;
  impersonate: string | null;
};

let cachedCookieFile: string | null = null;
let cachedCookieHash: string | null = null;

export function getYtDlpCookieStatus(): CookieStatus {
  if ((process.env.YT_COOKIES_PATH || process.env.YOUTUBE_COOKIES_PATH || process.env.INSTAGRAM_COOKIES_PATH)?.trim()) {
    return { configured: true, source: "path" };
  }

  if ((process.env.YT_COOKIES_B64 || process.env.YOUTUBE_COOKIES_B64 || process.env.INSTAGRAM_COOKIES_B64)?.trim()) {
    return { configured: true, source: "base64" };
  }

  if ((process.env.YT_COOKIES || process.env.YOUTUBE_COOKIES || process.env.INSTAGRAM_COOKIES)?.trim()) {
    return { configured: true, source: "raw" };
  }

  return { configured: false, source: null };
}

export async function getYtDlpCookieArgs() {
  const cookiePath = (
    process.env.YT_COOKIES_PATH ||
    process.env.YOUTUBE_COOKIES_PATH ||
    process.env.INSTAGRAM_COOKIES_PATH
  )?.trim();
  if (cookiePath) return ["--cookies", cookiePath];

  const base64Cookies = (
    process.env.YT_COOKIES_B64 ||
    process.env.YOUTUBE_COOKIES_B64 ||
    process.env.INSTAGRAM_COOKIES_B64
  )?.trim();
  const rawCookies = (
    process.env.YT_COOKIES ||
    process.env.YOUTUBE_COOKIES ||
    process.env.INSTAGRAM_COOKIES
  )?.trim();
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

export function getYtDlpNetworkArgs() {
  const proxy = (
    process.env.YTDLP_PROXY ||
    process.env.YT_DLP_PROXY ||
    process.env.YOUTUBE_PROXY ||
    process.env.INSTAGRAM_PROXY
  )?.trim();

  const forceIp = normalizeForceIp(
    process.env.YTDLP_FORCE_IP ||
    process.env.YT_DLP_FORCE_IP ||
    process.env.YOUTUBE_FORCE_IP ||
    process.env.INSTAGRAM_FORCE_IP,
  );
  const impersonate = (
    process.env.YTDLP_IMPERSONATE ||
    process.env.YT_DLP_IMPERSONATE ||
    process.env.YOUTUBE_IMPERSONATE ||
    process.env.INSTAGRAM_IMPERSONATE
  )?.trim();

  const args = [];
  if (proxy) args.push("--proxy", proxy);
  if (forceIp === "4") args.push("--force-ipv4");
  if (forceIp === "6") args.push("--force-ipv6");
  if (impersonate) args.push("--impersonate", impersonate);

  return args;
}

export function getYtDlpNetworkStatus(): NetworkStatus {
  const proxy = Boolean((
    process.env.YTDLP_PROXY ||
    process.env.YT_DLP_PROXY ||
    process.env.YOUTUBE_PROXY ||
    process.env.INSTAGRAM_PROXY
  )?.trim());
  const forceIp = normalizeForceIp(
    process.env.YTDLP_FORCE_IP ||
    process.env.YT_DLP_FORCE_IP ||
    process.env.YOUTUBE_FORCE_IP ||
    process.env.INSTAGRAM_FORCE_IP,
  );
  const impersonate = (
    process.env.YTDLP_IMPERSONATE ||
    process.env.YT_DLP_IMPERSONATE ||
    process.env.YOUTUBE_IMPERSONATE ||
    process.env.INSTAGRAM_IMPERSONATE
  )?.trim() || null;

  return { proxy, forceIp, impersonate };
}

function normalizeForceIp(value?: string) {
  const mode = value?.trim().toLowerCase();
  if (mode === "4" || mode === "ipv4") return "4";
  if (mode === "6" || mode === "ipv6") return "6";
  return null;
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
    if (getYtDlpCookieStatus().configured) {
      return [
        "영상 사이트가 현재 배포 서버 IP를 봇 확인으로 차단했습니다.",
        "쿠키는 설정되어 있지만 서버 네트워크가 막힌 상태라 URL 대신 파일 업로드를 사용해 주세요.",
        "URL 처리가 꼭 필요하면 YTDLP_PROXY에 신뢰 가능한 프록시나 다른 서버 IP를 설정해야 합니다.",
      ].join("\n");
    }

    return [
      "영상 사이트가 배포 서버 접속을 봇 확인으로 막았습니다.",
      "서버 환경변수에 YT_COOKIES_B64 또는 INSTAGRAM_COOKIES_B64를 설정하거나, URL 대신 파일 업로드를 사용해 주세요.",
    ].join("\n");
  }

  return clean || "다운로드 실패";
}
