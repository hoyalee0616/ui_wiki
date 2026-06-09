import { type NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createReadStream, stat, unlink } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);
const statAsync = promisify(stat);

export const maxDuration = 180;

const YT_URL_RE = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+/;

function sanitizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 200);
}

async function fetchTitle(ytdlpPath: string, url: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(ytdlpPath, ["--print", "title", "--no-playlist", url], {
      timeout: 15000,
    });
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

export async function POST(req: NextRequest) {
  const { url, format } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  if (!YT_URL_RE.test(url.trim())) {
    return NextResponse.json(
      { error: "유효한 YouTube URL을 입력해 주세요.\n예) https://www.youtube.com/watch?v=XXXXX" },
      { status: 400 },
    );
  }

  const isVideo = format === "video";
  const audioFmt = format === "audio-m4a" ? "m4a" : "mp3";
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ext = isVideo ? "mp4" : audioFmt;

  const rawTitle = await fetchTitle(ytdlpPath, url.trim());
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

  const args = isVideo
    ? [
        "--format", "bestvideo+bestaudio/best",
        "--format-sort", "vcodec:h264,ext:mp4",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--output", tmpFile,
        "--quiet",
        url.trim(),
      ]
    : [
        "--extract-audio",
        "--audio-format", audioFmt,
        ...(audioFmt === "mp3" ? ["--audio-quality", "0"] : []),
        "--no-playlist",
        "--output", tmpFile,
        "--quiet",
        url.trim(),
      ];

  try {
    await downloadToFile(ytdlpPath, args);
  } catch (err) {
    unlink(tmpFile, () => {});
    const msg = err instanceof Error ? err.message : "다운로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
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
