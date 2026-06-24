import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createReadStream, statSync } from "node:fs";
import { readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 600;

type StemTarget = "vocals" | "no_vocals" | "both";
type OutputFormat = "mp3" | "wav";
type SeparationQuality = "fast" | "balanced" | "quality";

const PATH_WITH_LOCAL_BINS = [
  "/Users/test/.local/bin",
  "/opt/homebrew/bin",
  "/usr/local/bin",
  process.env.PATH ?? "",
].join(":");

function cleanup(path: string) {
  unlink(path).catch(() => {});
}

function getEnv() {
  return { ...process.env, PATH: PATH_WITH_LOCAL_BINS };
}

function normalizeStem(value: unknown): StemTarget {
  return value === "no_vocals" || value === "both" ? value : "vocals";
}

function normalizeFormat(value: unknown): OutputFormat {
  return value === "wav" ? "wav" : "mp3";
}

function normalizeQuality(value: unknown): SeparationQuality {
  return value === "fast" || value === "quality" ? value : "balanced";
}

function safeInputExtension(filename?: string, mime?: string | null) {
  const ext = filename ? extname(filename).toLowerCase() : "";
  if (/^\.(mp3|wav|m4a|aac|flac|ogg|opus|webm|mp4|mov|mkv)$/.test(ext)) return ext;
  if (mime?.includes("mpeg")) return ".mp3";
  if (mime?.includes("wav")) return ".wav";
  if (mime?.includes("mp4")) return ".mp4";
  if (mime?.includes("webm")) return ".webm";
  return ".bin";
}

function runCommand(command: string, args: string[], timeoutMs = 600000) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const proc = spawn(command, args, { env: getEnv() });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error(`${command} 실행 시간이 너무 오래 걸립니다.`));
    }, timeoutMs);

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `${command} exit ${code}`));
    });
  });
}

async function commandStatus(command: string, args: string[]) {
  try {
    const { stdout, stderr } = await runCommand(command, args, 12000);
    const version = `${stdout}\n${stderr}`.trim().split("\n").find(Boolean) ?? "installed";
    return { ok: true, version };
  } catch (error) {
    return {
      ok: false,
      version: null,
      error: error instanceof Error ? error.message : "실행할 수 없습니다.",
    };
  }
}

async function downloadUrlToWav(url: string) {
  try {
    new URL(url);
  } catch {
    throw new Error("올바른 URL을 입력하세요.");
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const inputBase = join(tmpdir(), `vs_${randomUUID()}`);
  const inputFile = `${inputBase}.wav`;

  await runCommand(ytdlpPath, [
    "--format",
    "bestaudio/best",
    "--extract-audio",
    "--audio-format",
    "wav",
    "--no-playlist",
    "--output",
    `${inputBase}.%(ext)s`,
    "--quiet",
    "--no-warnings",
    url,
  ]);

  return inputFile;
}

function demucsArgs(inputFile: string, outDir: string, format: OutputFormat, quality: SeparationQuality) {
  const args = [
    "--two-stems=vocals",
    "--name",
    "htdemucs",
    "--out",
    outDir,
    inputFile,
  ];

  if (format === "mp3") {
    args.splice(-1, 0, "--mp3", "--mp3-bitrate", quality === "quality" ? "320" : "256");
  }

  if (quality === "fast") {
    args.splice(-1, 0, "--segment", "7", "--mp3-preset", "7", "--jobs", "2");
  } else if (quality === "quality") {
    args.splice(-1, 0, "--shifts", "2", "--overlap", "0.35", "--mp3-preset", "2");
  } else {
    args.splice(-1, 0, "--mp3-preset", "4");
  }

  return args;
}

async function findTrackDir(outDir: string) {
  const modelDirs = await readdir(outDir);
  if (modelDirs.length === 0) throw new Error("분리 결과 폴더를 찾지 못했습니다.");

  const modelDir = join(outDir, modelDirs[0]);
  const trackDirs = await readdir(modelDir);
  if (trackDirs.length === 0) throw new Error("분리된 트랙 폴더를 찾지 못했습니다.");

  return join(modelDir, trackDirs[0]);
}

function makeZip(entries: { name: string; data: Buffer }[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filename = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(filename.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(filename.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    localParts.push(localHeader, filename, entry.data);
    centralParts.push(centralHeader, filename);
    offset += localHeader.length + filename.length + entry.data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function GET() {
  const demucsPath = process.env.DEMUCS_PATH || "demucs";
  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

  const [demucs, ytdlp, ffmpeg] = await Promise.all([
    commandStatus(demucsPath, ["--help"]),
    commandStatus(ytdlpPath, ["--version"]),
    commandStatus(ffmpegPath, ["-version"]),
  ]);

  return NextResponse.json({
    ok: demucs.ok && ytdlp.ok && ffmpeg.ok,
    demucs,
    ytdlp,
    ffmpeg,
  });
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";

  let inputFile: string;
  let stem: StemTarget = "vocals";
  let format: OutputFormat = "mp3";
  let quality: SeparationQuality = "balanced";
  let cleanupInput = () => {};

  try {
    if (ct.includes("application/json")) {
      const body = (await req.json()) as {
        url?: string;
        target?: StemTarget;
        format?: OutputFormat;
        quality?: SeparationQuality;
      };
      if (!body.url) return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });

      stem = normalizeStem(body.target);
      format = normalizeFormat(body.format);
      quality = normalizeQuality(body.quality);
      inputFile = await downloadUrlToWav(body.url);
      cleanupInput = () => cleanup(inputFile);
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });

      stem = normalizeStem(formData.get("target"));
      format = normalizeFormat(formData.get("format"));
      quality = normalizeQuality(formData.get("quality"));

      const ext = safeInputExtension(file.name, file.type);
      inputFile = join(tmpdir(), `vs_${randomUUID()}${ext}`);
      cleanupInput = () => cleanup(inputFile);
      await writeFile(inputFile, Buffer.from(await file.arrayBuffer()));
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "입력 파일을 준비하지 못했습니다." },
      { status: 400 },
    );
  }

  const demucsPath = process.env.DEMUCS_PATH || "demucs";
  const outDir = join(tmpdir(), `demucs_${randomUUID()}`);

  try {
    await runCommand(demucsPath, demucsArgs(inputFile, outDir, format, quality));
    cleanupInput();

    const trackDir = await findTrackDir(outDir);
    const ext = format === "wav" ? "wav" : "mp3";

    if (stem === "both") {
      const vocals = await readFile(join(trackDir, `vocals.${ext}`));
      const instrumental = await readFile(join(trackDir, `no_vocals.${ext}`));
      const zip = makeZip([
        { name: `vocals.${ext}`, data: vocals },
        { name: `instrumental.${ext}`, data: instrumental },
      ]);
      await rm(outDir, { recursive: true, force: true });

      return new Response(zip, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Length": String(zip.length),
          "Content-Disposition": "attachment; filename=\"vocal-separation.zip\"",
          "Cache-Control": "no-store",
        },
      });
    }

    const targetFile = join(trackDir, `${stem}.${ext}`);
    const fileSize = statSync(targetFile).size;
    const stream = createReadStream(targetFile);
    stream.on("close", () => rm(outDir, { recursive: true, force: true }).catch(() => {}));

    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": format === "wav" ? "audio/wav" : "audio/mpeg",
        "Content-Length": String(fileSize),
        "Content-Disposition": `attachment; filename="${stem === "vocals" ? "vocals" : "instrumental"}.${ext}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanupInput();
    rm(outDir, { recursive: true, force: true }).catch(() => {});
    console.error("[vocal-separate error]", err);
    const message = err instanceof Error ? err.message : "";
    const missingDemucs = /ENOENT|not found|spawn demucs/i.test(message);

    return NextResponse.json(
      {
        error: missingDemucs
          ? "Demucs가 설치되어 있지 않습니다. 서버에 demucs, ffmpeg, yt-dlp 설치가 필요합니다."
          : `음원 분리에 실패했습니다.${message ? ` (${message.slice(0, 220)})` : ""}`,
      },
      { status: 500 },
    );
  }
}
