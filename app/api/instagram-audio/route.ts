import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createReadStream, unlink, stat } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  formatYtDlpError,
  getYtDlpCookieArgs,
  getYtDlpNetworkArgs,
  getYtDlpRetryArgSets,
  shouldRetryYtDlpWithImpersonation,
} from "@/lib/ytdlpCookies";

export const maxDuration = 120;

function cleanup(path: string) {
  unlink(path, () => {});
}

type Format = "mp3" | "wav" | "mp4";

function isTikTokUrl(url: string) {
  return /^https?:\/\/((www|m|vm|vt)\.)?tiktok\.com\/.+/i.test(url);
}

function sanitizeFilename(name: string) {
  return name
    .normalize("NFC")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function contentDisposition(filename: string) {
  const safeFilename = sanitizeFilename(filename) || "download";
  const asciiFilename = safeFilename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`;
}

function runProcess(command: string, args: string[], timeoutMs = 120000) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`${command} timeout`));
    }, timeoutMs);

    proc.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d: Buffer) => {
      const text = d.toString();
      stderr += text;
      console.error(`[${command}]`, text);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || `${command} exit ${code}`));
    });
    proc.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function runYtDlpWithRetry(
  ytdlpPath: string,
  buildArgs: (cookieArgs: string[], networkArgs: string[]) => string[],
  cookieArgs: string[],
  networkArgs: string[],
  timeoutMs = 120000,
) {
  const attempts = getYtDlpRetryArgSets(cookieArgs, networkArgs);
  let lastError: unknown = null;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    try {
      return await runProcess(ytdlpPath, buildArgs(attempt.cookieArgs, attempt.networkArgs), timeoutMs);
    } catch (err) {
      lastError = err;
      const rawMsg = err instanceof Error ? err.message : "다운로드 실패";
      if (i === 0 && !shouldRetryYtDlpWithImpersonation(rawMsg)) throw err;
    }
  }

  throw lastError || new Error("다운로드 실패");
}

async function fetchTitle(ytdlpPath: string, url: string, cookieArgs: string[], networkArgs: string[]) {
  try {
    const { stdout } = await runProcess(ytdlpPath, [
      ...cookieArgs,
      ...networkArgs,
      "--print",
      "title",
      "--no-playlist",
      "--quiet",
      url,
    ], 15000);
    return sanitizeFilename(stdout.trim());
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { url, format = "wav" } = await req.json() as { url: string; format?: Format };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }
  const normalizedUrl = url.trim();

  const isProfileReelsPage = /instagram\.com\/[^/]+\/reels\/?$/.test(normalizedUrl);
  if (isProfileReelsPage) {
    return NextResponse.json(
      { error: "계정의 릴스 목록 페이지는 지원하지 않습니다. 개별 릴스 영상을 열고 '⋯ → 링크 복사'로 URL을 가져오세요." },
      { status: 400 },
    );
  }

  const isInstagram = /instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(normalizedUrl);
  const isYoutube = /youtube\.com\/(watch|shorts)|youtu\.be\//.test(normalizedUrl);
  const isTikTok = isTikTokUrl(normalizedUrl);

  if (!isInstagram && !isYoutube && !isTikTok) {
    return NextResponse.json(
      { error: "Instagram, YouTube 또는 TikTok URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const id = randomUUID();
  const cookieArgs = await getYtDlpCookieArgs();
  const networkArgs = getYtDlpNetworkArgs();
  const title = await fetchTitle(ytdlpPath, normalizedUrl, cookieArgs, networkArgs);

  // ── MP4 영상 다운로드 ──────────────────────────────────────
  if (format === "mp4") {
    const mp4File = join(tmpdir(), `vid_${id}.mp4`);

    try {
      await runYtDlpWithRetry(ytdlpPath, (activeCookieArgs, activeNetworkArgs) => [
          ...activeCookieArgs,
          ...activeNetworkArgs,
          "--format", "bestvideo[vcodec^=avc1]+bestaudio/bestvideo[ext=mp4]+bestaudio/best",
          "--merge-output-format", "mp4",
          "--postprocessor-args", "ffmpeg:-c:v copy -c:a aac -b:a 256k -ar 44100 -ac 2",
          "--no-playlist",
          "--output", mp4File,
          "--quiet",
          normalizedUrl,
        ], cookieArgs, networkArgs, 120000);

      const fileSize = await new Promise<number>((resolve, reject) =>
        stat(mp4File, (err, s) => err ? reject(err) : resolve(s.size))
      );

      const fileStream = createReadStream(mp4File);
      fileStream.on("close", () => cleanup(mp4File));

      return new Response(fileStream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(fileSize),
          "Content-Disposition": contentDisposition(`${title || "video"}.mp4`),
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      cleanup(mp4File);
      console.error("[mp4 error]", err);
      const rawMsg = err instanceof Error ? err.message : "영상 다운로드에 실패했습니다.";
      return NextResponse.json({ error: formatYtDlpError(rawMsg) }, { status: 500 });
    }
  }

  // ── 오디오 다운로드 (mp3 / wav) ───────────────────────────
  const rawFile = join(tmpdir(), `raw_${id}`);
  const outExt = format === "mp3" ? "mp3" : "wav";
  const outFile = join(tmpdir(), `out_${id}.${outExt}`);

  try {
    // 1단계: 최고음질 원본 다운로드
    await runYtDlpWithRetry(ytdlpPath, (activeCookieArgs, activeNetworkArgs) => [
        ...activeCookieArgs,
        ...activeNetworkArgs,
        "--format", "bestaudio",
        "--no-playlist",
        "--output", rawFile,
        "--quiet",
        normalizedUrl,
      ], cookieArgs, networkArgs, 120000);

    // 2단계: ffmpeg 변환
    const ffmpegArgs = format === "mp3"
      ? ["-i", rawFile, "-vn", "-acodec", "libmp3lame", "-q:a", "0", "-ar", "44100", "-ac", "2", "-y", outFile]
      : ["-i", rawFile, "-vn", "-acodec", "pcm_s16le", "-ar", "48000", "-ac", "2", "-y", outFile];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, ffmpegArgs);
      proc.stderr.on("data", (d: Buffer) => console.error("[ffmpeg]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
      proc.on("error", reject);
    });

    cleanup(rawFile);

    const fileSize = await new Promise<number>((resolve, reject) =>
      stat(outFile, (err, s) => err ? reject(err) : resolve(s.size))
    );

    const fileStream = createReadStream(outFile);
    fileStream.on("close", () => cleanup(outFile));

    const contentType = format === "mp3" ? "audio/mpeg" : "audio/wav";
    const filename = `${title || "audio"}.${outExt}`;

    return new Response(fileStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanup(rawFile);
    cleanup(outFile);
    console.error("[audio error]", err);
    const rawMsg = err instanceof Error ? err.message : "다운로드 실패";
    return NextResponse.json(
      { error: formatYtDlpError(rawMsg) },
      { status: 500 },
    );
  }
}
