import { type NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createReadStream, stat, unlink } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { formatYtDlpError, getYtDlpCookieArgs } from "@/lib/ytdlpCookies";

const execFileAsync = promisify(execFile);
const statAsync = promisify(stat);

export const maxDuration = 180;

const YT_URL_RE = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+/;

function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 200);
}

async function fetchTitle(ytdlpPath: string, url: string, cookieArgs: string[]): Promise<string> {
  try {
    const args = [
      "--print", "title",
      "--no-playlist",
      "--extractor-args", "youtube:player_client=web_safari,web,tv",
    ];
    args.push(...cookieArgs);
    args.push(url);
    const { stdout } = await execFileAsync(ytdlpPath, args, { timeout: 15000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function downloadToFile(ytdlpPath: string, args: string[]): Promise<void> {
  await execFileAsync(ytdlpPath, args, { maxBuffer: 1024 * 1024 * 1024 });
}

function streamFile(tmpFile: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const rs = createReadStream(tmpFile);
      rs.on("data", (chunk) => controller.enqueue(chunk));
      rs.on("end", () => {
        controller.close();
        unlink(tmpFile, () => {});
      });
      rs.on("error", (err) => {
        controller.error(err);
        unlink(tmpFile, () => {});
      });
    },
  });
}

async function handleYoutubeDownload(url: unknown, format: unknown) {
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  if (!YT_URL_RE.test(url.trim())) {
    return NextResponse.json(
      { error: "유효한 YouTube URL을 입력해 주세요.\n예) https://www.youtube.com/watch?v=XXXXX" },
      { status: 400 },
    );
  }

  const isVideo = format === "video" || format === "video-hq";
  const isHighQualityVideo = format === "video-hq";
  const audioFmt = format === "audio-m4a" ? "m4a" : "mp3";
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ext = isVideo ? "mp4" : audioFmt;

  const cookieArgs = await getYtDlpCookieArgs();
  const rawTitle = await fetchTitle(ytdlpPath, url.trim(), cookieArgs);
  const safeTitle = rawTitle ? sanitizeFilename(rawTitle) : (isVideo ? "youtube_video" : "youtube_audio");
  const filename = `${safeTitle}.${ext}`;
  const asciiFilename = safeTitle.replace(/[^\x20-\x7E]/g, "_") + "." + ext;
  const encodedFilename = encodeURIComponent(filename);

  const contentType = isVideo ? "video/mp4" : audioFmt === "m4a" ? "audio/mp4" : "audio/mpeg";
  const dispositionHeader = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
  const commonHeaders = {
    "Content-Type": contentType,
    "Content-Disposition": dispositionHeader,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };

  const tmpFile = join(tmpdir(), `yt-${randomUUID()}.${ext}`);

  // 봇 감지 우회: 쿠키 파일이 설정된 서버에서는 쿠키를 사용하고, 로컬처럼 파일이 없으면 생략합니다.
  const commonArgs = [
    ...cookieArgs,
    "--extractor-args", "youtube:player_client=web_safari,web,tv",
    "--no-playlist",
    "--output", tmpFile,
    "--quiet",
  ];

  const args = isVideo
    ? [
        "--format",
        isHighQualityVideo
          ? "bestvideo[height<=1080][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
          : "22/18/best[ext=mp4][vcodec^=avc1][acodec!=none][height<=720]/best[ext=mp4][acodec!=none][height<=720]/best[height<=720]",
        "--merge-output-format", "mp4",
        ...commonArgs,
        url.trim(),
      ]
    : [
        "--extract-audio",
        "--audio-format", audioFmt,
        ...(audioFmt === "mp3" ? ["--audio-quality", "0"] : []),
        ...commonArgs,
        url.trim(),
      ];

  try {
    await downloadToFile(ytdlpPath, args);
  } catch (err) {
    unlink(tmpFile, () => {});
    const rawMsg = err instanceof Error ? err.message : "다운로드 실패";
    return NextResponse.json({ error: formatYtDlpError(rawMsg) }, { status: 500 });
  }

  // 파일 크기를 Content-Length로 전달 → 브라우저가 압축 해제 시도 안 함
  let contentLength: string | undefined;
  try {
    const s = await statAsync(tmpFile);
    contentLength = String(s.size);
  } catch {}

  return new Response(streamFile(tmpFile), {
    headers: {
      ...commonHeaders,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    },
  });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  return handleYoutubeDownload(searchParams.get("url"), searchParams.get("format") || "audio-mp3");
}

export async function POST(req: NextRequest) {
  const { url, format } = await req.json();
  return handleYoutubeDownload(url, format);
}
