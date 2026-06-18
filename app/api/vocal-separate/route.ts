import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { createReadStream, statSync } from "node:fs";
import { unlink, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 600;

function cleanup(path: string) {
  unlink(path).catch(() => {});
}

type Stem = "vocals" | "no_vocals";

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";

  let inputFile: string;
  let cleanupInput = () => {};
  let stem: Stem = "vocals";

  if (ct.includes("application/json")) {
    // URL 입력 → yt-dlp로 다운로드 후 분리
    const { url, target } = await req.json() as { url: string; target?: Stem };
    if (!url) return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
    if (target === "no_vocals") stem = "no_vocals";

    const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
    inputFile = join(tmpdir(), `vs_${randomUUID()}.wav`);
    cleanupInput = () => cleanup(inputFile);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ytdlpPath, [
        "--format", "bestaudio",
        "--extract-audio",
        "--audio-format", "wav",
        "--no-playlist",
        "--output", inputFile,
        "--quiet",
        url,
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[yt-dlp]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`)));
      proc.on("error", reject);
    });
  } else {
    // 파일 업로드
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const target = (formData.get("target") as string) || "vocals";
    if (target === "no_vocals") stem = "no_vocals";
    if (!file) return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });

    inputFile = join(tmpdir(), `vs_${randomUUID()}.wav`);
    cleanupInput = () => cleanup(inputFile);
    const buf = Buffer.from(await file.arrayBuffer());
    const { writeFile } = await import("node:fs/promises");
    await writeFile(inputFile, buf);
  }

  const demucsPath = process.env.DEMUCS_PATH || "demucs";
  const outDir = join(tmpdir(), `demucs_${randomUUID()}`);

  try {
    // Demucs 실행 (htdemucs 모델, vocals/no_vocals 2-stem)
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(demucsPath, [
        "--two-stems=vocals",
        "--mp3",
        "-o", outDir,
        inputFile,
      ], { env: { ...process.env, PATH: `/Users/test/.local/bin:${process.env.PATH}` } });
      proc.stderr.on("data", (d: Buffer) => console.error("[demucs]", d.toString()));
      proc.stdout.on("data", (d: Buffer) => console.log("[demucs]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`demucs exit ${code}`)));
      proc.on("error", reject);
    });

    cleanupInput();

    // 결과 파일 찾기 (outDir/htdemucs/<basename>/vocals.mp3, no_vocals.mp3)
    const modelDirs = await readdir(outDir);
    const modelDir = join(outDir, modelDirs[0]);
    const subDirs = await readdir(modelDir);
    const trackDir = join(modelDir, subDirs[0]);
    const targetFile = join(trackDir, `${stem}.mp3`);

    const fileSize = statSync(targetFile).size;
    const stream = createReadStream(targetFile);
    stream.on("close", () => rm(outDir, { recursive: true, force: true }).catch(() => {}));

    const filename = stem === "vocals" ? "vocals.mp3" : "instrumental.mp3";

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(fileSize),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    cleanupInput();
    rm(outDir, { recursive: true, force: true }).catch(() => {});
    console.error("[demucs error]", err);
    return NextResponse.json(
      { error: "음원 분리에 실패했습니다. Demucs 설치 상태를 확인하세요." },
      { status: 500 },
    );
  }
}
