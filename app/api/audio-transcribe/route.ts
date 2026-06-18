import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 600;

function cleanup(path: string) {
  unlink(path).catch(() => {});
}

type OutputFormat = "txt" | "srt" | "vtt";

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const whisperPath = process.env.WHISPER_PATH || "whisper-cli";
  const modelPath = process.env.WHISPER_MODEL || join(homedir(), ".whisper-models", "ggml-base.bin");

  const id = randomUUID();
  const rawFile = join(tmpdir(), `tr_raw_${id}`);
  const wavFile = join(tmpdir(), `tr_${id}.wav`);
  let format: OutputFormat = "srt";
  let language = "auto";

  try {
    if (ct.includes("application/json")) {
      const body = await req.json();
      const url: string = body.url;
      format = (body.format as OutputFormat) || "srt";
      language = body.language || "auto";
      if (!url) return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });

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
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      format = ((formData.get("format") as string) || "srt") as OutputFormat;
      language = (formData.get("language") as string) || "auto";
      if (!file) return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });

      const buf = Buffer.from(await file.arrayBuffer());
      await writeFile(rawFile, buf);
    }

    // 16kHz mono PCM 변환
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

    // Whisper 실행 - 포맷별 옵션
    const whisperArgs = [
      "-m", modelPath,
      "-f", wavFile,
      "-l", language,
      "--threads", "8",
    ];
    if (format === "srt") whisperArgs.push("-osrt");
    else if (format === "vtt") whisperArgs.push("-ovtt");
    else whisperArgs.push("-otxt", "-nt");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(whisperPath, whisperArgs);
      proc.stderr.on("data", (d: Buffer) => console.error("[whisper]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`whisper exit ${code}`)));
      proc.on("error", reject);
    });

    const outFile = `${wavFile}.${format}`;
    const text = await readFile(outFile, "utf-8");

    cleanup(wavFile);
    cleanup(outFile);

    const contentType = format === "txt" ? "text/plain" : (format === "srt" ? "application/x-subrip" : "text/vtt");
    return new Response(text, {
      headers: {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="subtitle.${format}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanup(rawFile);
    cleanup(wavFile);
    console.error("[transcribe error]", err);
    return NextResponse.json(
      { error: "자막 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
