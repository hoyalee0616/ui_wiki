"use client";

import { useMemo, useRef, useState } from "react";
import { Download, FileAudio, RotateCcw, SlidersHorizontal } from "lucide-react";

type FFmpegFileData = Uint8Array | string;
type FFmpegInstance = {
  load(options: { coreURL: string; wasmURL: string }): Promise<void>;
  on(event: "log", callback: (event: { message: string }) => void): void;
  on(event: "progress", callback: (event: { progress: number }) => void): void;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<FFmpegFileData>;
  deleteFile(path: string): Promise<void>;
  exec(args: string[]): Promise<void>;
};

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg: new () => FFmpegInstance };
    FFmpegUtil?: { toBlobURL: (url: string, mimeType: string) => Promise<string> };
  }
}

type OutputFormat = "mp3" | "wav";
type Mp3Mode = "cbr" | "vbr";
type WavCodec = "pcm_s16le" | "pcm_s24le" | "pcm_f32le";

const FFMPEG_VERSION = "0.12.15";
const FFMPEG_UTIL_VERSION = "0.12.2";
const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;
const FFMPEG_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd/ffmpeg.js`;
const FFMPEG_UTIL_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/util@${FFMPEG_UTIL_VERSION}/dist/umd/index.js`;

const bitrateOptions = ["96", "128", "160", "192", "256", "320", "custom"];
const sampleRateOptions = [
  { value: "auto", label: "원본 유지" },
  { value: "22050", label: "22.05 kHz" },
  { value: "44100", label: "44.1 kHz" },
  { value: "48000", label: "48 kHz" },
  { value: "96000", label: "96 kHz" },
];
const channelOptions = [
  { value: "auto", label: "원본 유지" },
  { value: "1", label: "모노" },
  { value: "2", label: "스테레오" },
];
const wavCodecOptions: { value: WavCodec; label: string }[] = [
  { value: "pcm_s16le", label: "16-bit PCM" },
  { value: "pcm_s24le", label: "24-bit PCM" },
  { value: "pcm_f32le", label: "32-bit Float" },
];
const vbrOptions = [
  { value: "0", label: "최고 품질" },
  { value: "2", label: "고품질" },
  { value: "4", label: "표준" },
  { value: "6", label: "용량 우선" },
];

function getInputExtension(file: File) {
  const match = file.name.toLowerCase().match(/\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/);
  if (match) return match[1];
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("mpeg")) return "mp3";
  return "audio";
}

function getBaseName(file: File) {
  return file.name.replace(/\.[^/.]+$/, "") || "converted-audio";
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)}${units[index]}`;
}

function mimeFor(format: OutputFormat) {
  return format === "mp3" ? "audio/mpeg" : "audio/wav";
}

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-audio-converter-src="${src}"]`);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("FFmpeg 스크립트 로드 실패")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.audioConverterSrc = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("FFmpeg 스크립트 로드 실패")), { once: true });
    document.head.appendChild(script);
  });
}

export function AudioConverterTool() {
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const loadingRef = useRef<Promise<FFmpegInstance> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [mp3Mode, setMp3Mode] = useState<Mp3Mode>("cbr");
  const [bitrate, setBitrate] = useState("192");
  const [customBitrate, setCustomBitrate] = useState("224");
  const [vbrQuality, setVbrQuality] = useState("2");
  const [sampleRate, setSampleRate] = useState("44100");
  const [channels, setChannels] = useState("2");
  const [wavCodec, setWavCodec] = useState<WavCodec>("pcm_s16le");
  const [normalize, setNormalize] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading-core" | "converting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ url: string; filename: string; size: number; mime: string } | null>(null);

  const effectiveBitrate = useMemo(() => {
    const raw = bitrate === "custom" ? customBitrate : bitrate;
    const numeric = Math.min(Math.max(Number(raw) || 192, 32), 512);
    return String(numeric);
  }, [bitrate, customBitrate]);

  async function loadFfmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;
    if (loadingRef.current) return loadingRef.current;

    loadingRef.current = (async () => {
      setStatus("loading-core");
      setProgress(3);
      await Promise.all([
        loadScriptOnce(FFMPEG_SCRIPT_URL),
        loadScriptOnce(FFMPEG_UTIL_SCRIPT_URL),
      ]);
      const FFmpegConstructor = window.FFmpegWASM?.FFmpeg;
      const toBlobURL = window.FFmpegUtil?.toBlobURL;
      if (!FFmpegConstructor || !toBlobURL) {
        throw new Error("FFmpeg 로더를 초기화하지 못했습니다.");
      }

      const ffmpeg = new FFmpegConstructor();
      ffmpeg.on("log", ({ message }) => {
        if (message.trim()) setLog(message);
      });
      ffmpeg.on("progress", ({ progress: nextProgress }) => {
        if (Number.isFinite(nextProgress)) {
          setProgress(Math.min(99, Math.max(8, Math.round(nextProgress * 100))));
        }
      });
      await ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    })();

    try {
      return await loadingRef.current;
    } finally {
      loadingRef.current = null;
    }
  }

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  function resetAll() {
    clearResult();
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setLog("");
    setErrorMsg("");
  }

  async function handleConvert() {
    if (!file) return;
    clearResult();
    setErrorMsg("");
    setLog("");

    const inputName = `input.${getInputExtension(file)}`;
    const outputName = `output.${format}`;

    try {
      const ffmpeg = await loadFfmpeg();
      setStatus("converting");
      setProgress(8);

      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

      const args = ["-i", inputName, "-vn", "-map_metadata", "0"];
      if (sampleRate !== "auto") args.push("-ar", sampleRate);
      if (channels !== "auto") args.push("-ac", channels);
      if (normalize) args.push("-af", "loudnorm=I=-16:TP=-1.5:LRA=11");

      if (format === "mp3") {
        args.push("-codec:a", "libmp3lame");
        if (mp3Mode === "vbr") {
          args.push("-q:a", vbrQuality);
        } else {
          args.push("-b:a", `${effectiveBitrate}k`);
        }
      } else {
        args.push("-codec:a", wavCodec);
      }

      args.push("-y", outputName);
      await ffmpeg.exec(args);

      const output = await ffmpeg.readFile(outputName);
      const bytes = typeof output === "string" ? new TextEncoder().encode(output) : output;
      const blobPart = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const blob = new Blob([blobPart], { type: mimeFor(format) });
      const url = URL.createObjectURL(blob);
      const filename = `${getBaseName(file)}-${format === "mp3" ? `${mp3Mode === "vbr" ? `vbr-q${vbrQuality}` : `${effectiveBitrate}kbps`}` : wavCodec.replace("pcm_", "").replace("le", "")}.${format}`;

      await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);

      setResult({ url, filename, size: blob.size, mime: blob.type });
      setProgress(100);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setProgress(0);
      setErrorMsg(err instanceof Error ? err.message : "오디오 변환 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className="detail-card workbench-card audio-converter-card">
      <div className="workbench-head">
        <strong>오디오 변환기</strong>
        <span>MP3와 WAV를 브라우저에서 변환하고 음질 옵션을 조절</span>
      </div>

      <label
        className={`audio-converter-dropzone${file ? " has-file" : ""}`}
        style={{
          position: "relative",
          minHeight: 150,
          display: "grid",
          placeItems: "center",
          gap: 8,
          padding: 24,
          border: `1px ${file ? "solid" : "dashed"} ${file ? "var(--accent-green)" : "var(--border-strong)"}`,
          borderRadius: 18,
          background: file ? "var(--icon-green-bg)" : "linear-gradient(180deg, #fbfcff 0%, #ffffff 100%)",
          color: "var(--text-secondary)",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          onChange={(event) => {
            clearResult();
            setFile(event.target.files?.[0] ?? null);
            setStatus("idle");
            setProgress(0);
            setErrorMsg("");
          }}
        />
        <FileAudio size={30} color="var(--accent-green)" />
        <strong style={{ maxWidth: "100%", color: "var(--text-primary)", overflowWrap: "anywhere" }}>
          {file ? file.name : "MP3 또는 WAV 파일 선택"}
        </strong>
        <span style={{ maxWidth: "100%", fontSize: 13, lineHeight: 1.5, overflowWrap: "anywhere" }}>
          {file ? `${file.type || "audio"} · ${formatBytes(file.size)}` : "파일은 서버로 업로드되지 않고 현재 브라우저에서 처리됩니다."}
        </span>
      </label>

      <div className="audio-converter-toolbar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div className="field-block">
          <span>출력 형식</span>
          <div className="segmented-control">
            {(["mp3", "wav"] as OutputFormat[]).map((item) => (
              <button key={item} type="button" className={format === item ? "is-active" : ""} onClick={() => setFormat(item)}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <label className="field-block">
          <span>샘플레이트</span>
          <select value={sampleRate} onChange={(event) => setSampleRate(event.target.value)}>
            {sampleRateOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="field-block">
          <span>채널</span>
          <select value={channels} onChange={(event) => setChannels(event.target.value)}>
            {channelOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="audio-converter-settings"
        style={{ display: "grid", gap: 14, padding: 16, border: "1px solid var(--border)", borderRadius: 16, background: "var(--surface-muted)" }}
      >
        <div className="audio-converter-settings-head" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={16} />
          <strong>음질 상세 조절</strong>
        </div>

        {format === "mp3" ? (
          <div className="audio-converter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div className="field-block">
              <span>MP3 인코딩</span>
              <div className="segmented-control">
                <button type="button" className={mp3Mode === "cbr" ? "is-active" : ""} onClick={() => setMp3Mode("cbr")}>CBR</button>
                <button type="button" className={mp3Mode === "vbr" ? "is-active" : ""} onClick={() => setMp3Mode("vbr")}>VBR</button>
              </div>
            </div>

            {mp3Mode === "cbr" ? (
              <>
                <label className="field-block">
                  <span>비트레이트</span>
                  <select value={bitrate} onChange={(event) => setBitrate(event.target.value)}>
                    {bitrateOptions.map((item) => (
                      <option key={item} value={item}>{item === "custom" ? "직접 입력" : `${item} kbps`}</option>
                    ))}
                  </select>
                </label>
                {bitrate === "custom" && (
                  <label className="field-block">
                    <span>직접 입력 kbps</span>
                    <input inputMode="numeric" value={customBitrate} onChange={(event) => setCustomBitrate(event.target.value.replace(/\D/g, ""))} />
                  </label>
                )}
              </>
            ) : (
              <label className="field-block">
                <span>VBR 품질</span>
                <select value={vbrQuality} onChange={(event) => setVbrQuality(event.target.value)}>
                  {vbrOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ) : (
          <div className="audio-converter-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <label className="field-block">
              <span>WAV 비트 깊이</span>
              <select value={wavCodec} onChange={(event) => setWavCodec(event.target.value as WavCodec)}>
                {wavCodecOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label
          className="audio-converter-toggle"
          style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", cursor: "pointer" }}
        >
          <input type="checkbox" checked={normalize} onChange={(event) => setNormalize(event.target.checked)} />
          <span style={{ display: "grid", gap: 4 }}>
            <strong>라우드니스 정규화</strong>
            <small style={{ color: "var(--text-secondary)", lineHeight: 1.45 }}>소리가 너무 작거나 큰 파일을 -16 LUFS 기준으로 보정합니다.</small>
          </span>
        </label>
      </div>

      <div className="tool-actions-row">
        <button type="button" onClick={handleConvert} disabled={!file || status === "loading-core" || status === "converting"}>
          <Download size={16} />
          {status === "loading-core" ? "FFmpeg 로딩 중..." : status === "converting" ? "변환 중..." : `${format.toUpperCase()}로 변환`}
        </button>
        {(file || result || status === "error") && (
          <button type="button" onClick={resetAll}>
            <RotateCcw size={16} /> 초기화
          </button>
        )}
      </div>

      {(status === "loading-core" || status === "converting") && (
        <div className="audio-converter-progress" aria-label="변환 진행률" style={{ height: 8, overflow: "hidden", borderRadius: 999, background: "var(--border)" }}>
          <span style={{ display: "block", height: "100%", width: `${progress}%`, borderRadius: "inherit", background: "var(--accent-green)", transition: "width 0.25s ease" }} />
        </div>
      )}
      {log && (status === "loading-core" || status === "converting") && (
        <p className="vocal-status-text">{log}</p>
      )}
      {status === "error" && <p className="vocal-status-text error">{errorMsg}</p>}

      {result && (
        <div className="youtube-download-result">
          <div className="youtube-download-file">
            <strong>{result.filename}</strong>
            <span>{result.mime || mimeFor(format)} · {formatBytes(result.size)}</span>
          </div>
          <audio className="youtube-download-player" src={result.url} controls />
          <div className="tool-actions-row" style={{ marginTop: 10 }}>
            <a className="primary-action" href={result.url} download={result.filename}>
              <Download size={16} /> 다운로드 저장
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
