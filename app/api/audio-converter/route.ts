import { randomUUID } from "crypto";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Mp3Mode = "cbr" | "vbr";
type WavCodec = "pcm_s16le" | "pcm_s24le" | "pcm_f32le";

const allowedSampleRates = new Set(["auto", "22050", "44100", "48000", "96000"]);
const allowedChannels = new Set(["auto", "1", "2"]);
const allowedWavCodecs = new Set<WavCodec>(["pcm_s16le", "pcm_s24le", "pcm_f32le"]);
const allowedVbrQuality = new Set(["0", "2", "4", "6"]);
const maxUploadBytes = 80 * 1024 * 1024;

function sanitizeFilename(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "converted-audio";
}

function baseName(filename: string) {
  return sanitizeFilename(filename.replace(/\.[^/.]+$/, ""));
}

function extensionFor(file: File) {
  const match = file.name.toLowerCase().match(/\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/);
  if (match) return match[1];
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("mpeg")) return "mp3";
  return "audio";
}

function formValue(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 6000) stderr = stderr.slice(-6000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

export async function POST(req: Request) {
  let workDir = "";

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "오디오 파일을 업로드해 주세요." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > maxUploadBytes) {
      return NextResponse.json({ error: "파일은 80MB 이하만 변환할 수 있습니다." }, { status: 400 });
    }

    const format = formValue(formData, "format", "mp3") === "wav" ? "wav" : "mp3";
    const mp3Mode: Mp3Mode = formValue(formData, "mp3Mode", "cbr") === "vbr" ? "vbr" : "cbr";
    const bitrate = String(Math.min(Math.max(Number(formValue(formData, "bitrate", "192")) || 192, 32), 512));
    const vbrQuality = allowedVbrQuality.has(formValue(formData, "vbrQuality", "2")) ? formValue(formData, "vbrQuality", "2") : "2";
    const sampleRate = allowedSampleRates.has(formValue(formData, "sampleRate", "44100")) ? formValue(formData, "sampleRate", "44100") : "44100";
    const channels = allowedChannels.has(formValue(formData, "channels", "2")) ? formValue(formData, "channels", "2") : "2";
    const wavCodecRaw = formValue(formData, "wavCodec", "pcm_s16le") as WavCodec;
    const wavCodec = allowedWavCodecs.has(wavCodecRaw) ? wavCodecRaw : "pcm_s16le";
    const normalize = formValue(formData, "normalize", "false") === "true";

    workDir = await mkdtemp(join(tmpdir(), "audio-converter-"));
    const inputFile = join(workDir, `input-${randomUUID()}.${extensionFor(file)}`);
    const outputFile = join(workDir, `output.${format}`);
    await writeFile(inputFile, new Uint8Array(await file.arrayBuffer()));

    const args = ["-hide_banner", "-y", "-i", inputFile, "-vn", "-map_metadata", "0"];
    if (sampleRate !== "auto") args.push("-ar", sampleRate);
    if (channels !== "auto") args.push("-ac", channels);
    if (normalize) args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");

    if (format === "mp3") {
      args.push("-codec:a", "libmp3lame");
      if (mp3Mode === "vbr") {
        args.push("-q:a", vbrQuality);
      } else {
        args.push("-b:a", `${bitrate}k`);
      }
    } else {
      args.push("-codec:a", wavCodec);
    }

    args.push(outputFile);
    await runFfmpeg(args);

    const output = await readFile(outputFile);
    const filename = `${baseName(file.name)}-${format === "mp3" ? (mp3Mode === "vbr" ? `vbr-q${vbrQuality}` : `${bitrate}kbps`) : wavCodec.replace("pcm_", "").replace("le", "")}.${format}`;

    return new NextResponse(output, {
      headers: {
        "Content-Type": format === "mp3" ? "audio/mpeg" : "audio/wav",
        "Content-Length": String(output.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[audio-converter]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "오디오 변환에 실패했습니다." }, { status: 500 });
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
