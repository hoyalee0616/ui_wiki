"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, Plus, Printer, RotateCcw, Upload } from "lucide-react";
import type { ToolSectionId } from "@/data/tools";

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

function parseNumber(value: string) {
  return Number(value.replace(/,/g, "").trim()) || 0;
}

async function copyText(text: string) {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function downloadText(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderMarkdown(markdown: string) {
  const inline = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>");

  return markdown
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3>${inline(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${inline(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${inline(trimmed.slice(2))}</h1>`;
      if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
        const items = trimmed
          .split("\n")
          .map((line) => `<li>${inline(line.trim().slice(2))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(trimmed).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function slugify(text: string) {
  return romanizeKorean(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffInDays(from: string, to: string) {
  const start = parseDateInput(from);
  const end = parseDateInput(to);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function buildMonthGrid(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: startOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function sanitizeCurrencyInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

type TaxInvoiceParty = {
  businessNumber: string;
  companyName: string;
  representative: string;
  address: string;
  businessType: string;
  businessItem: string;
  email: string;
};

type TaxInvoiceLine = {
  id: string;
  date: string;
  itemName: string;
  spec: string;
  qty: string;
  unitPrice: string;
  supplyAmount: string;
  taxAmount: string;
  note: string;
};

const initials = [
  "g",
  "kk",
  "n",
  "d",
  "tt",
  "r",
  "m",
  "b",
  "pp",
  "s",
  "ss",
  "",
  "j",
  "jj",
  "ch",
  "k",
  "t",
  "p",
  "h",
];
const vowels = [
  "a",
  "ae",
  "ya",
  "yae",
  "eo",
  "e",
  "yeo",
  "ye",
  "o",
  "wa",
  "wae",
  "oe",
  "yo",
  "u",
  "wo",
  "we",
  "wi",
  "yu",
  "eu",
  "ui",
  "i",
];
const finals = [
  "",
  "k",
  "k",
  "ks",
  "n",
  "nj",
  "nh",
  "t",
  "l",
  "lk",
  "lm",
  "lb",
  "ls",
  "lt",
  "lp",
  "lh",
  "m",
  "p",
  "ps",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "h",
];

function romanizeKorean(text: string) {
  return Array.from(text)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 0xac00 || code > 0xd7a3) return char;
      const syllableIndex = code - 0xac00;
      const initial = Math.floor(syllableIndex / 588);
      const vowel = Math.floor((syllableIndex % 588) / 28);
      const final = syllableIndex % 28;
      return `${initials[initial]}${vowels[vowel]}${finals[final]}`;
    })
    .join("");
}

function generateDummyText(paragraphs: number) {
  const samples = [
    "빠르게 확인하고 바로 복사할 수 있는 예시 문장을 제공합니다.",
    "업무용 화면 시안과 문서 레이아웃 테스트에 적합한 더미 문장입니다.",
    "간격과 정보 밀도를 확인하기 좋도록 짧고 읽기 쉬운 한국어 문장으로 구성했습니다.",
  ];
  return Array.from({ length: paragraphs }, (_, index) =>
    `${samples[index % samples.length]} ${samples[(index + 1) % samples.length]}`,
  ).join("\n\n");
}

const emojiLibrary = [
  { symbol: "✓", keywords: ["체크", "완료", "check"] },
  { symbol: "→", keywords: ["화살표", "이동", "arrow"] },
  { symbol: "★", keywords: ["별", "중요", "star"] },
  { symbol: "☆", keywords: ["빈별", "즐겨찾기", "favorite"] },
  { symbol: "•", keywords: ["불릿", "목록", "bullet"] },
  { symbol: "◆", keywords: ["다이아", "강조", "diamond"] },
  { symbol: "■", keywords: ["사각형", "블록", "square"] },
  { symbol: "△", keywords: ["삼각형", "주의", "triangle"] },
  { symbol: "☎", keywords: ["전화", "연락", "phone"] },
  { symbol: "✉", keywords: ["메일", "이메일", "email"] },
  { symbol: "©", keywords: ["저작권", "copyright"] },
  { symbol: "™", keywords: ["상표", "trademark"] },
  { symbol: "🙂", keywords: ["웃음", "스마일", "smile"] },
  { symbol: "🔥", keywords: ["불", "핫", "fire"] },
  { symbol: "📄", keywords: ["문서", "파일", "document"] },
  { symbol: "📌", keywords: ["핀", "고정", "pin"] },
  { symbol: "📎", keywords: ["첨부", "클립", "attach"] },
  { symbol: "💡", keywords: ["아이디어", "팁", "idea"] },
];

const converterSets = {
  length: { mm: 1, cm: 10, m: 1000, km: 1000000 },
  weight: { g: 1, kg: 1000, lb: 453.592 },
  data: { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 },
};

type ConverterType = keyof typeof converterSets;

function DocumentTools({ toolId }: { toolId: string }) {
  const [text, setText] = useState("# 제목\n\n- 항목 1\n- 항목 2");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [paragraphs, setParagraphs] = useState(3);
  const keyword = text.trim().toLowerCase();
  const filteredEmoji = emojiLibrary.filter(
    (item) =>
      !keyword ||
      item.symbol.includes(keyword) ||
      item.keywords.some((entry) => entry.toLowerCase().includes(keyword)),
  );
  const header = Array.from({ length: cols }, (_, i) => `헤더${i + 1}`);
  const divider = Array.from({ length: cols }, () => "---");
  const body = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => `값${row + 1}-${col + 1}`),
  );
  const table = [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...body.map((line) => `| ${line.join(" | ")} |`),
  ].join("\n");
  const generated = generateDummyText(paragraphs);

  if (toolId === "markdown-preview") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>마크다운 미리보기</strong><span>실시간 렌더링</span></div>
        <div className="editor-split">
          <div className="editor-pane">
            <label className="field-label">마크다운 입력</label>
            <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="editor-pane preview">
            <label className="field-label">미리보기</label>
            <div className="preview-pane" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
          </div>
        </div>
      </section>
    );
  }

  if (toolId === "markdown-table") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>마크다운 테이블 생성기</strong><span>표 즉시 생성</span></div>
        <div className="form-grid">
          <label className="field-block">
            <span>행 수</span>
            <input type="number" min="1" max="10" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
          </label>
          <label className="field-block">
            <span>열 수</span>
            <input type="number" min="1" max="10" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
          </label>
        </div>
        <textarea className="tool-textarea output" value={table} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(table)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "character-counter") {
    const noSpace = text.replace(/\s/g, "");
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>글자수 계산기</strong><span>실시간 집계</span></div>
        <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="metrics-grid">
          <div className="metric-card"><small>공백 포함</small><strong>{formatNumber(text.length, 0)}</strong></div>
          <div className="metric-card"><small>공백 제외</small><strong>{formatNumber(noSpace.length, 0)}</strong></div>
          <div className="metric-card"><small>단어 수</small><strong>{formatNumber(text.trim() ? text.trim().split(/\s+/).length : 0, 0)}</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "dummy-text") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>더미 텍스트 생성기</strong><span>문단 단위 생성</span></div>
        <div className="form-grid single">
          <label className="field-block">
            <span>문단 수</span>
            <input type="number" min="1" max="12" value={paragraphs} onChange={(e) => setParagraphs(Number(e.target.value))} />
          </label>
        </div>
        <textarea className="tool-textarea output" value={generated} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(generated)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "slug-generator") {
    const slug = slugify(text);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>슬러그 생성기</strong><span>한글 제목도 URL용 영문 슬러그로 변환</span></div>
        <input className="tool-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="제목을 입력하세요" />
        <div className="result-panel"><strong>{slug || "slug-will-appear-here"}</strong></div>
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(slug)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "romanization") {
    const converted = romanizeKorean(text);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>로마자 변환기</strong><span>한글 → 영문 표기</span></div>
        <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="result-panel"><strong>{converted}</strong></div>
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(converted)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>특수문자/이모지</strong><span>검색 후 즉시 복사</span></div>
      <input className="tool-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="문자나 키워드를 입력하세요" />
      <div className="emoji-grid">
        {filteredEmoji.map((item) => (
          <button key={item.symbol} type="button" className="emoji-tile" onClick={() => copyText(item.symbol)}>
            {item.symbol}
          </button>
        ))}
      </div>
      {filteredEmoji.length === 0 ? <p className="field-help">검색어와 일치하는 특수문자가 없습니다.</p> : null}
    </section>
  );
}

function PdfTools({ toolId }: { toolId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [metadata, setMetadata] = useState({ title: "", author: "", keywords: "" });
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    if (toolId !== "pdf-to-markdown" || files.length === 0) return;
    const file = files[0];
    file.text().then((content) => {
      const cleaned = content.replace(/[^\x20-\x7E가-힣\n]/g, " ").replace(/\s{2,}/g, " ");
      setPreviewHtml(`# ${file.name}\n\n${cleaned.slice(0, 2000)}`);
    });
  }, [files, toolId]);

  const onFileChange = (fileList: FileList | null) => {
    setFiles(fileList ? Array.from(fileList) : []);
  };

  if (toolId === "image-to-pdf") {
    const openPrintWindow = async () => {
      const htmlParts = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          return `<div style="page-break-after:always;padding:24px"><img src="${url}" style="width:100%;height:auto"/></div>`;
        }),
      );
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<html><body>${htmlParts.join("")}<script>window.onload=()=>window.print();<\/script></body></html>`);
      win.document.close();
    };

    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>이미지 → PDF</strong><span>인쇄형 PDF 생성</span></div>
        <label className="upload-dropzone interactive">
          <Upload size={24} />
          <strong>이미지를 업로드하세요</strong>
          <input type="file" accept="image/*" multiple onChange={(e) => onFileChange(e.target.files)} />
        </label>
        <div className="file-list">
          {files.map((file) => <div key={file.name}>{file.name}</div>)}
        </div>
        <div className="tool-actions-row">
          <button type="button" onClick={openPrintWindow} disabled={files.length === 0}><Printer size={16} /> 인쇄/PDF 저장</button>
        </div>
      </section>
    );
  }

  if (toolId === "pdf-metadata") {
    const exported = JSON.stringify({ file: files[0]?.name ?? null, ...metadata }, null, 2);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 메타데이터</strong><span>문서 정보 편집</span></div>
        <label className="upload-dropzone interactive">
          <Upload size={24} />
          <strong>PDF 업로드</strong>
          <input type="file" accept=".pdf,application/pdf" onChange={(e) => onFileChange(e.target.files)} />
        </label>
        <div className="form-grid">
          <label className="field-block"><span>제목</span><input value={metadata.title} onChange={(e) => setMetadata((p) => ({ ...p, title: e.target.value }))} /></label>
          <label className="field-block"><span>작성자</span><input value={metadata.author} onChange={(e) => setMetadata((p) => ({ ...p, author: e.target.value }))} /></label>
          <label className="field-block wide"><span>키워드</span><input value={metadata.keywords} onChange={(e) => setMetadata((p) => ({ ...p, keywords: e.target.value }))} /></label>
        </div>
        <textarea className="tool-textarea output" value={exported} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => downloadText("pdf-metadata.json", exported, "application/json")}><Download size={16} /> JSON 저장</button>
        </div>
      </section>
    );
  }

  if (toolId === "pdf-watermark") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 워터마크</strong><span>문구 미리보기</span></div>
        <input className="tool-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="워터마크 문구를 입력하세요" />
        <div className="pdf-watermark-preview">
          <div className="watermark-layer">{text}</div>
          <div className="document-sheet"><h3>PDF 워터마크 미리보기</h3><p>실제 파일 적용 전 문구 위치와 강도를 미리 확인할 수 있습니다.</p></div>
        </div>
      </section>
    );
  }

  if (toolId === "pdf-to-markdown") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF → Markdown</strong><span>텍스트 추출 초안</span></div>
        <label className="upload-dropzone interactive">
          <Upload size={24} />
          <strong>PDF 또는 텍스트 파일 업로드</strong>
          <input type="file" accept=".pdf,.txt,.md" onChange={(e) => onFileChange(e.target.files)} />
        </label>
        <textarea className="tool-textarea output" value={previewHtml} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(previewHtml)} disabled={!previewHtml}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>PDF 작업 허브</strong><span>파일 정리 및 작업 계획</span></div>
      <label className="upload-dropzone interactive">
        <Upload size={24} />
        <strong>PDF 파일 업로드</strong>
        <input type="file" accept=".pdf,application/pdf" multiple onChange={(e) => onFileChange(e.target.files)} />
      </label>
      <div className="metrics-grid">
        <div className="metric-card"><small>업로드 파일</small><strong>{files.length}</strong></div>
        <div className="metric-card"><small>총 크기</small><strong>{formatNumber(totalSize / 1024, 0)} KB</strong></div>
        <div className="metric-card"><small>작업 준비</small><strong>{files.length > 1 ? "병합 가능" : "단일 문서"}</strong></div>
      </div>
      <div className="file-list">
        {files.map((file) => <div key={file.name}>{file.name}</div>)}
      </div>
    </section>
  );
}

function BusinessCalculators({ toolId }: { toolId: string }) {
  const [values, setValues] = useState<Record<string, string>>({
    amount: "1000000",
    rate: "5",
    years: "3",
    monthly: "100000",
    salary: "4200000",
    taxRate: "10",
    days: "30",
    preMoney: "5000000000",
    investment: "1000000000",
    options: "10000",
    strike: "1000",
    exitPrice: "12000",
    loan: "30000000",
    months: "36",
    flows: "-100000000,30000000,45000000,50000000",
  });
  const [kind, setKind] = useState<ConverterType>("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("cm");
  const [start, setStart] = useState("2026-04-01");
  const [end, setEnd] = useState("2026-05-01");
  const [birth, setBirth] = useState("1995-06-15");
  const [target, setTarget] = useState("2026-12-31");
  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  if (toolId === "unit-converter") {
    const number = parseNumber(values.amount);
    const set = converterSets[kind];
    const normalized = number * set[from as keyof typeof set];
    const converted = normalized / set[to as keyof typeof set];
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>단위 변환기</strong><span>길이/무게/데이터</span></div>
        <div className="form-grid">
          <label className="field-block"><span>종류</span><select value={kind} onChange={(e) => { const next = e.target.value as ConverterType; setKind(next); const units = Object.keys(converterSets[next]); setFrom(units[0]); setTo(units[1]); }}>{Object.keys(converterSets).map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
          <label className="field-block"><span>값</span><input value={values.amount} onChange={(e) => setValue("amount", e.target.value)} /></label>
          <label className="field-block"><span>From</span><select value={from} onChange={(e) => setFrom(e.target.value)}>{Object.keys(set).map((unit) => <option key={unit}>{unit}</option>)}</select></label>
          <label className="field-block"><span>To</span><select value={to} onChange={(e) => setTo(e.target.value)}>{Object.keys(set).map((unit) => <option key={unit}>{unit}</option>)}</select></label>
        </div>
        <div className="result-panel"><strong>{formatNumber(converted)} {to}</strong></div>
      </section>
    );
  }

  if (toolId === "date-calculator") {
    const diff = diffInDays(start, end);
    const added = formatDateInput(
      new Date(parseDateInput(start).getTime() + parseNumber(values.days) * 86400000),
    );
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>날짜 계산기</strong><span>차이와 N일 후</span></div>
        <div className="form-grid">
          <label className="field-block"><span>시작일</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="field-block"><span>종료일</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <label className="field-block"><span>더할 일수</span><input value={values.days} onChange={(e) => setValue("days", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>날짜 차이</small><strong>{diff}일</strong></div>
          <div className="metric-card"><small>{values.days}일 후</small><strong>{added}</strong></div>
          <div className="metric-card"><small>주 수</small><strong>{formatNumber(diff / 7)}주</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "age-dday") {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const birthDate = parseDateInput(birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const beforeBirthday = todayStart < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (beforeBirthday) age -= 1;
    const dday = diffInDays(formatDateInput(todayStart), target);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>나이 / 디데이</strong><span>만 나이와 일정</span></div>
        <div className="form-grid">
          <label className="field-block"><span>생년월일</span><input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></label>
          <label className="field-block"><span>목표일</span><input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>만 나이</small><strong>{age}세</strong></div>
          <div className="metric-card"><small>D-day</small><strong>{dday >= 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "compound-interest") {
    const principal = parseNumber(values.amount);
    const rate = parseNumber(values.rate) / 100 / 12;
    const years = parseNumber(values.years);
    const months = years * 12;
    const monthly = parseNumber(values.monthly);
    const futureValue =
      principal * (1 + rate) ** months +
      monthly * (((1 + rate) ** months - 1) / (rate || 1));
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>복리 계산기</strong><span>복리 성장 시뮬레이션</span></div>
        <div className="form-grid">
          <label className="field-block"><span>초기 금액</span><input value={values.amount} onChange={(e) => setValue("amount", e.target.value)} /></label>
          <label className="field-block"><span>연 수익률 (%)</span><input value={values.rate} onChange={(e) => setValue("rate", e.target.value)} /></label>
          <label className="field-block"><span>기간 (년)</span><input value={values.years} onChange={(e) => setValue("years", e.target.value)} /></label>
          <label className="field-block"><span>월 납입액</span><input value={values.monthly} onChange={(e) => setValue("monthly", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>예상 자산</small><strong>{formatNumber(futureValue, 0)}원</strong></div>
          <div className="metric-card"><small>총 납입액</small><strong>{formatNumber(principal + monthly * months, 0)}원</strong></div>
          <div className="metric-card"><small>예상 수익</small><strong>{formatNumber(futureValue - principal - monthly * months, 0)}원</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "irr-calculator") {
    const flows = values.flows.split(",").map(parseNumber);
    const npv = (rate: number) => flows.reduce((sum, flow, i) => sum + flow / (1 + rate) ** i, 0);
    let guess = 0.1;
    for (let i = 0; i < 20; i += 1) {
      const derivative = flows.reduce((sum, flow, index) => sum - (index * flow) / (1 + guess) ** (index + 1), 0);
      guess -= npv(guess) / (derivative || 1);
    }
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>IRR 계산기</strong><span>현금흐름 기반 분석</span></div>
        <label className="field-block"><span>현금흐름 (쉼표 구분)</span><textarea className="tool-textarea" value={values.flows} onChange={(e) => setValue("flows", e.target.value)} /></label>
        <div className="metrics-grid">
          <div className="metric-card"><small>IRR</small><strong>{formatNumber(guess * 100)}%</strong></div>
          <div className="metric-card"><small>NPV (10%)</small><strong>{formatNumber(npv(0.1), 0)}원</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "equity-simulator") {
    const preMoney = parseNumber(values.preMoney);
    const investment = parseNumber(values.investment);
    const founderShare = (preMoney / (preMoney + investment)) * 100;
    const investorShare = 100 - founderShare;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>지분율 시뮬레이터</strong><span>투자 희석 계산</span></div>
        <div className="form-grid">
          <label className="field-block"><span>프리머니 밸류</span><input value={values.preMoney} onChange={(e) => setValue("preMoney", e.target.value)} /></label>
          <label className="field-block"><span>투자금</span><input value={values.investment} onChange={(e) => setValue("investment", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>창업팀 지분</small><strong>{formatNumber(founderShare)}%</strong></div>
          <div className="metric-card"><small>신규 투자자 지분</small><strong>{formatNumber(investorShare)}%</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "stock-option") {
    const options = parseNumber(values.options);
    const strike = parseNumber(values.strike);
    const exitPrice = parseNumber(values.exitPrice);
    const gain = Math.max((exitPrice - strike) * options, 0);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>스톡옵션 계산기</strong><span>잠재 가치 추정</span></div>
        <div className="form-grid">
          <label className="field-block"><span>옵션 수량</span><input value={values.options} onChange={(e) => setValue("options", e.target.value)} /></label>
          <label className="field-block"><span>행사가</span><input value={values.strike} onChange={(e) => setValue("strike", e.target.value)} /></label>
          <label className="field-block"><span>예상 주가</span><input value={values.exitPrice} onChange={(e) => setValue("exitPrice", e.target.value)} /></label>
        </div>
        <div className="result-panel"><strong>{formatNumber(gain, 0)}원</strong></div>
      </section>
    );
  }

  if (toolId === "net-pay") {
    const gross = parseNumber(values.salary);
    const nationalPension = gross * 0.045;
    const health = gross * 0.03545;
    const care = health * 0.1295;
    const employment = gross * 0.009;
    const incomeTax = Math.max(gross * 0.03, 0);
    const localTax = incomeTax * 0.1;
    const net = gross - nationalPension - health - care - employment - incomeTax - localTax;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>실수령액 계산기</strong><span>월 급여 추정</span></div>
        <label className="field-block"><span>세전 월급</span><input value={values.salary} onChange={(e) => setValue("salary", e.target.value)} /></label>
        <div className="metrics-grid">
          <div className="metric-card"><small>예상 실수령액</small><strong>{formatNumber(net, 0)}원</strong></div>
          <div className="metric-card"><small>총 공제</small><strong>{formatNumber(gross - net, 0)}원</strong></div>
          <div className="metric-card"><small>공제율</small><strong>{formatNumber(((gross - net) / gross) * 100)}%</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "tax-calculator") {
    const supply = parseNumber(values.amount);
    const taxRate = parseNumber(values.taxRate) / 100;
    const vat = supply * taxRate;
    const total = supply + vat;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>세금 계산기</strong><span>부가세 및 합계</span></div>
        <div className="form-grid">
          <label className="field-block"><span>공급가액</span><input value={values.amount} onChange={(e) => setValue("amount", e.target.value)} /></label>
          <label className="field-block"><span>세율 (%)</span><input value={values.taxRate} onChange={(e) => setValue("taxRate", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>부가세</small><strong>{formatNumber(vat, 0)}원</strong></div>
          <div className="metric-card"><small>합계금액</small><strong>{formatNumber(total, 0)}원</strong></div>
        </div>
      </section>
    );
  }

  const principal = parseNumber(values.loan);
  const monthlyRate = parseNumber(values.rate) / 100 / 12;
  const months = parseNumber(values.months);
  const monthlyPayment =
    monthlyRate === 0 ? principal / Math.max(months, 1) : (principal * monthlyRate * (1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months || 1) - 1 || 1);
  const totalPayment = monthlyPayment * months;
  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>대출 계산기</strong><span>월 납입액 계산</span></div>
      <div className="form-grid">
        <label className="field-block"><span>대출 원금</span><input value={values.loan} onChange={(e) => setValue("loan", e.target.value)} /></label>
        <label className="field-block"><span>연 금리 (%)</span><input value={values.rate} onChange={(e) => setValue("rate", e.target.value)} /></label>
        <label className="field-block"><span>개월 수</span><input value={values.months} onChange={(e) => setValue("months", e.target.value)} /></label>
      </div>
      <div className="metrics-grid">
        <div className="metric-card"><small>월 납입액</small><strong>{formatNumber(monthlyPayment, 0)}원</strong></div>
        <div className="metric-card"><small>총 상환액</small><strong>{formatNumber(totalPayment, 0)}원</strong></div>
        <div className="metric-card"><small>총 이자</small><strong>{formatNumber(totalPayment - principal, 0)}원</strong></div>
      </div>
    </section>
  );
}

function BusinessDocuments({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [company, setCompany] = useState("Utility Wiki");
  const [recipient, setRecipient] = useState("Acme Corp");
  const [title, setTitle] = useState(toolName);
  const [name, setName] = useState("홍길동");
  const [role, setRole] = useState("Product Designer");
  const [phone, setPhone] = useState("010-1234-5678");
  const [email, setEmail] = useState("hello@utilitywiki.kr");
  const [website, setWebsite] = useState("https://utilitywiki.kr");
  const [year, setYear] = useState(new Date().getFullYear());
  const [items] = useState([
    { name: "서비스 기획", qty: 1, price: 800000 },
    { name: "디자인 수정", qty: 2, price: 250000 },
  ]);
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  const [invoiceKind, setInvoiceKind] = useState<"tax" | "bill">("tax");
  const [invoiceDate, setInvoiceDate] = useState(defaultDate);
  const [writeMode, setWriteMode] = useState<"total" | "supply">("total");
  const [purpose, setPurpose] = useState<"receipt" | "claim">("receipt");
  const [serialNumber, setSerialNumber] = useState("");
  const [approvalNumber, setApprovalNumber] = useState("");
  const [supplier, setSupplier] = useState<TaxInvoiceParty>({
    businessNumber: "123-45-67890",
    companyName: "유틸리티 위키",
    representative: "홍길동",
    address: "서울시 강남구 테헤란로 123",
    businessType: "서비스업",
    businessItem: "소프트웨어 개발",
    email: "billing@utilitywiki.kr",
  });
  const [buyer, setBuyer] = useState<TaxInvoiceParty>({
    businessNumber: "987-65-43210",
    companyName: "에이씨미 주식회사",
    representative: "김담당",
    address: "서울시 마포구 월드컵북로 456",
    businessType: "도소매업",
    businessItem: "온라인 커머스",
    email: "finance@acme.co.kr",
  });
  const [activeParty, setActiveParty] = useState<"supplier" | "buyer">("supplier");
  const [amountInput, setAmountInput] = useState("0");
  const [payment, setPayment] = useState({
    cash: "0",
    check: "0",
    note: "0",
    unpaid: "0",
  });
  const [invoiceItems, setInvoiceItems] = useState<TaxInvoiceLine[]>([
    {
      id: "item-1",
      date: defaultDate,
      itemName: "",
      spec: "",
      qty: "1",
      unitPrice: "0",
      supplyAmount: "0",
      taxAmount: "0",
      note: "",
    },
  ]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (toolId !== "stamp-generator" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d15252";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d15252";
    ctx.font = "700 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(name, 100, 105);
  }, [name, toolId]);

  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const vat = Math.round(total * 0.1);

  const printHtml = (body: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><body style="font-family:sans-serif;padding:24px">${body}<script>window.onload=()=>window.print();<\/script></body></html>`);
    win.document.close();
  };

  if (toolId === "tax-invoice") {
    const updateParty =
      (target: "supplier" | "buyer", field: keyof TaxInvoiceParty) =>
      (value: string) => {
        const setter = target === "supplier" ? setSupplier : setBuyer;
        setter((prev) => ({
          ...prev,
          [field]: field === "businessNumber" ? formatBusinessNumber(value) : value,
        }));
      };

    const updateItem =
      (id: string, field: keyof TaxInvoiceLine) =>
      (value: string) => {
        setInvoiceItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const next = {
              ...item,
              [field]:
                field === "qty" || field === "unitPrice" || field === "supplyAmount" || field === "taxAmount"
                  ? sanitizeCurrencyInput(value)
                  : value,
            };

            if (field === "qty" || field === "unitPrice") {
              const qty = parseNumber(next.qty || "0");
              const unitPrice = parseNumber(next.unitPrice || "0");
              const supplyAmount = qty * unitPrice;
              return {
                ...next,
                supplyAmount: String(supplyAmount),
                taxAmount: String(invoiceKind === "tax" ? Math.round(supplyAmount * 0.1) : 0),
              };
            }

            if (field === "supplyAmount") {
              const supplyAmount = parseNumber(next.supplyAmount || "0");
              return {
                ...next,
                taxAmount: String(invoiceKind === "tax" ? Math.round(supplyAmount * 0.1) : 0),
              };
            }

            return next;
          }),
        );
      };

    const addInvoiceItem = () => {
      setInvoiceItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}`,
          date: invoiceDate,
          itemName: "",
          spec: "",
          qty: "1",
          unitPrice: "0",
          supplyAmount: "0",
          taxAmount: "0",
          note: "",
        },
      ]);
    };

    const resetInvoice = () => {
      setInvoiceKind("tax");
      setInvoiceDate(defaultDate);
      setWriteMode("total");
      setPurpose("receipt");
      setSerialNumber("");
      setApprovalNumber("");
      setAmountInput("0");
      setPayment({ cash: "0", check: "0", note: "0", unpaid: "0" });
      setInvoiceItems([
        {
          id: "item-1",
          date: defaultDate,
          itemName: "",
          spec: "",
          qty: "1",
          unitPrice: "0",
          supplyAmount: "0",
          taxAmount: "0",
          note: "",
        },
      ]);
    };

    const numericAmount = parseNumber(amountInput || "0");
    const derivedSupplyTotal =
      invoiceKind === "tax" && writeMode === "total" ? Math.round(numericAmount / 1.1) : numericAmount;
    const derivedTaxTotal = invoiceKind === "tax" ? Math.round(derivedSupplyTotal * 0.1) : 0;
    const normalizedItems = invoiceItems.map((item, index) => {
      const qty = Math.max(parseNumber(item.qty || "0"), 1);
      const directSupply = parseNumber(item.supplyAmount || "0");
      const unitPrice = parseNumber(item.unitPrice || "0");
      const supplyAmount = directSupply || qty * unitPrice;
      const taxAmount = invoiceKind === "tax"
        ? parseNumber(item.taxAmount || "0") || Math.round(supplyAmount * 0.1)
        : 0;
      const itemDate = item.date || invoiceDate;
      const [yearPart, monthPart, dayPart] = itemDate.split("-");

      return {
        ...item,
        rowNumber: index + 1,
        qty,
        unitPrice,
        supplyAmount,
        taxAmount,
        monthPart: Number(monthPart || "0"),
        dayPart: Number(dayPart || "0"),
        yearPart: Number(yearPart || "0"),
      };
    });

    const itemSupplyTotal = normalizedItems.reduce((sum, item) => sum + item.supplyAmount, 0);
    const itemTaxTotal = normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const effectiveSupplyTotal = itemSupplyTotal || derivedSupplyTotal;
    const effectiveTaxTotal = itemTaxTotal || derivedTaxTotal;
    const effectiveGrandTotal = effectiveSupplyTotal + effectiveTaxTotal;
    const totalPayment = ["cash", "check", "note", "unpaid"].reduce(
      (sum, key) => sum + parseNumber(payment[key as keyof typeof payment]),
      0,
    );
    const [invoiceYear, invoiceMonth, invoiceDay] = invoiceDate.split("-").map(Number);

    const copies = [
      {
        id: "supplier-copy",
        titleColor: "#2152d8",
        accentBg: "#c7d9f5",
        accentText: "#2152d8",
        paperNote: "(공급자 보관용)",
      },
      {
        id: "buyer-copy",
        titleColor: "#c15a00",
        accentBg: "#ffefb6",
        accentText: "#c15a00",
        paperNote: "(공급받는자 보관용)",
      },
    ];

    const renderInvoicePreview = (copy: (typeof copies)[number]) => (
      <article key={copy.id} className="tax-preview-sheet">
        <table className="tax-preview-table">
          <tbody>
            <tr>
              <td className="tax-small-cell">책번호</td>
              <td className="tax-title-cell" colSpan={7} rowSpan={2} style={{ backgroundColor: copy.accentBg }}>
                <strong style={{ color: copy.titleColor }}>{invoiceKind === "tax" ? "세 금 계 산 서" : "계 산 서"}</strong>
                <span>{copy.paperNote}</span>
              </td>
              <td className="tax-small-cell">공급받는자 등록번호</td>
            </tr>
            <tr>
              <td className="tax-small-cell">일련번호</td>
              <td className="tax-small-cell tax-center">{approvalNumber || "-"}</td>
            </tr>
            <tr>
              <td className="tax-party-label" rowSpan={4} style={{ color: copy.accentText, backgroundColor: copy.accentBg }}>
                공급자
              </td>
              <td className="tax-label-cell">등록번호</td>
              <td colSpan={3}>{supplier.businessNumber}</td>
              <td className="tax-party-label" rowSpan={4} style={{ color: copy.accentText, backgroundColor: copy.accentBg }}>
                공급받는자
              </td>
              <td className="tax-label-cell">등록번호</td>
              <td colSpan={3}>{buyer.businessNumber}</td>
            </tr>
            <tr>
              <td className="tax-label-cell">상호(법인명)</td>
              <td colSpan={2}>{supplier.companyName}</td>
              <td>{supplier.representative}</td>
              <td className="tax-label-cell">상호(법인명)</td>
              <td colSpan={2}>{buyer.companyName}</td>
              <td>{buyer.representative}</td>
            </tr>
            <tr>
              <td className="tax-label-cell">주소</td>
              <td colSpan={3}>{supplier.address}</td>
              <td className="tax-label-cell">주소</td>
              <td colSpan={3}>{buyer.address}</td>
            </tr>
            <tr>
              <td className="tax-label-cell">업태</td>
              <td>{supplier.businessType}</td>
              <td className="tax-label-cell">종목</td>
              <td>{supplier.businessItem}</td>
              <td className="tax-label-cell">업태</td>
              <td>{buyer.businessType}</td>
              <td className="tax-label-cell">종목</td>
              <td>{buyer.businessItem}</td>
            </tr>
            <tr>
              <td className="tax-label-cell">작성</td>
              <td className="tax-center tax-bold">{invoiceYear}</td>
              <td className="tax-center">년</td>
              <td className="tax-center tax-bold">{invoiceMonth}</td>
              <td className="tax-center">월</td>
              <td className="tax-center tax-bold">{invoiceDay}</td>
              <td className="tax-center">일</td>
              <td colSpan={3} className="tax-center">공급가액</td>
            </tr>
            <tr>
              <td className="tax-center">월</td>
              <td className="tax-center">일</td>
              <td colSpan={3} className="tax-center">품목</td>
              <td className="tax-center">규격</td>
              <td className="tax-center">수량</td>
              <td className="tax-center">단가</td>
              <td className="tax-center">공급가액</td>
              <td className="tax-center">세액</td>
              <td className="tax-center">비고</td>
            </tr>
            {Array.from({ length: 4 }, (_, row) => {
              const item = normalizedItems[row];
              return (
                <tr key={`${copy.id}-row-${row}`}>
                  <td className="tax-center">{item ? item.monthPart : ""}</td>
                  <td className="tax-center">{item ? item.dayPart : ""}</td>
                  <td colSpan={3}>{item?.itemName ?? ""}</td>
                  <td>{item?.spec ?? ""}</td>
                  <td className="tax-right">{item ? formatNumber(item.qty, 0) : ""}</td>
                  <td className="tax-right">{item ? formatNumber(item.unitPrice, 0) : ""}</td>
                  <td className="tax-right">{item ? formatNumber(item.supplyAmount, 0) : ""}</td>
                  <td className="tax-right">{item ? formatNumber(item.taxAmount, 0) : ""}</td>
                  <td>{item?.note ?? ""}</td>
                </tr>
              );
            })}
            <tr>
              <td className="tax-total-label" rowSpan={2} style={{ color: copy.accentText, backgroundColor: copy.accentBg }}>
                합계금액
              </td>
              <td className="tax-center">현금</td>
              <td className="tax-right">{formatNumber(parseNumber(payment.cash), 0)}</td>
              <td className="tax-center">수표</td>
              <td className="tax-right">{formatNumber(parseNumber(payment.check), 0)}</td>
              <td className="tax-center">어음</td>
              <td className="tax-right">{formatNumber(parseNumber(payment.note), 0)}</td>
              <td className="tax-center">외상미수금</td>
              <td className="tax-right">{formatNumber(parseNumber(payment.unpaid), 0)}</td>
              <td className="tax-purpose-box" rowSpan={2} colSpan={2}>
                <span>이 금액을</span>
                <strong>
                  <em className={purpose === "receipt" ? "is-active" : ""}>영수</em>
                  <span>/</span>
                  <em className={purpose === "claim" ? "is-active" : ""}>청구</em>
                </strong>
                <span>함</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="tax-center">공급가액</td>
              <td colSpan={2} className="tax-right tax-bold">{formatNumber(effectiveSupplyTotal, 0)}</td>
              <td colSpan={2} className="tax-center">세액</td>
              <td colSpan={2} className="tax-right tax-bold">{formatNumber(effectiveTaxTotal, 0)}</td>
            </tr>
            <tr>
              <td colSpan={11} className="tax-footnote">
                이 세금계산서는 부가가치세법에 따라 교부하는 것입니다.
              </td>
            </tr>
          </tbody>
        </table>
      </article>
    );

    const printTarget = `
      <html>
        <head>
          <style>
            body { font-family: Arial, 'Noto Sans KR', sans-serif; padding: 24px; color: #1f2937; }
            .sheet { margin-bottom: 28px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 3px solid #3f4b63; }
            td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 12px; vertical-align: middle; word-break: break-word; }
            .title { text-align: center; }
            .title strong { display: block; font-size: 22px; letter-spacing: 0.35em; }
            .title span { display: block; margin-top: 8px; font-size: 11px; }
            .label { width: 46px; text-align: center; writing-mode: vertical-rl; text-orientation: mixed; font-weight: 700; }
            .total { width: 90px; text-align: center; font-weight: 700; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 700; }
            .purpose { text-align: center; }
            .purpose strong { display: flex; justify-content: center; gap: 8px; margin: 6px 0; }
            .active { font-weight: 700; }
            .footnote { text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>${copies
          .map(
            (copy) => `
              <div class="sheet">
                <table>
                  <tbody>
                    <tr>
                      <td>책번호</td>
                      <td colspan="7" rowspan="2" class="title" style="background:${copy.accentBg}">
                        <strong style="color:${copy.titleColor}">${invoiceKind === "tax" ? "세 금 계 산 서" : "계 산 서"}</strong>
                        <span>${copy.paperNote}</span>
                      </td>
                      <td>공급받는자 등록번호</td>
                    </tr>
                    <tr><td>일련번호</td><td class="center">${approvalNumber || "-"}</td></tr>
                    <tr>
                      <td class="label" rowspan="4" style="background:${copy.accentBg};color:${copy.accentText}">공급자</td>
                      <td>등록번호</td><td colspan="3">${supplier.businessNumber}</td>
                      <td class="label" rowspan="4" style="background:${copy.accentBg};color:${copy.accentText}">공급받는자</td>
                      <td>등록번호</td><td colspan="3">${buyer.businessNumber}</td>
                    </tr>
                    <tr>
                      <td>상호(법인명)</td><td colspan="2">${supplier.companyName}</td><td>${supplier.representative}</td>
                      <td>상호(법인명)</td><td colspan="2">${buyer.companyName}</td><td>${buyer.representative}</td>
                    </tr>
                    <tr>
                      <td>주소</td><td colspan="3">${supplier.address}</td>
                      <td>주소</td><td colspan="3">${buyer.address}</td>
                    </tr>
                    <tr>
                      <td>업태</td><td>${supplier.businessType}</td><td>종목</td><td>${supplier.businessItem}</td>
                      <td>업태</td><td>${buyer.businessType}</td><td>종목</td><td>${buyer.businessItem}</td>
                    </tr>
                    <tr>
                      <td>작성</td><td class="center bold">${invoiceYear}</td><td class="center">년</td><td class="center bold">${invoiceMonth}</td><td class="center">월</td><td class="center bold">${invoiceDay}</td><td class="center">일</td><td colspan="3" class="center">공급가액</td>
                    </tr>
                    <tr>
                      <td class="center">월</td><td class="center">일</td><td colspan="3" class="center">품목</td><td class="center">규격</td><td class="center">수량</td><td class="center">단가</td><td class="center">공급가액</td><td class="center">세액</td><td class="center">비고</td>
                    </tr>
                    ${Array.from({ length: 4 }, (_, row) => {
                      const item = normalizedItems[row];
                      return `<tr>
                        <td class="center">${item ? item.monthPart : ""}</td>
                        <td class="center">${item ? item.dayPart : ""}</td>
                        <td colspan="3">${item?.itemName ?? ""}</td>
                        <td>${item?.spec ?? ""}</td>
                        <td class="right">${item ? formatNumber(item.qty, 0) : ""}</td>
                        <td class="right">${item ? formatNumber(item.unitPrice, 0) : ""}</td>
                        <td class="right">${item ? formatNumber(item.supplyAmount, 0) : ""}</td>
                        <td class="right">${item ? formatNumber(item.taxAmount, 0) : ""}</td>
                        <td>${item?.note ?? ""}</td>
                      </tr>`;
                    }).join("")}
                    <tr>
                      <td class="total" rowspan="2" style="background:${copy.accentBg};color:${copy.accentText}">합계금액</td>
                      <td class="center">현금</td><td class="right">${formatNumber(parseNumber(payment.cash), 0)}</td>
                      <td class="center">수표</td><td class="right">${formatNumber(parseNumber(payment.check), 0)}</td>
                      <td class="center">어음</td><td class="right">${formatNumber(parseNumber(payment.note), 0)}</td>
                      <td class="center">외상미수금</td><td class="right">${formatNumber(parseNumber(payment.unpaid), 0)}</td>
                      <td class="purpose" rowspan="2" colspan="2"><span>이 금액을</span><strong><span class="${purpose === "receipt" ? "active" : ""}">영수</span><span>/</span><span class="${purpose === "claim" ? "active" : ""}">청구</span></strong><span>함</span></td>
                    </tr>
                    <tr>
                      <td colspan="2" class="center">공급가액</td><td colspan="2" class="right bold">${formatNumber(effectiveSupplyTotal, 0)}</td>
                      <td colspan="2" class="center">세액</td><td colspan="2" class="right bold">${formatNumber(effectiveTaxTotal, 0)}</td>
                    </tr>
                    <tr><td colspan="11" class="footnote">이 세금계산서는 부가가치세법에 따라 교부하는 것입니다.</td></tr>
                  </tbody>
                </table>
              </div>
            `,
          )
          .join("")}</body>
      </html>
    `;

    return (
      <section className="detail-card workbench-card tax-invoice-workbench">
        <div className="tax-invoice-layout">
          <div className="tax-invoice-form-column">
            <section className="tax-panel">
              <h3>기본 설정</h3>
              <div className="form-grid tax-form-grid tax-basic-grid">
                <label className="field-block">
                  <span>문서 종류</span>
                  <select value={invoiceKind} onChange={(e) => setInvoiceKind(e.target.value as "tax" | "bill")}>
                    <option value="tax">세금계산서</option>
                    <option value="bill">계산서</option>
                  </select>
                </label>
                <label className="field-block">
                  <span>작성일자</span>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </label>
                <div className="field-block">
                  <span>영수/청구</span>
                  <div className="tax-choice-row">
                    <button type="button" className={`tax-toggle-chip ${purpose === "receipt" ? "is-active" : ""}`} onClick={() => setPurpose("receipt")}>영수</button>
                    <button type="button" className={`tax-toggle-chip ${purpose === "claim" ? "is-active" : ""}`} onClick={() => setPurpose("claim")}>청구</button>
                  </div>
                </div>
                <label className="field-block">
                  <span>책번호</span>
                  <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="책번호 입력" />
                </label>
                <label className="field-block">
                  <span>일련번호</span>
                  <input value={approvalNumber} onChange={(e) => setApprovalNumber(e.target.value)} placeholder="일련번호 입력" />
                </label>
              </div>
            </section>

            <section className="tax-panel">
              <h3>부가세 계산기</h3>
              <div className="tax-choice-row">
                <button type="button" className={`tax-toggle-chip ${writeMode === "total" ? "is-active" : ""}`} onClick={() => setWriteMode("total")}>합계금액 입력</button>
                <button type="button" className={`tax-toggle-chip ${writeMode === "supply" ? "is-active" : ""}`} onClick={() => setWriteMode("supply")}>공급가액 입력</button>
              </div>
              <label className="field-block">
                <span>{writeMode === "total" ? "합계금액 (부가세 포함)" : "공급가액"}</span>
                <input value={formatNumber(parseNumber(amountInput || "0"), 0)} onChange={(e) => setAmountInput(sanitizeCurrencyInput(e.target.value))} placeholder="금액 입력" />
              </label>
                <div className="metrics-grid tax-summary-grid">
                <div className="metric-card"><small>공급가액</small><strong>{formatNumber(effectiveSupplyTotal, 0)}원</strong></div>
                <div className="metric-card"><small>세액</small><strong>{formatNumber(effectiveTaxTotal, 0)}원</strong></div>
                <div className="metric-card"><small>합계</small><strong>{formatNumber(effectiveGrandTotal, 0)}원</strong></div>
              </div>
            </section>

            <section className="tax-panel">
              <div className="tax-party-tabs">
                <button type="button" className={`tax-party-tab ${activeParty === "supplier" ? "is-active" : ""}`} onClick={() => setActiveParty("supplier")}>공급자</button>
                <button type="button" className={`tax-party-tab ${activeParty === "buyer" ? "is-active" : ""}`} onClick={() => setActiveParty("buyer")}>공급받는자</button>
              </div>
              <div className="tax-party-pane">
                <h3>{activeParty === "supplier" ? "공급자 정보" : "공급받는자 정보"}</h3>
                <div className="form-grid tax-form-grid">
                  <label className="field-block wide">
                    <span>사업자등록번호</span>
                    <input
                      value={(activeParty === "supplier" ? supplier : buyer).businessNumber}
                      onChange={(e) => updateParty(activeParty, "businessNumber")(e.target.value)}
                      placeholder="000-00-00000"
                    />
                  </label>
                  <label className="field-block">
                    <span>상호 (법인명칭)</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).companyName} onChange={(e) => updateParty(activeParty, "companyName")(e.target.value)} placeholder="회사명" />
                  </label>
                  <label className="field-block">
                    <span>성명</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).representative} onChange={(e) => updateParty(activeParty, "representative")(e.target.value)} placeholder="대표자명" />
                  </label>
                  <label className="field-block wide">
                    <span>사업장 주소</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).address} onChange={(e) => updateParty(activeParty, "address")(e.target.value)} placeholder="사업장 주소" />
                  </label>
                  <label className="field-block">
                    <span>업태</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).businessType} onChange={(e) => updateParty(activeParty, "businessType")(e.target.value)} placeholder="업태" />
                  </label>
                  <label className="field-block">
                    <span>종목</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).businessItem} onChange={(e) => updateParty(activeParty, "businessItem")(e.target.value)} placeholder="종목" />
                  </label>
                  <label className="field-block wide">
                    <span>이메일 (참고용)</span>
                    <input value={(activeParty === "supplier" ? supplier : buyer).email} onChange={(e) => updateParty(activeParty, "email")(e.target.value)} placeholder="email@example.com" />
                  </label>
                </div>
              </div>
            </section>

            <section className="tax-panel">
              <div className="tax-panel-head">
                <h3>품목</h3>
                <button type="button" className="tax-add-button" onClick={addInvoiceItem}>
                  <Plus size={18} />
                  품목 추가
                </button>
              </div>
              <div className="tax-item-list">
                {invoiceItems.map((item, index) => (
                  <div key={item.id} className="tax-item-card">
                    <strong>품목 {index + 1}</strong>
                    <div className="form-grid tax-form-grid">
                      <label className="field-block">
                        <span>일자</span>
                        <input type="date" value={item.date} onChange={(e) => updateItem(item.id, "date")(e.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>품목</span>
                        <input value={item.itemName} onChange={(e) => updateItem(item.id, "itemName")(e.target.value)} placeholder="품목명" />
                      </label>
                      <label className="field-block">
                        <span>규격</span>
                        <input value={item.spec} onChange={(e) => updateItem(item.id, "spec")(e.target.value)} placeholder="규격" />
                      </label>
                      <label className="field-block">
                        <span>수량</span>
                        <input value={item.qty} onChange={(e) => updateItem(item.id, "qty")(e.target.value)} placeholder="1" />
                      </label>
                      <label className="field-block">
                        <span>단가</span>
                        <input value={formatNumber(parseNumber(item.unitPrice || "0"), 0)} onChange={(e) => updateItem(item.id, "unitPrice")(e.target.value)} placeholder="0" />
                      </label>
                      <label className="field-block">
                        <span>공급가액</span>
                        <input value={formatNumber(parseNumber(item.supplyAmount || "0"), 0)} onChange={(e) => updateItem(item.id, "supplyAmount")(e.target.value)} placeholder="0" />
                      </label>
                      <label className="field-block">
                        <span>세액</span>
                        <input value={formatNumber(parseNumber(item.taxAmount || "0"), 0)} onChange={(e) => updateItem(item.id, "taxAmount")(e.target.value)} placeholder="0" />
                      </label>
                      <label className="field-block wide">
                        <span>비고</span>
                        <input value={item.note} onChange={(e) => updateItem(item.id, "note")(e.target.value)} placeholder="품목 비고" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="tax-panel">
              <h3>결제 정보</h3>
              <div className="form-grid tax-form-grid tax-payment-grid">
                <label className="field-block">
                  <span>현금</span>
                  <input value={formatNumber(parseNumber(payment.cash), 0)} onChange={(e) => setPayment((prev) => ({ ...prev, cash: sanitizeCurrencyInput(e.target.value) }))} />
                </label>
                <label className="field-block">
                  <span>수표</span>
                  <input value={formatNumber(parseNumber(payment.check), 0)} onChange={(e) => setPayment((prev) => ({ ...prev, check: sanitizeCurrencyInput(e.target.value) }))} />
                </label>
                <label className="field-block">
                  <span>어음</span>
                  <input value={formatNumber(parseNumber(payment.note), 0)} onChange={(e) => setPayment((prev) => ({ ...prev, note: sanitizeCurrencyInput(e.target.value) }))} />
                </label>
                <label className="field-block">
                  <span>외상미수금</span>
                  <input value={formatNumber(parseNumber(payment.unpaid), 0)} onChange={(e) => setPayment((prev) => ({ ...prev, unpaid: sanitizeCurrencyInput(e.target.value) }))} />
                </label>
              </div>
              <p className="field-help">결제 합계: {formatNumber(totalPayment, 0)}원</p>
            </section>

            <div className="tool-actions-row tax-invoice-actions">
              <button type="button" className="primary-action" onClick={() => printHtml(printTarget)}>
                <Printer size={16} />
                인쇄하기 (공급자/공급받는자용)
              </button>
              <button type="button" onClick={resetInvoice}>
                <RotateCcw size={16} />
                초기화
              </button>
            </div>
          </div>

          <aside className="tax-invoice-preview-column">
            <h3>미리보기</h3>
            <div className="tax-preview-stack">
              {copies.map((copy) => renderInvoicePreview(copy))}
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (toolId === "stamp-generator") {
    const downloadPng = () => {
      const url = canvasRef.current?.toDataURL("image/png");
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = "stamp.png";
      link.click();
    };

    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>도장 생성기</strong><span>캔버스 기반 PNG</span></div>
        <input className="tool-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="도장 이름" />
        <div className="stamp-wrap"><canvas ref={canvasRef} width={200} height={200} /></div>
        <div className="tool-actions-row">
          <button type="button" onClick={downloadPng}><Download size={16} /> PNG 저장</button>
        </div>
      </section>
    );
  }

  if (toolId === "email-signature") {
    const html = `<table><tr><td><strong>${name}</strong><br/>${role}<br/>${company}<br/>${phone}<br/><a href="mailto:${email}">${email}</a><br/><a href="${website}">${website}</a></td></tr></table>`;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>이메일 서명</strong><span>HTML 생성</span></div>
        <div className="form-grid">
          <label className="field-block"><span>이름</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="field-block"><span>직함</span><input value={role} onChange={(e) => setRole(e.target.value)} /></label>
          <label className="field-block"><span>회사명</span><input value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label className="field-block"><span>전화번호</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="field-block"><span>이메일</span><input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field-block"><span>웹사이트</span><input value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>
        <div className="document-sheet" dangerouslySetInnerHTML={{ __html: html }} />
        <textarea className="tool-textarea output" value={html} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(html)}><Copy size={16} /> HTML 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "annual-calendar") {
    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>연간달력</strong><span>인쇄용 12개월 보기</span></div>
        <label className="field-block short"><span>연도</span><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <div className="calendar-grid">
          {months.map((month) => (
            <div key={month.toISOString()} className="calendar-month">
              <strong>{month.getMonth() + 1}월</strong>
              <small>{month.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}</small>
              <div className="calendar-weekdays">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-days">
                {buildMonthGrid(year, month.getMonth()).map((day, index) => (
                  <span key={`${month.toISOString()}-${index}`} className={day ? "" : "is-empty"}>
                    {day ?? ""}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const body = `
    <h1>${title}</h1>
    <p>${company} → ${recipient}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead><tr><th>항목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead>
      <tbody>
        ${items
          .map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${formatNumber(item.price, 0)}</td><td>${formatNumber(item.qty * item.price, 0)}</td></tr>`)
          .join("")}
      </tbody>
    </table>
    <p>공급가액: ${formatNumber(total, 0)}원 / 부가세: ${formatNumber(vat, 0)}원 / 합계: ${formatNumber(total + vat, 0)}원</p>
  `;

  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>{toolName}</strong><span>출력형 문서 생성</span></div>
      <div className="form-grid">
        <label className="field-block"><span>문서 제목</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field-block"><span>공급자/회사명</span><input value={company} onChange={(e) => setCompany(e.target.value)} /></label>
        <label className="field-block"><span>수신자/거래처</span><input value={recipient} onChange={(e) => setRecipient(e.target.value)} /></label>
      </div>
      <div className="document-sheet" dangerouslySetInnerHTML={{ __html: body }} />
      <div className="tool-actions-row">
        <button type="button" onClick={() => printHtml(body)}><Printer size={16} /> 인쇄</button>
        <button type="button" onClick={() => downloadText(`${toolId}.html`, body, "text/html;charset=utf-8")}><Download size={16} /> HTML 저장</button>
      </div>
    </section>
  );
}

export function ToolWorkbench({
  toolId,
  sectionId,
  toolName,
}: {
  toolId: string;
  sectionId: ToolSectionId;
  toolName: string;
}) {
  if (sectionId === "documents") return <DocumentTools toolId={toolId} />;
  if (sectionId === "pdf") return <PdfTools toolId={toolId} />;
  if (sectionId === "business-calculators") return <BusinessCalculators toolId={toolId} />;
  return <BusinessDocuments toolId={toolId} toolName={toolName} />;
}
