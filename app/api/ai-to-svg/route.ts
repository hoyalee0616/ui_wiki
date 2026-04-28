import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 250 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(["ai", "eps"]);

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .trim();
}

async function resolveInkscape() {
  const binary = process.env.INKSCAPE_BIN || "inkscape";
  try {
    await execFileAsync(binary, ["--version"], { timeout: 8000 });
    return binary;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const inkscape = await resolveInkscape();
  if (!inkscape) {
    return NextResponse.json(
      {
        code: "missing_inkscape",
        message: "서버에 Inkscape CLI가 없어 AI/EPS 직접 변환을 사용할 수 없습니다.",
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ code: "missing_file", message: "업로드된 파일이 없습니다." }, { status: 400 });
  }

  const extension = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ code: "unsupported_file", message: "AI 또는 EPS 파일만 변환할 수 있습니다." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ code: "file_too_large", message: "250MB 이하 파일만 변환할 수 있습니다." }, { status: 413 });
  }

  const workDir = join(tmpdir(), `ai-to-svg-${randomUUID()}`);
  const inputPath = join(workDir, `input.${extension}`);
  const outputPath = join(workDir, "output.svg");

  try {
    await mkdir(workDir, { recursive: true });
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    await execFileAsync(
      inkscape,
      [
        inputPath,
        "--export-plain-svg",
        `--export-filename=${outputPath}`,
      ],
      {
        timeout: 90000,
        maxBuffer: 8 * 1024 * 1024,
      },
    );

    const svg = sanitizeSvg(await readFile(outputPath, "utf8"));
    if (!svg.includes("<svg")) {
      throw new Error("SVG 출력 파일을 만들지 못했습니다.");
    }

    return NextResponse.json({
      engine: "Inkscape",
      svg,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        code: "inkscape_failed",
        message: `Inkscape 변환 실패: ${message}`,
      },
      { status: 422 },
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
