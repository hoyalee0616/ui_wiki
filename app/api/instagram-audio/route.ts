import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createReadStream, unlink, stat } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 120;

function cleanup(path: string) {
  unlink(path, () => {});
}

type Format = "mp3" | "wav" | "mp4";

export async function POST(req: NextRequest) {
  const { url, format = "wav" } = await req.json() as { url: string; format?: Format };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const isProfileReelsPage = /instagram\.com\/[^/]+\/reels\/?$/.test(url);
  if (isProfileReelsPage) {
    return NextResponse.json(
      { error: "계정의 릴스 목록 페이지는 지원하지 않습니다. 개별 릴스 영상을 열고 '⋯ → 링크 복사'로 URL을 가져오세요." },
      { status: 400 },
    );
  }

  const isInstagram = /instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(url);
  const isYoutube = /youtube\.com\/(watch|shorts)|youtu\.be\//.test(url);

  if (!isInstagram && !isYoutube) {
    return NextResponse.json(
      { error: "Instagram 또는 YouTube URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const id = randomUUID();

  // ── MP4 영상 다운로드 ──────────────────────────────────────
  if (format === "mp4") {
    const mp4File = join(tmpdir(), `vid_${id}.mp4`);

    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(ytdlpPath, [
          "--format", "bestvideo[ext=mp4]+bestaudio/best",
          "--merge-output-format", "mp4",
          "--postprocessor-args", "ffmpeg:-c:v copy -c:a libmp3lame -q:a 0 -ar 44100 -ac 2",
          "--no-playlist",
          "--output", mp4File,
          "--quiet",
          url,
        ]);
        proc.stderr.on("data", (d: Buffer) => console.error("[yt-dlp]", d.toString()));
        proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`)));
        proc.on("error", reject);
      });

      const fileSize = await new Promise<number>((resolve, reject) =>
        stat(mp4File, (err, s) => err ? reject(err) : resolve(s.size))
      );

      const fileStream = createReadStream(mp4File);
      fileStream.on("close", () => cleanup(mp4File));

      return new Response(fileStream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(fileSize),
          "Content-Disposition": 'attachment; filename="video.mp4"',
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      cleanup(mp4File);
      console.error("[mp4 error]", err);
      return NextResponse.json({ error: "영상 다운로드에 실패했습니다." }, { status: 500 });
    }
  }

  // ── 오디오 다운로드 (mp3 / wav) ───────────────────────────
  const rawFile = join(tmpdir(), `raw_${id}`);
  const outExt = format === "mp3" ? "mp3" : "wav";
  const outFile = join(tmpdir(), `out_${id}.${outExt}`);

  try {
    // 1단계: 최고음질 원본 다운로드
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ytdlpPath, [
        "--format", "bestaudio",
        "--no-playlist",
        "--output", rawFile,
        "--quiet",
        url,
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[yt-dlp]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`)));
      proc.on("error", reject);
    });

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
    const filename = `audio.${outExt}`;

    return new Response(fileStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanup(rawFile);
    cleanup(outFile);
    console.error("[audio error]", err);
    return NextResponse.json(
      { error: "다운로드에 실패했습니다. 비공개 계정이거나 삭제된 영상일 수 있습니다." },
      { status: 500 },
    );
  }
}
