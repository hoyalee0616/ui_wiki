import { type NextRequest, NextResponse } from "next/server";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { createReadStream, unlink } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

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

  const contentType = isAudio ? "audio/mpeg" : "video/mp4";
  const dispositionHeader = `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`;

  if (isAudio) {
    // 음성은 stdout 스트리밍으로 바로 전송
    const args = [
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "0",
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

        proc.on("error", (err) => controller.error(err));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": dispositionHeader,
        "Cache-Control": "no-store",
      },
    });
  }

  // 영상은 병합이 필요하므로 임시 파일로 다운로드 후 스트리밍
  const tmpFile = join(tmpdir(), `yt-${randomUUID()}.mp4`);

  try {
    await new Promise<void>((resolve, reject) => {
      const args = [
        "--format", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--output", tmpFile,
        "--quiet",
        url.trim(),
      ];

      const proc = spawn(ytdlpPath, args);

      proc.stderr.on("data", (chunk: Buffer) => {
        console.error("[yt-dlp]", chunk.toString());
      });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp 오류 (코드 ${code})`));
      });

      proc.on("error", reject);
    });
  } catch (err) {
    unlink(tmpFile, () => {});
    const msg = err instanceof Error ? err.message : "다운로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const fileStream = new ReadableStream({
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

  return new Response(fileStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": dispositionHeader,
      "Cache-Control": "no-store",
    },
  });
}
