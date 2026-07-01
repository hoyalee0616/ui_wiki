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

type YtDlpRetryArgSet = {
  cookieArgs: string[];
  networkArgs: string[];
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
  const jsRuntime = (
    process.env.YTDLP_JS_RUNTIME ||
    process.env.YOUTUBE_JS_RUNTIME ||
    process.env.INSTAGRAM_JS_RUNTIME ||
    "node"
  ).trim();

  if (jsRuntime && jsRuntime.toLowerCase() !== "none") {
    args.push("--js-runtimes", jsRuntime);
  }

  const remoteComponents = (
    process.env.YTDLP_REMOTE_COMPONENTS ||
    process.env.YOUTUBE_REMOTE_COMPONENTS ||
    process.env.INSTAGRAM_REMOTE_COMPONENTS ||
    "ejs:github"
  ).trim();

  if (remoteComponents && remoteComponents.toLowerCase() !== "none") {
    args.push("--remote-components", remoteComponents);
  }

  if (proxy) args.push("--proxy", proxy);
  if (forceIp === "4") args.push("--force-ipv4");
  if (forceIp === "6") args.push("--force-ipv6");
  if (impersonate) args.push("--impersonate", impersonate);

  return args;
}

export function getYtDlpImpersonationRetryArgs() {
  const retryTarget = (
    process.env.YTDLP_RETRY_IMPERSONATE ||
    process.env.YT_DLP_RETRY_IMPERSONATE ||
    process.env.YTDLP_IMPERSONATE ||
    "chrome"
  )?.trim();

  if (!retryTarget || retryTarget.toLowerCase() === "none") return [];

  const current = getYtDlpNetworkArgs();
  if (current.includes("--impersonate")) return current;
  return [...current, "--impersonate", retryTarget];
}

function withoutPairedOptions(args: string[], options: Set<string>) {
  const next = [];
  for (let i = 0; i < args.length; i += 1) {
    if (options.has(args[i])) {
      i += 1;
      continue;
    }
    next.push(args[i]);
  }
  return next;
}

function withOverrides(baseArgs: string[], extraArgs: string[]) {
  const pairedOptions = new Set(["--impersonate", "--extractor-args", "--add-header"]);
  return [...withoutPairedOptions(baseArgs, pairedOptions), ...extraArgs];
}

function addUniqueArgSet(sets: YtDlpRetryArgSet[], cookieArgs: string[], networkArgs: string[]) {
  const key = `${cookieArgs.join("\0")}\u0001${networkArgs.join("\0")}`;
  if (sets.some((set) => `${set.cookieArgs.join("\0")}\u0001${set.networkArgs.join("\0")}` === key)) return;
  sets.push({ cookieArgs, networkArgs });
}

export function getYtDlpRetryArgSets(cookieArgs: string[], networkArgs: string[]) {
  const retryTarget = (
    process.env.YTDLP_RETRY_IMPERSONATE ||
    process.env.YT_DLP_RETRY_IMPERSONATE ||
    "chrome"
  )?.trim();

  const cookieVariants = cookieArgs.length > 0 ? [cookieArgs, []] : [cookieArgs];
  const networkVariants = [
    networkArgs,
    ...(retryTarget && retryTarget.toLowerCase() !== "none"
      ? [withOverrides(networkArgs, ["--impersonate", retryTarget])]
      : []),
    withOverrides(networkArgs, ["--impersonate", "safari", "--extractor-args", "youtube:player_client=web_safari"]),
    withOverrides(networkArgs, ["--extractor-args", "youtube:player_client=android_vr,web_safari,web"]),
    withOverrides(networkArgs, ["--extractor-args", "youtube:player_client=web_embedded,web_safari,web", "--add-header", "Referer:https://www.youtube.com/"]),
  ];

  const sets: YtDlpRetryArgSet[] = [];
  for (const activeNetworkArgs of networkVariants) {
    for (const activeCookieArgs of cookieVariants) {
      addUniqueArgSet(sets, activeCookieArgs, activeNetworkArgs);
    }
  }
  return sets;
}

export function shouldRetryYtDlpWithImpersonation(message: string) {
  const clean = cleanYtDlpError(message);
  return /bot|captcha|confirm you'?re not a bot|sign in to confirm|http error 403|forbidden|cloudflare|tls|impersonat|unable to download webpage|n challenge solving failed|js challenge|requested format is not available|format extraction|only images are available/i.test(clean);
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

  if (/n challenge solving failed|js challenge|requested format is not available|format extraction|only images are available/i.test(clean)) {
    return [
      "영상 포맷 추출에 실패했습니다.",
      "서버의 yt-dlp JS challenge 처리가 실패한 상태입니다.",
      "YTDLP_JS_RUNTIME=node, YTDLP_REMOTE_COMPONENTS=ejs:github 설정과 최신 yt-dlp가 필요합니다.",
    ].join("\n");
  }

  if (/impersonate target .* not available|missing dependencies required to support this target|curl_cffi/i.test(clean)) {
    return [
      "서버의 브라우저 위장 다운로드 의존성이 부족합니다.",
      "yt-dlp[default,curl-cffi]가 설치된 새 배포가 필요합니다.",
    ].join("\n");
  }

  return clean || "다운로드 실패";
}
