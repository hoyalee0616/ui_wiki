import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { readFile, unlink, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const maxDuration = 60;

function stripVtt(vtt: string): string {
  const lines = vtt.split(/\r?\n/);
  const out: string[] = [];
  let lastText = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("WEBVTT")) continue;
    if (line.startsWith("Kind:") || line.startsWith("Language:")) continue;
    if (line.startsWith("NOTE")) continue;
    if (/-->/i.test(line)) continue;
    if (/^\d+$/.test(line)) continue;

    // 태그 제거
    const cleaned = line
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    if (!cleaned) continue;
    if (cleaned === lastText) continue;
    out.push(cleaned);
    lastText = cleaned;
  }

  return out.join("\n");
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const isYoutube = /youtube\.com\/(watch|shorts)|youtu\.be\//.test(url);
  if (!isYoutube) {
    return NextResponse.json({ error: "현재 자막은 YouTube만 지원합니다." }, { status: 400 });
  }

  const ytdlpPath = process.env.YTDLP_PATH || "yt-dlp";
  const id = randomUUID();
  const outBase = join(tmpdir(), `sub_${id}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ytdlpPath, [
        "--skip-download",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs", "ko,en,en-US,en-GB",
        "--sub-format", "vtt",
        "--no-playlist",
        "--output", outBase,
        "--quiet",
        url,
      ]);
      proc.stderr.on("data", (d: Buffer) => console.error("[yt-dlp sub]", d.toString()));
      proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`)));
      proc.on("error", reject);
    });

    // 임시 폴더에서 sub_<id>.* 파일 찾기
    const files = await readdir(tmpdir());
    const subFiles = files.filter((f) => f.startsWith(`sub_${id}`) && f.endsWith(".vtt"));

    if (subFiles.length === 0) {
      return NextResponse.json({ error: "자막을 찾을 수 없습니다. 이 영상에 자막이 없을 수 있습니다." }, { status: 404 });
    }

    // 한국어 우선
    subFiles.sort((a, b) => {
      const aKo = a.includes(".ko.") ? 0 : 1;
      const bKo = b.includes(".ko.") ? 0 : 1;
      return aKo - bKo;
    });

    const subPath = join(tmpdir(), subFiles[0]);
    const vtt = await readFile(subPath, "utf-8");
    const text = stripVtt(vtt);
    const lang = subFiles[0].match(/\.([a-z]{2}(-[A-Z]{2})?)\.vtt$/)?.[1] ?? "unknown";

    // 모든 자막 파일 정리
    for (const f of subFiles) {
      unlink(join(tmpdir(), f)).catch(() => {});
    }

    return NextResponse.json({ text, lang });
  } catch (err) {
    console.error("[transcript error]", err);
    return NextResponse.json({ error: "자막 추출에 실패했습니다." }, { status: 500 });
  }
}
