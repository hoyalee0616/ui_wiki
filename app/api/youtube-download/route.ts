import { type NextRequest, NextResponse } from "next/server";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

  const isAudio = format === "audio";
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";

  const rawTitle = await fetchTitle(ytdlpPath, url.trim());
  const safeTitle = rawTitle ? sanitizeFilename(rawTitle) : (isAudio ? "youtube_audio" : "youtube_video");
  const ext = isAudio ? "mp3" : "mp4";
  const filename = `${safeTitle}.${ext}`;

  const encodedFilename = encodeURIComponent(filename);

  const args = isAudio
    ? [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--output", "-",
        "--quiet",
        url.trim(),
      ]
    : [
        "--format", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--output", "-",
        "--quiet",
        url.trim(),
      ];

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(ytdlpPath, args);
      let hasData = false;

      proc.stdout.on("data", (chunk: Buffer) => {
        hasData = true;
        controller.enqueue(chunk);
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        console.error("[yt-dlp]", chunk.toString());
      });

      proc.on("close", (code) => {
        if (!hasData || code !== 0) {
          controller.error(new Error(`yt-dlp 오류 (코드 ${code})`));
        } else {
          controller.close();
        }
      });

      proc.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  const contentType = isAudio ? "audio/mpeg" : "video/mp4";

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
