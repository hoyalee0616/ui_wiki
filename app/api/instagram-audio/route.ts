import { type NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { createReadStream, unlink } from "node:fs";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 120;

const execFileAsync = promisify(execFile);

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
  const tmpFile = join(tmpdir(), `audio_${randomUUID()}.wav`);

  try {
    await execFileAsync(ytdlpPath, [
      "--extract-audio",
      "--audio-format", "wav",
      "--postprocessor-args", "ffmpeg:-ar 48000 -ac 2",
      "--no-playlist",
      "--output", tmpFile,
      "--quiet",
      url,
    ], { timeout: 110_000 });

    const fileStream = createReadStream(tmpFile);

    // 스트리밍 후 임시 파일 삭제
    fileStream.on("close", () => {
      unlink(tmpFile, () => {});
    });

    const filename = isYoutube ? "youtube_audio.wav" : "instagram_audio.wav";

    return new Response(fileStream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    unlink(tmpFile, () => {});
    console.error("[yt-dlp error]", err);
    return NextResponse.json(
      { error: "다운로드에 실패했습니다. 비공개 계정이거나 삭제된 영상일 수 있습니다." },
      { status: 500 },
    );
  }
}
