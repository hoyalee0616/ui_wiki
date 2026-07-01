import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { formatYtDlpError, getYtDlpCookieArgs, getYtDlpNetworkArgs } from "@/lib/ytdlpCookies";

export const maxDuration = 300;

function cleanup(path: string) {
  unlink(path).catch(() => {});
}

export async function POST(req: NextRequest) {
  const { url, language } = await req.json() as { url: string; language?: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const whisperPath = process.env.WHISPER_PATH || "whisper-cli";
  const modelPath = process.env.WHISPER_MODEL || join(homedir(), ".whisper-models", "ggml-small.bin");
  const cookieArgs = await getYtDlpCookieArgs();
  const networkArgs = getYtDlpNetworkArgs();

  const id = randomUUID();
  const rawFile = join(tmpdir(), `whisper_raw_${id}`);
  const wavFile = join(tmpdir(), `whisper_${id}.wav`);
  const txtFile = `${wavFile}.txt`;

  try {
    // 1) 오디오 다운로드
    await new Promise<void>((resolve, reject) => {
      let stderr = "";
      const proc = spawn(ytdlpPath, [
        ...cookieArgs,
        ...networkArgs,
        "--format", "bestaudio",
        "--no-playlist",
        "--output", rawFile,
        "--quiet",
        url,
      ]);
      proc.stderr.on("data", (d: Buffer) => {
        const text = d.toString();
        stderr += text;
        console.error("[yt-dlp]", text);
      });
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr || `yt-dlp exit ${code}`)));
      proc.on("error", reject);
    });

    // 2) 16kHz mono PCM WAV 변환 (whisper 요구사항)
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, [
        "-i", rawFile,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        "-y",
        wavFile,
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[ffmpeg]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
      proc.on("error", reject);
    });

    cleanup(rawFile);

    // 3) Whisper 실행 → 텍스트 파일 생성
    const lang = language || "auto";
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(whisperPath, [
        "-m", modelPath,
        "-f", wavFile,
        "-l", lang,
        "-otxt",
        "--threads", "8",
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[whisper]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`whisper exit ${code}`)));
      proc.on("error", reject);
    });

    const raw = (await readFile(txtFile, "utf-8")).trim();

    // 각 줄에서 [00:00:00.000 --> 00:00:05.000] 같은 타임스탬프 제거
    const text = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^\[[0-9:.,\s>\->]+\]\s*/, "").trim())
      .filter(Boolean)
      .join("\n");

    cleanup(wavFile);
    cleanup(txtFile);

    return NextResponse.json({ text, engine: "whisper", lang });
  } catch (err) {
    cleanup(rawFile);
    cleanup(wavFile);
    cleanup(txtFile);
    console.error("[whisper error]", err);
    const rawMsg = err instanceof Error ? err.message : "";
    if (/yt-dlp|youtube|instagram|tiktok|cookies|format|download/i.test(rawMsg)) {
      return NextResponse.json(
        { error: formatYtDlpError(rawMsg) },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Whisper 자막 추출에 실패했습니다. 모델 파일이 설치되어 있는지 확인하세요." },
      { status: 500 },
    );
  }
}
