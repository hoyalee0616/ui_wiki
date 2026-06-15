import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createWriteStream, createReadStream, unlink, stat } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 120;

function cleanup(path: string) {
  unlink(path, () => {});
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

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
  const isYoutube = /youtube\.com\/watch|youtu\.be\//.test(url);

  if (!isInstagram && !isYoutube) {
    return NextResponse.json(
      { error: "Instagram 또는 YouTube URL을 입력해 주세요." },
      { status: 400 },
    );
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const rawFile = join(tmpdir(), `raw_${randomUUID()}`);
  const wavFile = join(tmpdir(), `wav_${randomUUID()}.wav`);

  try {
    // 1단계: yt-dlp로 최고 음질 원본 다운로드
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

    // 2단계: ffmpeg으로 WAV 변환 (PCM s16le, 48kHz, stereo)
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, [
        "-i", rawFile,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "48000",
        "-ac", "2",
        "-y",
        wavFile,
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[ffmpeg]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
      proc.on("error", reject);
    });

    cleanup(rawFile);

    // 3단계: WAV 스트리밍
    const fileSize = await new Promise<number>((resolve, reject) => {
      stat(wavFile, (err, s) => err ? reject(err) : resolve(s.size));
    });

    const fileStream = createReadStream(wavFile);
    fileStream.on("close", () => cleanup(wavFile));

    const filename = isYoutube ? "youtube_audio.wav" : "instagram_audio.wav";

    return new Response(fileStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(fileSize),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanup(rawFile);
    cleanup(wavFile);
    console.error("[audio extract error]", err);
    return NextResponse.json(
      { error: "다운로드에 실패했습니다. 비공개 계정이거나 삭제된 영상일 수 있습니다." },
      { status: 500 },
    );
  }
}
