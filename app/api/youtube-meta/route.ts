import { type NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getYtDlpCookieArgs, getYtDlpNetworkArgs } from "@/lib/ytdlpCookies";

export const maxDuration = 30;
const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const cookieArgs = await getYtDlpCookieArgs();
  const networkArgs = getYtDlpNetworkArgs();

  try {
    const { stdout } = await execFileAsync(
      ytdlpPath,
      [...cookieArgs, ...networkArgs, "--dump-single-json", "--no-playlist", "--no-warnings", url],
      { maxBuffer: 10 * 1024 * 1024, timeout: 25_000 },
    );
    const data = JSON.parse(stdout);
    return NextResponse.json({
      title: data.title ?? "제목 없음",
      thumbnail: data.thumbnail ?? null,
      duration: data.duration ?? 0,
      uploader: data.uploader ?? data.channel ?? "",
      source: (data.extractor_key ?? data.extractor ?? "unknown").toString().toUpperCase(),
    });
  } catch (err) {
    console.error("[meta error]", err);
    return NextResponse.json({ error: "영상 정보를 가져오지 못했습니다." }, { status: 500 });
  }
}
