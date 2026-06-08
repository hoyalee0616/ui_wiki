import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  // 계정 릴스 목록 페이지 감지 (예: instagram.com/username/reels/)
  const isProfileReelsPage = /instagram\.com\/[^/]+\/reels\/?$/.test(url);
  if (isProfileReelsPage) {
    return NextResponse.json(
      { error: "계정의 릴스 목록 페이지는 지원하지 않습니다.\n개별 릴스 영상을 열고 '⋯ → 링크 복사'로 URL을 가져오세요.\n예) instagram.com/reels/XXXXX/" },
      { status: 400 },
    );
  }

  const isInstagram =
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(url);

  if (!isInstagram) {
    return NextResponse.json(
      { error: "개별 게시물·릴스 URL을 입력해 주세요.\n예) instagram.com/reels/XXXXX/ 또는 instagram.com/p/XXXXX/" },
      { status: 400 },
    );
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";

  const stream = new ReadableStream({
    start(controller) {
      const args = [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--output", "-",
        "--quiet",
        url,
      ];

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

  return new Response(stream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'attachment; filename="instagram_audio.mp3"',
      "Cache-Control": "no-store",
      "Content-Encoding": "identity",
    },
  });
}
