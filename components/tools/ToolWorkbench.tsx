"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

function copyViaClipboardEvent(text: string, html?: string) {
  let copied = false;
  const listener = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;

    event.clipboardData.setData("text/plain", text);
    if (html) {
      event.clipboardData.setData("text/html", html);
    }
    event.preventDefault();
    copied = true;
  };

  document.addEventListener("copy", listener);
  const commandCopied = document.execCommand("copy");
  document.removeEventListener("copy", listener);
  return copied || commandCopied;
}

async function copyText(text: string) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall back to selection-based copy below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const selectedCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (selectedCopy) return true;

  return copyViaClipboardEvent(text);
}

async function copyHtml(html: string, plainText: string) {
  if (!html) return false;

  try {
    if ("ClipboardItem" in window && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText || html], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch {
    // Fall back to a rendered DOM selection below.
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  container.contentEditable = "true";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);
  const selectedCopy = document.execCommand("copy");
  selection?.removeAllRanges();
  container.remove();

  if (selectedCopy) return true;

  return copyViaClipboardEvent(plainText || html, html);
}

function downloadText(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBytes(filename: string, content: Uint8Array, mimeType = "application/octet-stream") {
  const bytes = new Uint8Array(content);
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

const markdownExample = [
  "# Markdown Preview",
  "",
  "## 기본 문법",
  "",
  "**굵은 글씨**, *기울임*, ~~취소선~~, `인라인 코드`",
  "",
  "### 리스트",
  "",
  "- 항목 1",
  "- 항목 2",
  "  - 중첩 항목",
  "- 항목 3",
  "",
  "1. 첫 번째",
  "2. 두 번째",
  "3. 세 번째",
  "",
  "### 링크와 이미지",
  "",
  "[Gomdol Tool](https://example.com)",
  "",
  "### 인용",
  "",
  "> 인용문입니다.",
  "> 여러 줄도 가능합니다.",
  "",
  "### 코드 블록",
  "",
  "```javascript",
  "function hello(name) {",
  "  console.log(`Hello, ${name}!`);",
  "  return true;",
  "}",
  "```",
  "",
  "### 테이블 (GFM)",
  "",
  "| 이름 | 나이 | 직업 |",
  "| --- | ---: | --- |",
  "| 홍길동 | 25 | 개발자 |",
  "| 김철수 | 30 | 디자이너 |",
  "",
  "### 체크박스 (GFM)",
  "",
  "- [x] 완료된 항목",
  "- [ ] 미완료 항목",
  "- [ ] 또 다른 항목",
  "",
  "---",
  "",
  "수평선 아래에 있는 내용입니다.",
].join("\n");

type MarkdownViewMode = "split" | "editor" | "preview";

function TaxPreviewScaleFrame({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const updateFrame = () => {
      const frameElement = frameRef.current;
      const paperElement = paperRef.current;
      if (!frameElement || !paperElement) return;

      const availableWidth = frameElement.clientWidth;
      const paperWidth = paperElement.offsetWidth || 860;
      const paperHeight = paperElement.scrollHeight || 1;
      const scale = Math.min(1, availableWidth / paperWidth);
      setFrame({ scale, height: Math.ceil(paperHeight * scale) });
    };

    updateFrame();
    const observer = new ResizeObserver(updateFrame);
    if (frameRef.current) observer.observe(frameRef.current);
    if (paperRef.current) observer.observe(paperRef.current);
    window.addEventListener("resize", updateFrame);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFrame);
    };
  }, [children]);

  return (
    <div ref={frameRef} className="tax-preview-frame" style={{ height: frame.height ? `${frame.height}px` : undefined }}>
      <div ref={paperRef} className="tax-preview-paper" style={{ transform: `scale(${frame.scale})` }}>
        {children}
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let index = 0;
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];

  const flushCode = () => {
    html.push(`<pre><code data-language="${escapeHtml(codeLang)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    inCode = false;
    codeLang = "";
    codeLines = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      index += 1;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^---+$|^\*\*\*+$/.test(trimmed)) {
      html.push("<hr />");
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${quoteLines.map((entry) => renderInlineMarkdown(entry)).join("<br />")}</blockquote>`);
      continue;
    }

    if (trimmed.includes("|") && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(
          lines[index]
            .trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((cell) => cell.trim()),
        );
        index += 1;
      }
      const [head, , ...bodyRows] = rows;
      html.push(
        `<table><thead><tr>${head.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows
          .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^[-*]\s+\[[ xX]\]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        const item = lines[index].trim().replace(/^[-*]\s+/, "");
        const checkbox = /^\[([ xX])\]\s+(.+)$/.exec(item);
        items.push(
          checkbox
            ? `<li class="task-list-item"><input type="checkbox" disabled ${checkbox[1].toLowerCase() === "x" ? "checked" : ""} /> ${renderInlineMarkdown(checkbox[2])}</li>`
            : `<li>${renderInlineMarkdown(item)}</li>`,
        );
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${renderInlineMarkdown(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">") &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("```")
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${paragraphLines.map((entry) => renderInlineMarkdown(entry)).join("<br />")}</p>`);
  }

  if (inCode) flushCode();
  return html.join("");
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    return `#${cleaned.split("").map((char) => `${char}${char}`).join("")}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(cleaned)) return `#${cleaned.toUpperCase()}`;
  return "#5B8DEF";
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 100) };

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4;

  return {
    h: Math.round(hue * 60),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function countMarkdownWords(value: string) {
  const normalized = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()|]/g, " ")
    .trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function markdownToPlainText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[a-z]*\n?/i, "").replace(/```$/, ""))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+\[[ xX]\]\s+/gm, "- ")
    .replace(/^[-*]\s+/gm, "- ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~`|]/g, "")
    .trim();
}

function toPdfHex(value: string) {
  return Array.from(value)
    .map((char) => {
      const code = char.codePointAt(0) ?? 32;
      return code <= 0xffff ? code.toString(16).padStart(4, "0") : "0020";
    })
    .join("")
    .toUpperCase();
}

function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(title: string, markdown: string) {
  const plainLines = [title, "", ...markdownToPlainText(markdown).split("\n")]
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line || lines[index - 1]);
  const pages = Array.from({ length: Math.max(1, Math.ceil(plainLines.length / 34)) }, (_, pageIndex) =>
    plainLines.slice(pageIndex * 34, pageIndex * 34 + 34),
  );
  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>");
  addObject("<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor 5 0 R >>");
  addObject("<< /Type /FontDescriptor /FontName /HYGoThic-Medium /Flags 4 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>");

  const pageIds: number[] = [];
  pages.forEach((lines) => {
    const streamLines = [
      "BT",
      `/F1 18 Tf 50 790 Td <${toPdfHex(lines[0] || title)}> Tj`,
      "/F1 11 Tf 0 -30 Td",
      ...lines.slice(1).map((line) => `0 -18 Td <${toPdfHex(line || " ")}> Tj`),
      "ET",
    ];
    const stream = streamLines.join("\n");
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const encoder = new TextEncoder();
  let pdf = "%PDF-1.4\n%âãÏÓ\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info << /Title (${escapePdf(title)}) >> >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return encoder.encode(pdf);
}

function downloadMarkdownPdf(title: string, markdown: string) {
  downloadBytes("markdown-preview.pdf", buildSimplePdf(title, markdown), "application/pdf");
}

function encodeBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64(value: string) {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return "Base64 형식이 올바르지 않습니다.";
  }
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
type MarkdownTableAlign = "left" | "center" | "right";

const markdownAlignLabels: Record<MarkdownTableAlign, string> = {
  left: "좌측",
  center: "중앙",
  right: "우측",
};

function createMarkdownTableData(rowCount: number, colCount: number) {
  return Array.from({ length: rowCount + 1 }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => (rowIndex === 0 ? `열 ${colIndex + 1}` : "")),
  );
}

function resizeMarkdownTableData(data: string[][], rowCount: number, colCount: number) {
  return Array.from({ length: rowCount + 1 }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => data[rowIndex]?.[colIndex] ?? (rowIndex === 0 ? `열 ${colIndex + 1}` : "")),
  );
}

function parseCsvRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if ((char === "," || char === "\t") && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  rows.push(row);
  return rows.filter((line) => line.some((entry) => entry.length > 0));
}

function buildPrettyTableHtml(header: string[], body: string[][], aligns: MarkdownTableAlign[]) {
  const thRows = header
    .map((cell, index) => `    <th style="text-align: ${aligns[index]}">${escapeHtml(cell)}</th>`)
    .join("\n");
  const bodyRows = body
    .map((line) =>
      [
        "  <tr>",
        ...line.map((cell, index) => `    <td style="text-align: ${aligns[index]}">${escapeHtml(cell)}</td>`),
        "  </tr>",
      ].join("\n"),
    )
    .join("\n");

  return [
    "<table>",
    "  <thead>",
    "  <tr>",
    thRows,
    "  </tr>",
    "  </thead>",
    "  <tbody>",
    bodyRows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

function DocumentTools({ toolId }: { toolId: string }) {
  const [text, setText] = useState(markdownExample);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState(() => createMarkdownTableData(3, 3));
  const [tableAligns, setTableAligns] = useState<MarkdownTableAlign[]>(() => Array.from({ length: 3 }, () => "left"));
  const [csvInput, setCsvInput] = useState("");
  const [tableCopyStatus, setTableCopyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [tableManualCopy, setTableManualCopy] = useState<{ label: string; content: string } | null>(null);
  const [paragraphs, setParagraphs] = useState(3);
  const [markdownMode, setMarkdownMode] = useState<MarkdownViewMode>("split");
  const markdownTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const markdownFileInputRef = useRef<HTMLInputElement | null>(null);
  const tableManualCopyRef = useRef<HTMLTextAreaElement | null>(null);
  const keyword = text.trim().toLowerCase();
  const filteredEmoji = emojiLibrary.filter(
    (item) =>
      !keyword ||
      item.symbol.includes(keyword) ||
      item.keywords.some((entry) => entry.toLowerCase().includes(keyword)),
  );
  const header = tableData[0] ?? [];
  const body = tableData.slice(1);
  const divider = tableAligns.map((align) => (align === "center" ? ":---:" : align === "right" ? "---:" : ":---"));
  const table = [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...body.map((line) => `| ${line.join(" | ")} |`),
  ].join("\n");
  const tableHtml = buildPrettyTableHtml(header, body, tableAligns);
  const generated = generateDummyText(paragraphs);
  const markdownHtml = renderMarkdown(text);
  const markdownLines = text.split("\n");
  const markdownStats = `${formatNumber(text.length, 0)}자 · ${formatNumber(countMarkdownWords(text), 0)} 단어`;

  useEffect(() => {
    if (!tableManualCopy) return;

    window.requestAnimationFrame(() => {
      tableManualCopyRef.current?.focus();
      tableManualCopyRef.current?.select();
    });
  }, [tableManualCopy]);

  const insertMarkdownSnippet = (prefix: string, suffix = "", placeholder = "") => {
    const textarea = markdownTextareaRef.current;
    if (!textarea) {
      setText((value) => `${value}${value ? "\n" : ""}${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.slice(start, end) || placeholder;
    const nextText = `${text.slice(0, start)}${prefix}${selected}${suffix}${text.slice(end)}`;
    setText(nextText);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const updateMarkdownTableSize = (nextRows: number, nextCols: number) => {
    const clampedRows = Math.min(Math.max(nextRows || 1, 1), 12);
    const clampedCols = Math.min(Math.max(nextCols || 1, 1), 8);
    setRows(clampedRows);
    setCols(clampedCols);
    setTableData((current) => resizeMarkdownTableData(current, clampedRows, clampedCols));
    setTableAligns((current) => Array.from({ length: clampedCols }, (_, index) => current[index] ?? "left"));
  };

  const updateMarkdownTableCell = (rowIndex: number, colIndex: number, value: string) => {
    setTableData((current) =>
      current.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cell, currentColIndex) => (currentColIndex === colIndex ? value : cell))
          : row,
      ),
    );
  };

  const updateMarkdownTableAlign = (colIndex: number, value: MarkdownTableAlign) => {
    setTableAligns((current) => current.map((align, index) => (index === colIndex ? value : align)));
  };

  const importMarkdownCsv = () => {
    const parsedRows = parseCsvRows(csvInput);
    if (!parsedRows.length) return;

    const nextRows = Math.max(parsedRows.length - 1, 1);
    const nextCols = Math.max(...parsedRows.map((line) => line.length), 1);
    const nextData = Array.from({ length: nextRows + 1 }, (_, rowIndex) =>
      Array.from({ length: nextCols }, (_, colIndex) => parsedRows[rowIndex]?.[colIndex] ?? ""),
    );

    setRows(nextRows);
    setCols(nextCols);
    setTableData(nextData);
    setTableAligns(Array.from({ length: nextCols }, () => "left"));
  };

  const showTableCopyStatus = (type: "success" | "error", message: string) => {
    setTableCopyStatus({ type, message });
    window.setTimeout(() => setTableCopyStatus(null), 2400);
  };

  const copyMarkdownTableValue = async (label: string, content: string) => {
    const copied = await copyText(content);

    if (copied) {
      setTableManualCopy(null);
      showTableCopyStatus("success", `${label} 코드를 복사했습니다.`);
      return;
    }

    setTableManualCopy({ label, content });
    showTableCopyStatus("error", "브라우저가 자동 복사를 막았습니다. 아래 선택된 내용을 Cmd+C / Ctrl+C로 복사해주세요.");
  };

  const importMarkdownFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setText(await file.text());
    if (markdownFileInputRef.current) markdownFileInputRef.current.value = "";
  };

  if (toolId === "markdown-preview") {
    return (
      <section className="detail-card workbench-card markdown-workbench">
        <div className="markdown-toolbar">
          <div className="markdown-actions">
            <button type="button" onClick={() => setText(markdownExample)}><Plus size={16} /> 예제 로드</button>
            <button type="button" onClick={() => markdownFileInputRef.current?.click()}><Upload size={16} /> 가져오기</button>
            <button type="button" onClick={() => downloadText("markdown-preview.md", text, "text/markdown;charset=utf-8")}><Download size={16} /> MD 다운로드</button>
            <button type="button" onClick={() => downloadMarkdownPdf("Markdown Preview", text)}><Download size={16} /> PDF 다운로드</button>
            <button type="button" onClick={() => setText("")}><RotateCcw size={16} /> 초기화</button>
            <input
              ref={markdownFileInputRef}
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              onChange={(event) => importMarkdownFile(event.target.files)}
            />
          </div>
          <div className="markdown-toolbar-right">
            <div className="markdown-mode-toggle" aria-label="마크다운 보기 모드">
              {(["split", "editor", "preview"] as MarkdownViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={markdownMode === mode ? "is-active" : ""}
                  onClick={() => setMarkdownMode(mode)}
                >
                  {mode === "split" ? "분할" : mode === "editor" ? "에디터" : "미리보기"}
                </button>
              ))}
            </div>
            <span>{markdownStats}</span>
          </div>
        </div>

        <div className={`markdown-editor-layout mode-${markdownMode}`}>
          <div className="markdown-editor-panel">
            <div className="markdown-panel-label">마크다운 에디터</div>
            <div className="markdown-code-editor">
              <div className="markdown-line-numbers" aria-hidden="true">
                {markdownLines.map((_, index) => <span key={index}>{index + 1}</span>)}
              </div>
              <textarea
                ref={markdownTextareaRef}
                value={text}
                spellCheck={false}
                onChange={(event) => setText(event.target.value)}
                aria-label="마크다운 에디터"
              />
            </div>
          </div>

          <div className="markdown-preview-panel">
            <div className="markdown-panel-label">미리보기</div>
            <div className="markdown-preview-pane" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
          </div>
        </div>

        <div className="markdown-quickbar" aria-label="빠른 마크다운 삽입">
          <button type="button" onClick={() => insertMarkdownSnippet("# ", "", "제목")}># 제목 <span>H1</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("## ", "", "제목")}>## 제목 <span>H2</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("**", "**", "굵게")}>**굵게** <span>Bold</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("*", "*", "기울임")}>*기울임* <span>Italic</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("~~", "~~", "취소")}>~~취소~~ <span>Strike</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("`", "`", "코드")}>`코드` <span>Code</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("- ", "", "항목")}>- 항목 <span>List</span></button>
          <button type="button" onClick={() => insertMarkdownSnippet("> ", "", "인용")}> &gt; 인용 <span>Quote</span></button>
        </div>
      </section>
    );
  }

  if (toolId === "markdown-table") {
    return (
      <section className="markdown-table-workbench">
        <div className="markdown-table-grid">
          <div className="markdown-table-column">
            <div className="markdown-table-card markdown-table-size-card">
              <h3>테이블 크기</h3>
              <div className="markdown-table-size-controls">
                <label className="field-block">
                  <span>열 개수</span>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={cols}
                    onChange={(event) => updateMarkdownTableSize(rows, Number(event.target.value))}
                  />
                </label>
                <label className="field-block">
                  <span>행 개수</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={rows}
                    onChange={(event) => updateMarkdownTableSize(Number(event.target.value), cols)}
                  />
                </label>
              </div>
            </div>

            <div className="markdown-table-card">
              <h3>테이블 편집</h3>
              <div className="markdown-table-editor" style={{ gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))` }}>
                {header.map((cell, colIndex) => (
                  <div key={`header-${colIndex}`} className="markdown-table-cell is-header">
                    <input
                      value={cell}
                      onChange={(event) => updateMarkdownTableCell(0, colIndex, event.target.value)}
                      aria-label={`${colIndex + 1}열 제목`}
                    />
                  </div>
                ))}
                {tableAligns.map((align, colIndex) => (
                  <div key={`align-${colIndex}`} className="markdown-table-cell markdown-table-align-cell">
                    <select
                      value={align}
                      onChange={(event) => updateMarkdownTableAlign(colIndex, event.target.value as MarkdownTableAlign)}
                      aria-label={`${colIndex + 1}열 정렬`}
                    >
                      {(Object.keys(markdownAlignLabels) as MarkdownTableAlign[]).map((alignOption) => (
                        <option key={alignOption} value={alignOption}>{markdownAlignLabels[alignOption]}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {body.map((line, bodyRowIndex) =>
                  line.map((cell, colIndex) => (
                    <div key={`body-${bodyRowIndex}-${colIndex}`} className="markdown-table-cell">
                      <input
                        value={cell}
                        onChange={(event) => updateMarkdownTableCell(bodyRowIndex + 1, colIndex, event.target.value)}
                        aria-label={`${bodyRowIndex + 1}행 ${colIndex + 1}열`}
                      />
                    </div>
                  )),
                )}
              </div>
            </div>

            <div className="markdown-table-card">
              <h3>CSV 가져오기</h3>
              <textarea
                className="markdown-table-csv"
                value={csvInput}
                onChange={(event) => setCsvInput(event.target.value)}
                placeholder="엑셀에서 복사한 데이터나 CSV를 붙여넣으세요"
              />
              <button type="button" className="markdown-table-import-button" onClick={importMarkdownCsv} disabled={!csvInput.trim()}>
                가져오기
              </button>
            </div>
          </div>

          <div className="markdown-table-column">
            <div className="markdown-table-card">
              <h3>미리보기</h3>
              <div className="markdown-table-preview" dangerouslySetInnerHTML={{ __html: tableHtml }} />
            </div>

            <div className="markdown-table-card">
              <h3>마크다운 코드</h3>
              <pre className="markdown-table-code">{table}</pre>
              <div className="markdown-table-actions">
                <button type="button" className="primary-action" onClick={() => void copyMarkdownTableValue("마크다운", table)}>
                  <Copy size={16} /> 마크다운 복사
                </button>
                <button type="button" onClick={() => void copyMarkdownTableValue("HTML", tableHtml)}>
                  HTML 복사
                </button>
              </div>
              {tableCopyStatus && (
                <p className={`markdown-table-copy-status is-${tableCopyStatus.type}`}>{tableCopyStatus.message}</p>
              )}
              {tableManualCopy && (
                <label className="markdown-table-manual-copy">
                  <span>{tableManualCopy.label} 직접 복사</span>
                  <textarea ref={tableManualCopyRef} readOnly value={tableManualCopy.content} />
                </label>
              )}
            </div>
          </div>
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

  if (toolId === "image-pdf-smart-tools") {
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>이미지/PDF 처리</strong><span>외부 도구 임베드</span></div>
        <div className="external-tool-shell">
          <iframe
            title="이미지/PDF 처리"
            src="https://jjao.kr/ho/single-index.html"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="field-help">
          이미지 압축, 배경 투명화, PDF 텍스트 넣기 기능을 제공하는 페이지를 이 화면 안에 붙였습니다.
          iframe이 차단되면 새 창에서 열어 주세요: <a href="https://jjao.kr/ho/single-index.html" target="_blank" rel="noreferrer">jjao.kr 도구 열기</a>
        </p>
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
  const [compression, setCompression] = useState(55);
  const [pageNumber, setPageNumber] = useState({ start: "1", prefix: "", suffix: "", position: "하단 중앙" });

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

  if (toolId === "pdf-compress-estimator") {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const estimated = totalSize * (1 - compression / 100);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 압축 예상</strong><span>업로드 전 용량 계획</span></div>
        <label className="upload-dropzone interactive">
          <Upload size={24} />
          <strong>PDF 파일 업로드</strong>
          <input type="file" accept=".pdf,application/pdf" multiple onChange={(e) => onFileChange(e.target.files)} />
        </label>
        <label className="field-block">
          <span>목표 압축률: {compression}%</span>
          <input type="range" min="5" max="90" value={compression} onChange={(e) => setCompression(Number(e.target.value))} />
        </label>
        <div className="metrics-grid">
          <div className="metric-card"><small>현재 용량</small><strong>{formatNumber(totalSize / 1024 / 1024)} MB</strong></div>
          <div className="metric-card"><small>예상 용량</small><strong>{formatNumber(estimated / 1024 / 1024)} MB</strong></div>
          <div className="metric-card"><small>절감 용량</small><strong>{formatNumber((totalSize - estimated) / 1024 / 1024)} MB</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "pdf-page-numbers") {
    const sample = `${pageNumber.prefix}${pageNumber.start}${pageNumber.suffix}`;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 페이지 번호</strong><span>번호 규칙 미리보기</span></div>
        <div className="form-grid">
          <label className="field-block"><span>시작 번호</span><input value={pageNumber.start} onChange={(e) => setPageNumber((prev) => ({ ...prev, start: e.target.value }))} /></label>
          <label className="field-block"><span>위치</span><select value={pageNumber.position} onChange={(e) => setPageNumber((prev) => ({ ...prev, position: e.target.value }))}><option>하단 중앙</option><option>하단 오른쪽</option><option>상단 오른쪽</option></select></label>
          <label className="field-block"><span>접두어</span><input value={pageNumber.prefix} onChange={(e) => setPageNumber((prev) => ({ ...prev, prefix: e.target.value }))} placeholder="Page " /></label>
          <label className="field-block"><span>접미어</span><input value={pageNumber.suffix} onChange={(e) => setPageNumber((prev) => ({ ...prev, suffix: e.target.value }))} placeholder=" / 12" /></label>
        </div>
        <div className="pdf-watermark-preview">
          <div className="document-sheet"><h3>페이지 번호 미리보기</h3><p>{pageNumber.position}</p><strong>{sample}</strong></div>
        </div>
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(`시작 번호 ${pageNumber.start}, 위치 ${pageNumber.position}, 형식 ${sample}`)}><Copy size={16} /> 규칙 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "pdf-protect") {
    const score = Math.min(100, text.length * 8 + (/[A-Z]/.test(text) ? 12 : 0) + (/\d/.test(text) ? 12 : 0) + (/[^A-Za-z0-9]/.test(text) ? 16 : 0));
    const label = score >= 70 ? "강함" : score >= 40 ? "보통" : "약함";
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 암호 보호</strong><span>공유 전 보안 체크</span></div>
        <label className="field-block"><span>암호 문구</span><input type="password" value={text} onChange={(e) => setText(e.target.value)} placeholder="문서 암호를 입력하세요" /></label>
        <div className="metrics-grid">
          <div className="metric-card"><small>강도</small><strong>{label}</strong></div>
          <div className="metric-card"><small>길이</small><strong>{text.length}자</strong></div>
          <div className="metric-card"><small>권장</small><strong>12자 이상</strong></div>
        </div>
        <textarea className="tool-textarea output" value={`PDF 보호 체크리스트\n- 암호 강도: ${label}\n- 별도 채널로 암호 전달\n- 편집/인쇄 권한 필요 여부 확인`} readOnly />
      </section>
    );
  }

  if (toolId === "pdf-signature") {
    const stamp = `검토 완료\n${text || "홍길동"}\n${formatDateInput(new Date())}`;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>PDF 서명 스탬프</strong><span>복사용 승인 블록</span></div>
        <input className="tool-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="서명자 이름" />
        <div className="result-panel"><strong>{stamp}</strong></div>
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(stamp)}><Copy size={16} /> 복사</button>
          <button type="button" onClick={() => downloadText("signature-stamp.txt", stamp)}><Download size={16} /> TXT 저장</button>
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

function ImageTools({ toolId }: { toolId: string }) {
  const [values, setValues] = useState({
    width: "1280",
    height: "720",
    targetWidth: "640",
    size: "2400",
    quality: "72",
    ratio: "16:9",
    hex: "#5B8DEF",
    label: "Preview",
  });
  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const width = parseNumber(values.width);
  const height = parseNumber(values.height);

  if (toolId === "image-resizer") {
    const targetWidth = parseNumber(values.targetWidth);
    const targetHeight = width > 0 ? Math.round((height / width) * targetWidth) : 0;
    const scale = width > 0 ? (targetWidth / width) * 100 : 0;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>이미지 리사이저</strong><span>비율 유지 계산</span></div>
        <div className="form-grid">
          <label className="field-block"><span>원본 너비</span><input value={values.width} onChange={(e) => setValue("width", e.target.value)} /></label>
          <label className="field-block"><span>원본 높이</span><input value={values.height} onChange={(e) => setValue("height", e.target.value)} /></label>
          <label className="field-block"><span>목표 너비</span><input value={values.targetWidth} onChange={(e) => setValue("targetWidth", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>결과 크기</small><strong>{targetWidth} x {targetHeight}</strong></div>
          <div className="metric-card"><small>스케일</small><strong>{formatNumber(scale)}%</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "image-compress-estimator") {
    const size = parseNumber(values.size);
    const quality = clamp(parseNumber(values.quality), 1, 100);
    const estimated = size * (0.18 + quality / 125);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>이미지 압축 예상</strong><span>품질별 용량 추정</span></div>
        <div className="form-grid">
          <label className="field-block"><span>현재 용량 (KB)</span><input value={values.size} onChange={(e) => setValue("size", e.target.value)} /></label>
          <label className="field-block"><span>품질: {quality}</span><input type="range" min="10" max="95" value={quality} onChange={(e) => setValue("quality", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>예상 용량</small><strong>{formatNumber(estimated, 0)} KB</strong></div>
          <div className="metric-card"><small>절감률</small><strong>{formatNumber((1 - estimated / Math.max(size, 1)) * 100)}%</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "aspect-ratio") {
    const [ratioWidth, ratioHeight] = values.ratio.split(":").map(Number);
    const computedHeight = Math.round((width / ratioWidth) * ratioHeight);
    const computedWidth = Math.round((height / ratioHeight) * ratioWidth);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>화면 비율 계산기</strong><span>프리셋 비율</span></div>
        <div className="form-grid">
          <label className="field-block"><span>비율</span><select value={values.ratio} onChange={(e) => setValue("ratio", e.target.value)}><option>16:9</option><option>4:3</option><option>1:1</option><option>3:2</option><option>9:16</option></select></label>
          <label className="field-block"><span>기준 너비</span><input value={values.width} onChange={(e) => setValue("width", e.target.value)} /></label>
          <label className="field-block"><span>기준 높이</span><input value={values.height} onChange={(e) => setValue("height", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>너비 기준</small><strong>{width} x {computedHeight}</strong></div>
          <div className="metric-card"><small>높이 기준</small><strong>{computedWidth} x {height}</strong></div>
        </div>
      </section>
    );
  }

  if (toolId === "color-converter") {
    const hex = normalizeHex(values.hex);
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const css = `${hex}\nrgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nhsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>색상 변환기</strong><span>HEX/RGB/HSL</span></div>
        <div className="form-grid">
          <label className="field-block"><span>HEX</span><input value={values.hex} onChange={(e) => setValue("hex", e.target.value)} /></label>
          <div className="metric-card" style={{ background: hex }}><small style={{ color: "#fff" }}>미리보기</small><strong style={{ color: "#fff" }}>{hex}</strong></div>
        </div>
        <textarea className="tool-textarea output" value={css} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(css)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#eef4ff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5b8def" font-family="Arial" font-size="32">${values.label} ${width}x${height}</text></svg>`;
  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>이미지 플레이스홀더</strong><span>SVG 생성</span></div>
      <div className="form-grid">
        <label className="field-block"><span>너비</span><input value={values.width} onChange={(e) => setValue("width", e.target.value)} /></label>
        <label className="field-block"><span>높이</span><input value={values.height} onChange={(e) => setValue("height", e.target.value)} /></label>
        <label className="field-block wide"><span>라벨</span><input value={values.label} onChange={(e) => setValue("label", e.target.value)} /></label>
      </div>
      <textarea className="tool-textarea output" value={svg} readOnly />
      <div className="tool-actions-row">
        <button type="button" onClick={() => copyText(svg)}><Copy size={16} /> SVG 복사</button>
        <button type="button" onClick={() => downloadText("placeholder.svg", svg, "image/svg+xml")}><Download size={16} /> SVG 저장</button>
      </div>
    </section>
  );
}

function DeveloperTools({ toolId }: { toolId: string }) {
  const [text, setText] = useState('{"name":"Gomdol Tool","tools":42}');
  const [count, setCount] = useState(5);
  const [timestamp, setTimestamp] = useState("1713916800");
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (toolId !== "hash-generator") return;
    sha256(text).then(setHash);
  }, [text, toolId]);

  if (toolId === "json-formatter") {
    let formatted = "";
    let compact = "";
    let error = "";
    try {
      const parsed = JSON.parse(text);
      formatted = JSON.stringify(parsed, null, 2);
      compact = JSON.stringify(parsed);
    } catch (err) {
      error = err instanceof Error ? err.message : "JSON 파싱 오류";
    }
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>JSON 포매터</strong><span>정렬/압축</span></div>
        <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
        {error ? <p className="field-help">{error}</p> : <textarea className="tool-textarea output" value={formatted} readOnly />}
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(formatted)} disabled={!formatted}><Copy size={16} /> 정렬 복사</button>
          <button type="button" onClick={() => copyText(compact)} disabled={!compact}><Copy size={16} /> 압축 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "base64-converter") {
    const encoded = encodeBase64(text);
    const decoded = decodeBase64(text);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>Base64 변환기</strong><span>인코딩/디코딩</span></div>
        <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="editor-split">
          <textarea className="tool-textarea output" value={encoded} readOnly />
          <textarea className="tool-textarea output" value={decoded} readOnly />
        </div>
      </section>
    );
  }

  if (toolId === "url-encoder") {
    const encoded = encodeURIComponent(text);
    let decoded = "";
    try {
      decoded = decodeURIComponent(text);
    } catch {
      decoded = "디코딩할 수 없는 URL 문자열입니다.";
    }
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>URL 인코더</strong><span>URL 안전 문자열</span></div>
        <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
        <textarea className="tool-textarea output" value={`Encoded:\n${encoded}\n\nDecoded:\n${decoded}`} readOnly />
      </section>
    );
  }

  if (toolId === "uuid-generator") {
    const uuids = Array.from({ length: count }, () => crypto.randomUUID()).join("\n");
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>UUID 생성기</strong><span>테스트 식별자</span></div>
        <label className="field-block"><span>생성 개수</span><input type="number" min="1" max="50" value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
        <textarea className="tool-textarea output" value={uuids} readOnly />
        <div className="tool-actions-row">
          <button type="button" onClick={() => copyText(uuids)}><Copy size={16} /> 복사</button>
        </div>
      </section>
    );
  }

  if (toolId === "timestamp-converter") {
    const numeric = parseNumber(timestamp);
    const millis = timestamp.length <= 10 ? numeric * 1000 : numeric;
    const date = new Date(millis);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>타임스탬프 변환기</strong><span>Unix ↔ ISO</span></div>
        <div className="form-grid">
          <label className="field-block"><span>Timestamp</span><input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></label>
          <button type="button" onClick={() => setTimestamp(`${Math.floor(Date.now() / 1000)}`)}><RotateCcw size={16} /> 현재 시각</button>
        </div>
        <div className="result-panel"><strong>{Number.isFinite(date.getTime()) ? date.toISOString() : "유효하지 않은 값"}</strong></div>
      </section>
    );
  }

  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>해시 생성기</strong><span>SHA-256</span></div>
      <textarea className="tool-textarea" value={text} onChange={(e) => setText(e.target.value)} />
      <textarea className="tool-textarea output" value={hash} readOnly />
      <div className="tool-actions-row">
        <button type="button" onClick={() => copyText(hash)}><Copy size={16} /> 복사</button>
      </div>
    </section>
  );
}

type BrokerageDealType = "sale" | "lease" | "monthly";
type BrokeragePropertyType = "housing" | "officetel" | "other";

function getBrokerageRule(amount: number, dealType: BrokerageDealType, propertyType: BrokeragePropertyType) {
  if (propertyType === "officetel") {
    return { rate: dealType === "sale" ? 0.005 : 0.004, cap: null as number | null, label: "오피스텔" };
  }

  if (propertyType === "other") {
    return { rate: 0.009, cap: null as number | null, label: "주택 이외" };
  }

  if (dealType === "sale") {
    if (amount < 50_000_000) return { rate: 0.006, cap: 250_000, label: "주택 매매 5천만원 미만" };
    if (amount < 200_000_000) return { rate: 0.005, cap: 800_000, label: "주택 매매 5천만원 이상~2억원 미만" };
    if (amount < 900_000_000) return { rate: 0.004, cap: null, label: "주택 매매 2억원 이상~9억원 미만" };
    if (amount < 1_200_000_000) return { rate: 0.005, cap: null, label: "주택 매매 9억원 이상~12억원 미만" };
    if (amount < 1_500_000_000) return { rate: 0.006, cap: null, label: "주택 매매 12억원 이상~15억원 미만" };
    return { rate: 0.007, cap: null, label: "주택 매매 15억원 이상" };
  }

  if (amount < 50_000_000) return { rate: 0.005, cap: 200_000, label: "주택 임대차 5천만원 미만" };
  if (amount < 100_000_000) return { rate: 0.004, cap: 300_000, label: "주택 임대차 5천만원 이상~1억원 미만" };
  if (amount < 600_000_000) return { rate: 0.003, cap: null, label: "주택 임대차 1억원 이상~6억원 미만" };
  if (amount < 1_200_000_000) return { rate: 0.004, cap: null, label: "주택 임대차 6억원 이상~12억원 미만" };
  if (amount < 1_500_000_000) return { rate: 0.005, cap: null, label: "주택 임대차 12억원 이상~15억원 미만" };
  return { rate: 0.006, cap: null, label: "주택 임대차 15억원 이상" };
}

function RealEstateTools({ toolId }: { toolId: string }) {
  const [values, setValues] = useState({
    dealPrice: "900000000",
    deposit: "300000000",
    monthlyRent: "1000000",
    vatRate: "10",
    directRate: "",
    acquisitionPrice: "900000000",
    acquisitionRate: "1.0",
    educationRate: "0.1",
    agricultureRate: "0",
    homePrice: "900000000",
    ltvRate: "60",
    existingDebt: "0",
    currentDeposit: "500000000",
    targetDeposit: "300000000",
    conversionRate: "5.5",
  });
  const [dealType, setDealType] = useState<BrokerageDealType>("sale");
  const [propertyType, setPropertyType] = useState<BrokeragePropertyType>("housing");
  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  if (toolId === "brokerage-fee") {
    const salePrice = parseNumber(values.dealPrice);
    const deposit = parseNumber(values.deposit);
    const monthlyRent = parseNumber(values.monthlyRent);
    const monthlyBy100 = deposit + monthlyRent * 100;
    const monthlyBy70 = deposit + monthlyRent * 70;
    const transactionAmount = dealType === "sale" ? salePrice : dealType === "lease" ? deposit : monthlyBy100 < 50_000_000 ? monthlyBy70 : monthlyBy100;
    const rule = getBrokerageRule(transactionAmount, dealType, propertyType);
    const effectiveRate = values.directRate.trim() ? parseNumber(values.directRate) / 100 : rule.rate;
    const rawFee = transactionAmount * effectiveRate;
    const fee = rule.cap ? Math.min(rawFee, rule.cap) : rawFee;
    const vat = fee * (parseNumber(values.vatRate) / 100);
    const total = fee + vat;

    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>중개보수 계산기</strong><span>서울 기준 상한요율</span></div>
        <div className="form-grid">
          <label className="field-block"><span>계약 유형</span><select value={dealType} onChange={(e) => setDealType(e.target.value as BrokerageDealType)}><option value="sale">매매</option><option value="lease">전세</option><option value="monthly">월세</option></select></label>
          <label className="field-block"><span>물건 종류</span><select value={propertyType} onChange={(e) => setPropertyType(e.target.value as BrokeragePropertyType)}><option value="housing">주택</option><option value="officetel">오피스텔</option><option value="other">그 외</option></select></label>
          {dealType === "sale" ? (
            <label className="field-block wide"><span>매매가</span><input value={values.dealPrice} onChange={(e) => setValue("dealPrice", e.target.value)} /></label>
          ) : (
            <>
              <label className="field-block"><span>보증금/전세금</span><input value={values.deposit} onChange={(e) => setValue("deposit", e.target.value)} /></label>
              {dealType === "monthly" ? <label className="field-block"><span>월세</span><input value={values.monthlyRent} onChange={(e) => setValue("monthlyRent", e.target.value)} /></label> : null}
            </>
          )}
          <label className="field-block"><span>요율 직접 입력 (%)</span><input value={values.directRate} onChange={(e) => setValue("directRate", e.target.value)} placeholder={formatNumber(rule.rate * 100, 2)} /></label>
          <label className="field-block"><span>부가세율 (%)</span><input value={values.vatRate} onChange={(e) => setValue("vatRate", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>거래금액</small><strong>{formatNumber(transactionAmount, 0)}원</strong></div>
          <div className="metric-card"><small>적용 요율</small><strong>{formatNumber(effectiveRate * 100, 2)}%</strong></div>
          <div className="metric-card"><small>중개보수 상한</small><strong>{formatNumber(fee, 0)}원</strong></div>
          <div className="metric-card"><small>부가세 포함</small><strong>{formatNumber(total, 0)}원</strong></div>
        </div>
        <p className="field-help">{rule.label} 기준입니다. 중개보수는 상한 범위 안에서 협의할 수 있습니다.</p>
      </section>
    );
  }

  if (toolId === "acquisition-tax-estimator") {
    const price = parseNumber(values.acquisitionPrice);
    const acquisitionTax = price * (parseNumber(values.acquisitionRate) / 100);
    const educationTax = price * (parseNumber(values.educationRate) / 100);
    const agricultureTax = price * (parseNumber(values.agricultureRate) / 100);
    const total = acquisitionTax + educationTax + agricultureTax;
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>취득세 간편 계산</strong><span>요율 직접 조정</span></div>
        <div className="form-grid">
          <label className="field-block wide"><span>취득가액</span><input value={values.acquisitionPrice} onChange={(e) => setValue("acquisitionPrice", e.target.value)} /></label>
          <label className="field-block"><span>취득세율 (%)</span><input value={values.acquisitionRate} onChange={(e) => setValue("acquisitionRate", e.target.value)} /></label>
          <label className="field-block"><span>지방교육세율 (%)</span><input value={values.educationRate} onChange={(e) => setValue("educationRate", e.target.value)} /></label>
          <label className="field-block"><span>농특세율 (%)</span><input value={values.agricultureRate} onChange={(e) => setValue("agricultureRate", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>취득세</small><strong>{formatNumber(acquisitionTax, 0)}원</strong></div>
          <div className="metric-card"><small>지방교육세</small><strong>{formatNumber(educationTax, 0)}원</strong></div>
          <div className="metric-card"><small>농특세</small><strong>{formatNumber(agricultureTax, 0)}원</strong></div>
          <div className="metric-card"><small>합계</small><strong>{formatNumber(total, 0)}원</strong></div>
        </div>
        <p className="field-help">주택 수, 조정대상지역, 면적, 감면 여부에 따라 실제 세액이 달라질 수 있어 요율을 직접 수정할 수 있게 했습니다.</p>
      </section>
    );
  }

  if (toolId === "ltv-calculator") {
    const homePrice = parseNumber(values.homePrice);
    const limit = homePrice * (parseNumber(values.ltvRate) / 100);
    const available = Math.max(limit - parseNumber(values.existingDebt), 0);
    const equity = Math.max(homePrice - available, 0);
    return (
      <section className="detail-card workbench-card">
        <div className="workbench-head"><strong>LTV 계산기</strong><span>담보대출 한도 추정</span></div>
        <div className="form-grid">
          <label className="field-block"><span>주택 가격</span><input value={values.homePrice} onChange={(e) => setValue("homePrice", e.target.value)} /></label>
          <label className="field-block"><span>LTV (%)</span><input value={values.ltvRate} onChange={(e) => setValue("ltvRate", e.target.value)} /></label>
          <label className="field-block wide"><span>기존 대출</span><input value={values.existingDebt} onChange={(e) => setValue("existingDebt", e.target.value)} /></label>
        </div>
        <div className="metrics-grid">
          <div className="metric-card"><small>LTV 한도</small><strong>{formatNumber(limit, 0)}원</strong></div>
          <div className="metric-card"><small>추정 가능액</small><strong>{formatNumber(available, 0)}원</strong></div>
          <div className="metric-card"><small>필요 자기자본</small><strong>{formatNumber(equity, 0)}원</strong></div>
        </div>
      </section>
    );
  }

  const currentDeposit = parseNumber(values.currentDeposit);
  const targetDeposit = parseNumber(values.targetDeposit);
  const difference = Math.max(currentDeposit - targetDeposit, 0);
  const monthlyRent = (difference * (parseNumber(values.conversionRate) / 100)) / 12;
  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head"><strong>전월세 전환 계산기</strong><span>보증금 차액 환산</span></div>
      <div className="form-grid">
        <label className="field-block"><span>기존 보증금</span><input value={values.currentDeposit} onChange={(e) => setValue("currentDeposit", e.target.value)} /></label>
        <label className="field-block"><span>변경 보증금</span><input value={values.targetDeposit} onChange={(e) => setValue("targetDeposit", e.target.value)} /></label>
        <label className="field-block wide"><span>연 전환율 (%)</span><input value={values.conversionRate} onChange={(e) => setValue("conversionRate", e.target.value)} /></label>
      </div>
      <div className="metrics-grid">
        <div className="metric-card"><small>보증금 차액</small><strong>{formatNumber(difference, 0)}원</strong></div>
        <div className="metric-card"><small>월세 환산액</small><strong>{formatNumber(monthlyRent, 0)}원</strong></div>
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
  const [company, setCompany] = useState("Gomdol Tool");
  const [recipient, setRecipient] = useState("Acme Corp");
  const [title, setTitle] = useState(toolName);
  const [name, setName] = useState("홍길동");
  const [role, setRole] = useState("프로덕트 디자이너");
  const [phone, setPhone] = useState("02-1234-5678");
  const [email, setEmail] = useState("hello@utilitywiki.kr");
  const [website, setWebsite] = useState("https://utilitywiki.kr");
  const [department, setDepartment] = useState("브랜드팀");
  const [mobile, setMobile] = useState("010-1234-5678");
  const [address, setAddress] = useState("서울시 강남구 테헤란로 123");
  const [logoUrl, setLogoUrl] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [sigTemplate, setSigTemplate] = useState("professional");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [sigFontSize, setSigFontSize] = useState<"small" | "medium" | "large">("medium");
  const [dividerStyle, setDividerStyle] = useState<"line" | "pipe" | "none">("line");
  const [sigInfoTab, setSigInfoTab] = useState<"basic" | "contact" | "social">("basic");
  const [sigCopyStatus, setSigCopyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sigManualCopy, setSigManualCopy] = useState<{ type: "html" | "text"; label: string; content: string } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [items] = useState([
    { name: "서비스 기획", qty: 1, price: 800000 },
    { name: "디자인 수정", qty: 2, price: 250000 },
  ]);
  // ── 도장 생성기 옵션 ───────────────────────────────────────
  const [stampShape, setStampShape] = useState<"circle" | "square" | "ellipse" | "rounded">("circle");
  const [stampType, setStampType] = useState<"personal" | "official" | "name" | "rect">("personal");
  const [stampColor, setStampColor] = useState<string>("#c93a3a");
  const [stampFont, setStampFont] = useState<"serif" | "sans" | "mincho" | "myeongjo">("serif");
  const [stampBorder, setStampBorder] = useState<number>(6);
  const [stampSize, setStampSize] = useState<number>(220);
  const [stampLayout, setStampLayout] = useState<"auto" | "horizontal" | "vertical" | "grid">("auto");
  const [stampInnerBorder, setStampInnerBorder] = useState<boolean>(false);
  const [stampSuffix, setStampSuffix] = useState<"none" | "in" | "印">("none");
  const [stampTransparent, setStampTransparent] = useState<boolean>(true);
  const [stampTexture, setStampTexture] = useState<"off" | "soft" | "medium" | "strong">("medium");
  const [stampTilt, setStampTilt] = useState<boolean>(true);
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
  const [mobileTaxTab, setMobileTaxTab] = useState<"form" | "preview">("form");
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
  const sigManualCopyRef = useRef<HTMLTextAreaElement | HTMLDivElement | null>(null);

  useEffect(() => {
    if (toolId !== "stamp-generator" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 동적 적용 (선명한 출력을 위해 2배 해상도)
    const baseSize = Math.max(120, Math.min(360, stampSize));
    const isEllipse = stampShape === "ellipse";
    const w = isEllipse ? baseSize : baseSize;
    const h = isEllipse ? Math.round(baseSize * 0.72) : baseSize;
    const dpr = 2;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경 (투명 옵션 처리)
    ctx.clearRect(0, 0, w, h);
    if (!stampTransparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }

    const cx = w / 2;
    const cy = h / 2;
    const padding = Math.max(stampBorder + 6, 10);
    const color = stampColor;
    const lineWidth = stampBorder;

    // 텍스처 강도별 파라미터 (잉크는 진하게, 노이즈는 살짝만)
    const textureParams = {
      off:    { noise: 0,    drop: 0,    edgeJitter: 0,    rotateMax: 0,    blur: 0,   ink: 1.0 },
      soft:   { noise: 0.05, drop: 0.015, edgeJitter: 0.4, rotateMax: 0.01, blur: 0,   ink: 1.0 },
      medium: { noise: 0.10, drop: 0.04,  edgeJitter: 0.8, rotateMax: 0.02, blur: 0,   ink: 1.0 },
      strong: { noise: 0.18, drop: 0.08,  edgeJitter: 1.3, rotateMax: 0.03, blur: 0,   ink: 0.98 },
    } as const;
    const tex = textureParams[stampTexture];

    // 전체 살짝 기울이기 (실제로 도장 찍을 때처럼)
    if (stampTilt && tex.rotateMax > 0) {
      const tilt = (Math.random() - 0.5) * tex.rotateMax * 2;
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.translate(-cx, -cy);
    }

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // ── 외곽 테두리 그리기 (텍스처 ON일 때 미세하게 들쭉날쭉) ──
    const drawShapePath = (offset: number) => {
      ctx.beginPath();
      if (stampShape === "circle") {
        const baseR = (Math.min(w, h) / 2) - padding - offset;
        if (tex.edgeJitter > 0) {
          const steps = 180;
          for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * Math.PI * 2;
            const jitter = (Math.random() - 0.5) * tex.edgeJitter;
            const r = baseR + jitter;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
        }
      } else if (stampShape === "ellipse") {
        const rx = (w / 2) - padding - offset;
        const ry = (h / 2) - padding - offset;
        if (tex.edgeJitter > 0) {
          const steps = 180;
          for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * Math.PI * 2;
            const j = (Math.random() - 0.5) * tex.edgeJitter;
            const x = cx + Math.cos(a) * (rx + j);
            const y = cy + Math.sin(a) * (ry + j);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        }
      } else if (stampShape === "square") {
        const side = Math.min(w, h) - padding * 2 - offset * 2;
        ctx.rect(cx - side / 2, cy - side / 2, side, side);
      } else if (stampShape === "rounded") {
        const side = Math.min(w, h) - padding * 2 - offset * 2;
        const r = side * 0.16;
        const x = cx - side / 2;
        const y = cy - side / 2;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + side - r, y);
        ctx.quadraticCurveTo(x + side, y, x + side, y + r);
        ctx.lineTo(x + side, y + side - r);
        ctx.quadraticCurveTo(x + side, y + side, x + side - r, y + side);
        ctx.lineTo(x + r, y + side);
        ctx.quadraticCurveTo(x, y + side, x, y + side - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
    };

    const drawShape = (offset: number, lw: number) => {
      ctx.lineWidth = lw;
      drawShapePath(offset);
      ctx.stroke();
    };

    // 외곽선 (잉크가 진하도록 두 번 겹쳐 그림)
    ctx.globalAlpha = tex.ink;
    drawShape(0, lineWidth);
    drawShape(0, lineWidth); // 오버프린트로 진하게
    if (stampInnerBorder) {
      drawShape(lineWidth + 4, Math.max(1, lineWidth * 0.4));
      drawShape(lineWidth + 4, Math.max(1, lineWidth * 0.4));
    }
    ctx.globalAlpha = 1;

    // ── 글자 ────────────────────────────────────
    const fontMap: Record<typeof stampFont, string> = {
      serif: '"Nanum Myeongjo", "맑은 고딕", "Malgun Gothic", serif',
      sans: '"Pretendard", "맑은 고딕", "Malgun Gothic", sans-serif',
      mincho: '"Noto Serif KR", "Nanum Myeongjo", serif',
      myeongjo: '"Batang", "바탕", "Nanum Myeongjo", serif',
    };
    const fontFamily = fontMap[stampFont];

    const baseText = (name || "성명").trim();
    let chars = baseText.split("");
    if (stampSuffix === "in") chars = [...chars, "인"];
    if (stampSuffix === "印") chars = [...chars, "印"];

    // 사용 가능한 내부 영역
    const innerSize = Math.min(w, h) - padding * 2 - lineWidth * 2 - (stampInnerBorder ? 16 : 0);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 글자 한 자 한 자 살짝 흔들리고 회전 + 두 번 그려 진하게
    const jitterChar = (cb: () => void) => {
      if (tex.edgeJitter <= 0) {
        cb();
        cb(); // overprint for darker fill
        return;
      }
      const jx = (Math.random() - 0.5) * tex.edgeJitter * 0.5;
      const jy = (Math.random() - 0.5) * tex.edgeJitter * 0.5;
      const rot = (Math.random() - 0.5) * 0.03;
      ctx.save();
      ctx.translate(jx, jy);
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = tex.ink;
      cb();
      cb(); // overprint
      ctx.restore();
    };

    const drawCenter = (text: string, fontSize: number) => {
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      jitterChar(() => ctx.fillText(text, cx, cy + fontSize * 0.04));
    };

    const drawGrid2x2 = (cs: string[], fontSize: number) => {
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      const gap = fontSize * 0.85;
      // 한국 도장 관습: 우상→좌상→우하→좌하 순으로 읽음
      const positions = [
        { x: cx + gap / 2, y: cy - gap / 2 },
        { x: cx - gap / 2, y: cy - gap / 2 },
        { x: cx + gap / 2, y: cy + gap / 2 },
        { x: cx - gap / 2, y: cy + gap / 2 },
      ];
      cs.slice(0, 4).forEach((c, i) => {
        const p = positions[i];
        jitterChar(() => ctx.fillText(c, p.x, p.y));
      });
    };

    const drawHorizontal = (cs: string[], fontSize: number) => {
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      const total = cs.length;
      const gap = fontSize * 0.95;
      const startX = cx - (gap * (total - 1)) / 2;
      cs.forEach((c, i) => {
        const x = startX + gap * i;
        jitterChar(() => ctx.fillText(c, x, cy));
      });
    };

    const drawVertical = (cs: string[], fontSize: number) => {
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      const total = cs.length;
      const gap = fontSize * 1.0;
      const startY = cy - (gap * (total - 1)) / 2;
      cs.forEach((c, i) => {
        const y = startY + gap * i;
        jitterChar(() => ctx.fillText(c, cx, y));
      });
    };

    const fitFontSize = (count: number, mode: "single" | "row" | "col" | "grid") => {
      if (mode === "single") return innerSize * 0.62;
      if (mode === "grid") return innerSize * 0.36;
      if (mode === "row") return Math.min(innerSize / Math.max(count, 1) * 0.9, innerSize * 0.5);
      return Math.min(innerSize / Math.max(count, 1) * 0.9, innerSize * 0.5);
    };

    const layout = stampLayout;
    const count = chars.length;

    if (layout === "horizontal") {
      drawHorizontal(chars, fitFontSize(count, "row"));
    } else if (layout === "vertical") {
      drawVertical(chars, fitFontSize(count, "col"));
    } else if (layout === "grid") {
      drawGrid2x2(chars, fitFontSize(count, "grid"));
    } else {
      if (count <= 1) {
        drawCenter(chars[0] || "", fitFontSize(count, "single"));
      } else if (count === 2) {
        if (stampShape === "ellipse") drawHorizontal(chars, fitFontSize(count, "row"));
        else drawHorizontal(chars, innerSize * 0.45);
      } else if (count === 3) {
        drawHorizontal(chars, fitFontSize(count, "row"));
      } else if (count === 4) {
        drawGrid2x2(chars, fitFontSize(count, "grid"));
      } else {
        drawHorizontal(chars, fitFontSize(count, "row"));
      }
    }

    // 회전 변환 복귀
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── 잉크 텍스처: 픽셀 단위로 random drop / noise 적용 ──
    if (tex.noise > 0) {
      const pxW = canvas.width;
      const pxH = canvas.height;
      const img = ctx.getImageData(0, 0, pxW, pxH);
      const data = img.data;
      // 시드 흔들기 (한 번 그리면 픽셀이 매번 바뀌지 않게 deterministic)
      let seed = (baseText.length * 9301 + stampBorder * 49297 + stampSize * 233) % 233280;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a === 0) continue; // 투명 픽셀은 skip
        // ink 픽셀에 grain 효과: 일부는 완전히 비우기 (도장이 종이에 안 닿은 부분)
        if (rnd() < tex.drop) {
          data[i + 3] = 0;
          continue;
        }
        // alpha 변동
        const variation = 1 - rnd() * tex.noise;
        data[i + 3] = Math.max(0, Math.min(255, Math.round(a * variation)));
      }
      ctx.putImageData(img, 0, 0);
    }

    // 블러는 잉크가 너무 옅어 보이게 만들어 제거함
  }, [
    name,
    toolId,
    stampShape,
    stampType,
    stampColor,
    stampFont,
    stampBorder,
    stampSize,
    stampLayout,
    stampInnerBorder,
    stampSuffix,
    stampTransparent,
    stampTexture,
    stampTilt,
  ]);

  useEffect(() => {
    if (!sigManualCopy) return;

    window.requestAnimationFrame(() => {
      const copyTarget = sigManualCopyRef.current;
      if (!copyTarget) return;

      copyTarget.focus();
      if (copyTarget instanceof HTMLTextAreaElement) {
        copyTarget.select();
        return;
      }

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(copyTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }, [sigManualCopy]);

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
        <TaxPreviewScaleFrame>
          <table className="tax-preview-table">
            <colgroup>
              <col className="tax-col-month" />
              <col className="tax-col-day" />
              <col className="tax-col-label" />
              <col className="tax-col-wide" />
              <col className="tax-col-label" />
              <col className="tax-col-party" />
              <col className="tax-col-label" />
              <col className="tax-col-mid" />
              <col className="tax-col-money" />
              <col className="tax-col-money" />
              <col className="tax-col-note" />
            </colgroup>
            <tbody>
            <tr>
              <td className="tax-small-cell" colSpan={2}>책번호</td>
              <td className="tax-title-cell" colSpan={7} rowSpan={2} style={{ backgroundColor: copy.accentBg }}>
                <strong style={{ color: copy.titleColor }}>{invoiceKind === "tax" ? "세 금 계 산 서" : "계 산 서"}</strong>
                <span>{copy.paperNote}</span>
              </td>
              <td className="tax-small-cell" colSpan={2}>공급받는자 등록번호</td>
            </tr>
            <tr>
              <td className="tax-small-cell" colSpan={2}>일련번호</td>
              <td className="tax-small-cell tax-center" colSpan={2}>{approvalNumber || "-"}</td>
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
        </TaxPreviewScaleFrame>
      </article>
    );

    const printTarget = `
      <html>
        <head>
          <style>
            body { font-family: Arial, 'Noto Sans KR', sans-serif; padding: 24px; color: #1f2937; }
            .sheet { page-break-after: always; break-after: page; margin: 0; }
            .sheet:last-child { page-break-after: avoid; break-after: avoid; }
            @media print { body { padding: 0; } }
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

    const downloadTaxInvoicePdf = () => {
      const win = window.open("", "_blank");
      if (!win) {
        alert("팝업이 차단되었습니다. 팝업을 허용한 후 다시 시도해주세요.");
        return;
      }
      const printHtml = printTarget.replace("</body>", "<script>window.onload=function(){window.print();}<\/script></body>");
      win.document.write(printHtml);
      win.document.close();
      win.focus();
    };

    return (
      <section className="detail-card workbench-card tax-invoice-workbench">
        <div className="tax-mobile-tabs">
          <button type="button" className={`tax-mobile-tab ${mobileTaxTab === "form" ? "is-active" : ""}`} onClick={() => setMobileTaxTab("form")}>입력 양식</button>
          <button type="button" className={`tax-mobile-tab ${mobileTaxTab === "preview" ? "is-active" : ""}`} onClick={() => setMobileTaxTab("preview")}>미리보기</button>
        </div>
        <div className="tax-invoice-layout">
          <div className={`tax-invoice-form-column${mobileTaxTab === "preview" ? " tax-mobile-hidden" : ""}`}>
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
              <button type="button" className="primary-action" onClick={downloadTaxInvoicePdf}>
                <Printer size={16} />
                PDF로 인쇄하기 (공급자/공급받는자용)
              </button>
              <button type="button" onClick={resetInvoice}>
                <RotateCcw size={16} />
                초기화
              </button>
            </div>
          </div>

          <aside className={`tax-invoice-preview-column${mobileTaxTab === "form" ? " tax-mobile-hidden" : ""}`}>
            <div className="tax-preview-head">
              <h3>미리보기</h3>
              <button type="button" className="primary-action tax-print-button" onClick={downloadTaxInvoicePdf}>
                <Printer size={16} />
                PDF로 인쇄하기
              </button>
            </div>
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
      link.download = `stamp-${(name || "stamp").trim()}.png`;
      link.click();
    };

    const presetColors: { label: string; value: string }[] = [
      { label: "주홍", value: "#c93a3a" },
      { label: "선홍", value: "#e02020" },
      { label: "진청", value: "#1e3a8a" },
      { label: "검정", value: "#111111" },
    ];

    const shapes: { value: typeof stampShape; label: string }[] = [
      { value: "circle", label: "원형" },
      { value: "square", label: "사각" },
      { value: "rounded", label: "둥근사각" },
      { value: "ellipse", label: "타원" },
    ];

    const types: { value: typeof stampType; label: string; hint: string }[] = [
      { value: "personal", label: "인감", hint: "개인용" },
      { value: "official", label: "직인", hint: "법인용" },
      { value: "name", label: "막도장", hint: "성명" },
      { value: "rect", label: "사각도장", hint: "결재용" },
    ];

    const fonts: { value: typeof stampFont; label: string }[] = [
      { value: "serif", label: "명조" },
      { value: "sans", label: "고딕" },
      { value: "mincho", label: "전서" },
      { value: "myeongjo", label: "바탕" },
    ];

    const layouts: { value: typeof stampLayout; label: string }[] = [
      { value: "auto", label: "자동" },
      { value: "horizontal", label: "가로" },
      { value: "vertical", label: "세로" },
      { value: "grid", label: "2×2" },
    ];

    return (
      <section className="detail-card workbench-card stamp-workbench">
        <div className="workbench-head">
          <strong>도장 생성기</strong>
          <span>모양·색상·글꼴 자유 설정 · 투명 PNG 저장</span>
        </div>

        <div className="stamp-layout">
          <div className="stamp-controls">
            <label className="field-block">
              <span>이름 / 글자</span>
              <input
                className="tool-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 홍길동, 대표이사"
                maxLength={8}
              />
            </label>

            <div className="field-block">
              <span>도장 종류</span>
              <div className="stamp-chip-row">
                {types.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    className={`stamp-chip ${stampType === t.value ? "is-active" : ""}`}
                    onClick={() => {
                      setStampType(t.value);
                      // 종류에 따라 모양 자동 추천
                      if (t.value === "rect") setStampShape("rounded");
                      else if (t.value === "official") setStampShape("square");
                      else setStampShape("circle");
                    }}
                  >
                    <strong>{t.label}</strong>
                    <small>{t.hint}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span>모양</span>
              <div className="stamp-chip-row">
                {shapes.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    className={`stamp-chip stamp-chip-sm ${stampShape === s.value ? "is-active" : ""}`}
                    onClick={() => setStampShape(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span>글꼴</span>
              <div className="stamp-chip-row">
                {fonts.map((f) => (
                  <button
                    type="button"
                    key={f.value}
                    className={`stamp-chip stamp-chip-sm ${stampFont === f.value ? "is-active" : ""}`}
                    onClick={() => setStampFont(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span>글자 배치</span>
              <div className="stamp-chip-row">
                {layouts.map((l) => (
                  <button
                    type="button"
                    key={l.value}
                    className={`stamp-chip stamp-chip-sm ${stampLayout === l.value ? "is-active" : ""}`}
                    onClick={() => setStampLayout(l.value)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span>색상</span>
              <div className="stamp-color-row">
                {presetColors.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    title={c.label}
                    className={`stamp-color-swatch ${stampColor === c.value ? "is-active" : ""}`}
                    style={{ background: c.value }}
                    onClick={() => setStampColor(c.value)}
                  />
                ))}
                <label className="stamp-color-pick">
                  <input
                    type="color"
                    value={stampColor}
                    onChange={(e) => setStampColor(e.target.value)}
                  />
                  <span>직접 선택</span>
                </label>
              </div>
            </div>

            <div className="stamp-slider-grid">
              <label className="field-block">
                <span>크기 ({stampSize}px)</span>
                <input
                  type="range"
                  min={140}
                  max={320}
                  step={10}
                  value={stampSize}
                  onChange={(e) => setStampSize(Number(e.target.value))}
                />
              </label>
              <label className="field-block">
                <span>테두리 굵기 ({stampBorder}px)</span>
                <input
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={stampBorder}
                  onChange={(e) => setStampBorder(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="field-block">
              <span>잉크 질감</span>
              <div className="stamp-chip-row">
                {(["off", "soft", "medium", "strong"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={`stamp-chip stamp-chip-sm ${stampTexture === v ? "is-active" : ""}`}
                    onClick={() => setStampTexture(v)}
                  >
                    {v === "off" ? "깔끔" : v === "soft" ? "약간" : v === "medium" ? "보통" : "강하게"}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <span>옵션</span>
              <div className="stamp-toggle-row">
                <label className="stamp-toggle">
                  <input
                    type="checkbox"
                    checked={stampInnerBorder}
                    onChange={(e) => setStampInnerBorder(e.target.checked)}
                  />
                  <span>이중 테두리</span>
                </label>
                <label className="stamp-toggle">
                  <input
                    type="checkbox"
                    checked={stampTransparent}
                    onChange={(e) => setStampTransparent(e.target.checked)}
                  />
                  <span>투명 배경</span>
                </label>
                <label className="stamp-toggle">
                  <input
                    type="checkbox"
                    checked={stampTilt}
                    onChange={(e) => setStampTilt(e.target.checked)}
                  />
                  <span>기울기</span>
                </label>
                <div className="stamp-suffix">
                  <span>접미자</span>
                  <div className="stamp-chip-row">
                    {(["none", "in", "印"] as const).map((v) => (
                      <button
                        type="button"
                        key={v}
                        className={`stamp-chip stamp-chip-xs ${stampSuffix === v ? "is-active" : ""}`}
                        onClick={() => setStampSuffix(v)}
                      >
                        {v === "none" ? "없음" : v === "in" ? "인" : "印"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stamp-preview-pane">
            <div
              className={`stamp-wrap ${stampTransparent ? "is-transparent" : ""}`}
              data-shape={stampShape}
            >
              <canvas ref={canvasRef} />
            </div>
            <div className="stamp-meta">
              <span>{shapes.find((s) => s.value === stampShape)?.label}</span>
              <span>·</span>
              <span>{types.find((t) => t.value === stampType)?.label}</span>
              <span>·</span>
              <span>{fonts.find((f) => f.value === stampFont)?.label}</span>
            </div>
            <div className="tool-actions-row stamp-actions">
              <button type="button" className="primary-action" onClick={downloadPng}>
                <Download size={16} /> PNG 저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setStampShape("circle");
                  setStampType("personal");
                  setStampColor("#c93a3a");
                  setStampFont("serif");
                  setStampBorder(6);
                  setStampSize(220);
                  setStampLayout("auto");
                  setStampInnerBorder(false);
                  setStampSuffix("none");
                  setStampTransparent(true);
                  setStampTexture("medium");
                  setStampTilt(true);
                  setName("홍길동");
                }}
              >
                <RotateCcw size={16} /> 초기화
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (toolId === "email-signature") {
    const fsMap = {
      small:  { base: "11px", name: "14px", role: "12px", line: "1.5" },
      medium: { base: "13px", name: "16px", role: "13px", line: "1.6" },
      large:  { base: "15px", name: "18px", role: "15px", line: "1.7" },
    };
    const fs = fsMap[sigFontSize];
    const ac = accentColor;
    const deptCompany = [department, company].filter(Boolean).join(" | ");
    const logoImg = logoUrl
      ? `<img src="${logoUrl}" alt="${name}" width="52" height="52" style="width:52px;height:52px;border-radius:50%;object-fit:cover;display:block;margin-bottom:10px" />`
      : "";
    const websiteClean = website.replace(/^https?:\/\//, "");
    const websiteHref = website.startsWith("http") ? website : website ? `https://${website}` : "";

    const contactRows = [
      phone   && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#374151;line-height:${fs.line}">T: ${phone}</td></tr>`,
      mobile  && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#374151;line-height:${fs.line}">M: ${mobile}</td></tr>`,
      email   && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#374151;line-height:${fs.line}">E: <a href="mailto:${email}" style="color:${ac};text-decoration:none">${email}</a></td></tr>`,
      websiteClean && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#374151;line-height:${fs.line}">W: <a href="${websiteHref}" style="color:${ac};text-decoration:none">${websiteClean}</a></td></tr>`,
      address && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#374151;line-height:${fs.line}">${address}</td></tr>`,
    ].filter(Boolean).join("");

    const socialLinks = [
      linkedIn  && `<a href="${linkedIn}"  style="display:inline-block;margin-right:10px;font-size:${fs.base};color:${ac};text-decoration:none">LinkedIn</a>`,
      twitter   && `<a href="${twitter}"   style="display:inline-block;margin-right:10px;font-size:${fs.base};color:${ac};text-decoration:none">Twitter / X</a>`,
      instagram && `<a href="${instagram}" style="display:inline-block;margin-right:10px;font-size:${fs.base};color:${ac};text-decoration:none">Instagram</a>`,
    ].filter(Boolean).join("");

    const sep = dividerStyle === "pipe" ? " | " : " · ";

    const hrBlock = dividerStyle === "line"
      ? `<tr><td style="padding:8px 0 6px"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid ${ac};width:200px;height:0;font-size:0">&nbsp;</td></tr></table></td></tr>`
      : `<tr><td style="padding:6px 0"></td></tr>`;

    const socialRow = socialLinks
      ? `<tr><td style="padding-top:8px">${socialLinks}</td></tr>`
      : "";

    const innerBlock = (showLogo = true) => `
      ${showLogo ? logoImg : ""}
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="font-size:${fs.name};font-weight:700;color:#111827;padding-bottom:2px;line-height:1.3">${name || "이름"}</td></tr>
        <tr><td style="font-size:${fs.role};color:${ac};font-weight:600;padding-bottom:3px;line-height:1.4">${role || "직책"}</td></tr>
        ${deptCompany ? `<tr><td style="font-size:${fs.base};color:#6b7280;padding-bottom:8px;line-height:1.4">${deptCompany}</td></tr>` : ""}
        ${hrBlock}
        ${contactRows}
        ${socialRow}
      </table>`;

    const TEMPLATE_HTML: Record<string, string> = {
      simple: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td>${innerBlock()}</td></tr></table>`,

      professional: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td>
        ${logoImg}
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="font-size:${fs.name};font-weight:700;color:#111827;padding-bottom:2px">${name || "이름"}</td></tr>
          <tr><td style="font-size:${fs.role};color:${ac};font-weight:600;padding-bottom:3px">${role || "직책"}</td></tr>
          ${deptCompany ? `<tr><td style="font-size:${fs.base};color:#6b7280;padding-bottom:8px">${deptCompany}</td></tr>` : ""}
          <tr><td style="padding:6px 0 4px"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid ${ac};width:220px;height:0;font-size:0">&nbsp;</td></tr></table></td></tr>
          ${contactRows}
          ${socialRow}
        </table>
      </td></tr></table>`,

      modern: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr>
        <td style="background:${ac};width:4px;padding:0">&nbsp;</td>
        <td style="padding-left:16px">${innerBlock()}</td>
      </tr></table>`,

      card: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;border:1px solid #e5e7eb">
        <tr><td style="background:${ac};height:4px;font-size:0">&nbsp;</td></tr>
        <tr><td style="padding:16px 20px">${innerBlock()}</td></tr>
      </table>`,

      compact: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td style="font-size:${fs.base};color:#374151;line-height:1.8">
        <strong style="font-size:${fs.role};color:#111827">${name || "이름"}</strong>
        ${role ? `<span style="color:${ac}">${sep}${role}</span>` : ""}
        ${company ? `<span style="color:#6b7280">${sep}${company}</span>` : ""}
        ${phone ? `<span>${sep}${phone}</span>` : ""}
        ${email ? `<span>${sep}<a href="mailto:${email}" style="color:${ac};text-decoration:none">${email}</a></span>` : ""}
        ${websiteClean ? `<span>${sep}<a href="${websiteHref}" style="color:${ac};text-decoration:none">${websiteClean}</a></span>` : ""}
      </td></tr></table>`,

      topline: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;border-top:3px solid ${ac}">
        <tr><td style="padding:12px 0 0">${innerBlock()}</td></tr>
      </table>`,

      minimal: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="font-size:${fs.name};font-weight:700;color:#111827;padding-bottom:2px">${name || "이름"}</td></tr>
          ${role || company ? `<tr><td style="font-size:${fs.base};color:#6b7280;padding-bottom:8px">${[role, company].filter(Boolean).join(", ")}</td></tr>` : ""}
          ${email ? `<tr><td style="font-size:${fs.base}"><a href="mailto:${email}" style="color:${ac};text-decoration:none">${email}</a></td></tr>` : ""}
          ${phone ? `<tr><td style="font-size:${fs.base};color:#374151;padding-top:2px">${phone}</td></tr>` : ""}
          ${socialRow}
        </table>
      </td></tr></table>`,

      twocol: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr>
        ${logoUrl ? `<td style="padding-right:16px;vertical-align:top"><img src="${logoUrl}" alt="${name}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block" /></td><td style="border-left:1px solid #e5e7eb;padding-left:16px;vertical-align:top">` : "<td style=\"vertical-align:top\">"}
          <table cellpadding="0" cellspacing="0" border="0">
            <tr><td style="font-size:${fs.name};font-weight:700;color:#111827;padding-bottom:2px">${name || "이름"}</td></tr>
            <tr><td style="font-size:${fs.role};color:${ac};padding-bottom:3px">${role || "직책"}</td></tr>
            ${deptCompany ? `<tr><td style="font-size:${fs.base};color:#6b7280;padding-bottom:8px">${deptCompany}</td></tr>` : ""}
            ${contactRows}
            ${socialRow}
          </table>
        </td>
      </tr></table>`,

      dark: `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;background:#1f2937;border-radius:8px"><tr><td style="padding:16px 20px">
        ${logoImg}
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="font-size:${fs.name};font-weight:700;color:#f9fafb;padding-bottom:2px">${name || "이름"}</td></tr>
          <tr><td style="font-size:${fs.role};color:${ac};font-weight:600;padding-bottom:3px">${role || "직책"}</td></tr>
          ${deptCompany ? `<tr><td style="font-size:${fs.base};color:#9ca3af;padding-bottom:8px">${deptCompany}</td></tr>` : ""}
          <tr><td style="padding:6px 0 4px"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${ac};width:180px;height:0;font-size:0">&nbsp;</td></tr></table></td></tr>
          ${[
            phone   && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#d1d5db">T: ${phone}</td></tr>`,
            mobile  && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#d1d5db">M: ${mobile}</td></tr>`,
            email   && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#d1d5db">E: <a href="mailto:${email}" style="color:${ac};text-decoration:none">${email}</a></td></tr>`,
            websiteClean && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#d1d5db">W: <a href="${websiteHref}" style="color:${ac};text-decoration:none">${websiteClean}</a></td></tr>`,
            address && `<tr><td style="padding:1px 0;font-size:${fs.base};color:#d1d5db">${address}</td></tr>`,
          ].filter(Boolean).join("")}
          ${socialRow}
        </table>
      </td></tr></table>`,
    };

    const sigHtml = TEMPLATE_HTML[sigTemplate] ?? TEMPLATE_HTML.professional;

    const plainText = [
      name,
      role && company ? `${role} | ${company}` : (role || company),
      department,
      "",
      phone   && `T: ${phone}`,
      mobile  && `M: ${mobile}`,
      email   && `E: ${email}`,
      websiteClean && `W: ${websiteClean}`,
      address,
      linkedIn  && `LinkedIn: ${linkedIn}`,
      twitter   && `Twitter: ${twitter}`,
      instagram && `Instagram: ${instagram}`,
    ].filter(Boolean).join("\n");

    const PRESET_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];
    const TEMPLATES = [
      { id: "simple",       label: "심플",       desc: "깔끔하고 간단한 디자인" },
      { id: "professional", label: "프로페셔널", desc: "전문적인 비즈니스 스타일" },
      { id: "modern",       label: "모던",       desc: "사이드 컬러 바 스타일" },
      { id: "card",         label: "카드형",     desc: "상단 컬러 바 카드" },
      { id: "compact",      label: "컴팩트",     desc: "한 줄로 압축된 스타일" },
      { id: "topline",      label: "상단 라인",  desc: "컬러 상단 구분선" },
      { id: "minimal",      label: "미니멀",     desc: "극도로 간결한 스타일" },
      { id: "twocol",       label: "투컬럼",     desc: "프로필 + 정보 분리형" },
      { id: "dark",         label: "다크",       desc: "어두운 배경 스타일" },
    ];

    const showSigCopyStatus = (type: "success" | "error", message: string) => {
      setSigCopyStatus({ type, message });
      window.setTimeout(() => setSigCopyStatus(null), 2200);
    };

    const handleCopySignatureHtml = async () => {
      const copied = await copyHtml(sigHtml, plainText);
      if (copied) {
        setSigManualCopy(null);
        showSigCopyStatus("success", "HTML 서명을 복사했습니다.");
        return;
      }

      setSigManualCopy({ type: "html", label: "HTML", content: sigHtml.trim() });
      showSigCopyStatus("error", "브라우저가 HTML 자동 복사를 막았습니다. 아래 선택된 서명 영역을 Cmd+C / Ctrl+C로 복사해주세요.");
    };

    const handleCopySignatureText = async () => {
      const copied = await copyText(plainText);
      if (copied) {
        setSigManualCopy(null);
        showSigCopyStatus("success", "텍스트 서명을 복사했습니다.");
        return;
      }

      setSigManualCopy({ type: "text", label: "텍스트", content: plainText });
      showSigCopyStatus("error", "브라우저가 자동 복사를 막았습니다. 아래 선택된 내용을 Cmd+C / Ctrl+C로 복사해주세요.");
    };

    return (
      <section className="email-sig-workbench">
        <div className="email-sig-layout">
          <div className="email-sig-form-col">
            <div className="email-sig-section">
              <div className="email-sig-section-head">
                <strong>정보 입력</strong>
              </div>
              <div className="email-sig-tabs">
                {(["basic", "contact", "social"] as const).map((t, i) => (
                  <button key={t} type="button" className={`email-sig-tab ${sigInfoTab === t ? "is-active" : ""}`} onClick={() => setSigInfoTab(t)}>
                    {["기본", "연락처", "소셜"][i]}
                  </button>
                ))}
              </div>
              {sigInfoTab === "basic" && (
                <div className="form-grid tax-form-grid email-sig-form-grid">
                  <label className="field-block"><span>이름 *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" /></label>
                  <label className="field-block"><span>직책 *</span><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="프로덕트 디자이너" /></label>
                  <label className="field-block"><span>회사</span><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="테크 컴퍼니" /></label>
                  <label className="field-block"><span>부서</span><input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="브랜드팀" /></label>
                  <label className="field-block wide"><span>프로필/로고 URL</span><input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" /></label>
                </div>
              )}
              {sigInfoTab === "contact" && (
                <div className="form-grid tax-form-grid email-sig-form-grid">
                  <label className="field-block"><span>전화번호</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-1234-5678" /></label>
                  <label className="field-block"><span>휴대폰</span><input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="010-1234-5678" /></label>
                  <label className="field-block"><span>이메일</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hong@example.com" /></label>
                  <label className="field-block"><span>웹사이트</span><input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="example.com" /></label>
                  <label className="field-block wide"><span>주소</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="서울시 강남구 테헤란로 123" /></label>
                </div>
              )}
              {sigInfoTab === "social" && (
                <div className="form-grid tax-form-grid email-sig-form-grid">
                  <label className="field-block wide"><span>LinkedIn URL</span><input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/username" /></label>
                  <label className="field-block wide"><span>Twitter / X URL</span><input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username" /></label>
                  <label className="field-block wide"><span>Instagram URL</span><input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/username" /></label>
                </div>
              )}
            </div>

            <div className="email-sig-section email-sig-style-section">
              <div className="email-sig-section-head"><strong>스타일 설정</strong></div>
              <div className="email-sig-style-row">
                <label className="email-sig-style-label">컬러</label>
                <div className="email-sig-color-row">
                  <span className="email-sig-color-swatch" style={{ background: accentColor }} />
                  <input className="tool-input email-sig-color-input" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                </div>
                <div className="email-sig-presets">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" className={`email-sig-preset ${accentColor === c ? "is-active" : ""}`} style={{ background: c }} onClick={() => setAccentColor(c)} aria-label={c} />
                  ))}
                </div>
              </div>
              <div className="email-sig-style-row">
                <label className="email-sig-style-label">폰트 크기</label>
                <div className="email-sig-tabs">
                  {(["small", "medium", "large"] as const).map((s, i) => (
                    <button key={s} type="button" className={`email-sig-tab ${sigFontSize === s ? "is-active" : ""}`} onClick={() => setSigFontSize(s)}>
                      {["작게", "보통", "크게"][i]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="email-sig-style-row">
                <label className="email-sig-style-label">구분선</label>
                <div className="email-sig-tabs">
                  {(["line", "pipe", "none"] as const).map((s, i) => (
                    <button key={s} type="button" className={`email-sig-tab ${dividerStyle === s ? "is-active" : ""}`} onClick={() => setDividerStyle(s)}>
                      {["라인", "파이프", "없음"][i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="email-sig-preview-col">
            <div className="email-sig-tpl-section">
              <div className="email-sig-section-head"><strong>템플릿</strong></div>
              <div className="email-sig-template-grid">
                {TEMPLATES.map((t) => (
                  <button key={t.id} type="button" title={t.desc} className={`email-sig-template-card ${sigTemplate === t.id ? "is-active" : ""}`} onClick={() => setSigTemplate(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="email-sig-result-section">
              <div className="email-sig-section-head">
                <strong>미리보기</strong>
                <div className="email-sig-action-row">
                  <button type="button" className="primary-action email-sig-copy-button" onClick={() => void handleCopySignatureHtml()}>
                    <Copy size={14} /> HTML 복사
                  </button>
                  <button type="button" className="email-sig-copy-button" onClick={() => void handleCopySignatureText()}>
                    텍스트 복사
                  </button>
                </div>
              </div>
              {sigCopyStatus && (
                <p className={`email-sig-copy-status is-${sigCopyStatus.type}`}>{sigCopyStatus.message}</p>
              )}
              {sigManualCopy && (
                <div className="email-sig-manual-copy">
                  <span>{sigManualCopy.label} 직접 복사</span>
                  {sigManualCopy.type === "html" ? (
                    <div
                      ref={(node) => {
                        sigManualCopyRef.current = node;
                      }}
                      className="email-sig-manual-html"
                      tabIndex={0}
                      dangerouslySetInnerHTML={{ __html: sigManualCopy.content }}
                    />
                  ) : (
                    <textarea
                      ref={(node) => {
                        sigManualCopyRef.current = node;
                      }}
                      readOnly
                      value={sigManualCopy.content}
                    />
                  )}
                </div>
              )}
              <div className="email-sig-preview-box">
                <div dangerouslySetInnerHTML={{ __html: sigHtml }} />
              </div>
              <div className="email-sig-howto">
                <p><strong>Gmail</strong> 설정 &gt; 모든 설정 보기 &gt; 서명</p>
                <p><strong>Outlook</strong> 파일 &gt; 옵션 &gt; 메일 &gt; 서명</p>
                <p><strong>Apple Mail</strong> 설정 &gt; 서명 &gt; HTML 붙여넣기</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (toolId === "qr-code") {
    return <QrCodeTool />;
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
  if (sectionId === "images") return <ImageTools toolId={toolId} />;
  if (sectionId === "developer-tools") return <DeveloperTools toolId={toolId} />;
  if (sectionId === "real-estate") return <RealEstateTools toolId={toolId} />;
  if (sectionId === "business-calculators") return <BusinessCalculators toolId={toolId} />;
  return <BusinessDocuments toolId={toolId} toolName={toolName} />;
}

/* ── QR Code Tool ─────────────────────────────────────────── */
type QrType = "url" | "text" | "tel" | "email" | "wifi";

function QrColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <div className="qr-color-input">
        <span className="qr-color-swatch-btn" style={{ background: value }}>
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="qr-color-picker" />
        </span>
        <input className="tool-input" value={value} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: "monospace", fontSize: 13 }} />
      </div>
    </label>
  );
}

function QrCodeTool() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [inputVal, setInputVal] = useState("https://");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiSec, setWifiSec] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(2);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrValue = (() => {
    if (qrType === "wifi") return `WIFI:T:${wifiSec};S:${wifiSsid};P:${wifiPass};;`;
    if (qrType === "tel") return inputVal.startsWith("tel:") ? inputVal : `tel:${inputVal}`;
    if (qrType === "email") return inputVal.startsWith("mailto:") ? inputVal : `mailto:${inputVal}`;
    return inputVal;
  })();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    import("qrcode").then((QRCodeModule) => {
      const QRCode = ("default" in QRCodeModule ? QRCodeModule.default : QRCodeModule) as typeof QRCodeModule;
      QRCode.toCanvas(canvas, qrValue || " ", {
        width: size,
        margin,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: "M",
      }).then(() => {
        setDataUrl(canvas.toDataURL("image/png"));
      }).catch(() => setDataUrl(null));
    });
  }, [qrValue, size, margin, darkColor, lightColor]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  const TYPE_LABELS: Record<QrType, string> = {
    url: "URL",
    text: "텍스트",
    tel: "전화번호",
    email: "이메일",
    wifi: "Wi-Fi",
  };

  const placeholder: Record<QrType, string> = {
    url: "https://example.com",
    text: "전달할 텍스트를 입력하세요",
    tel: "010-1234-5678",
    email: "hello@example.com",
    wifi: "",
  };

  return (
    <section className="detail-card workbench-card">
      <div className="workbench-head">
        <strong>QR코드 생성기</strong>
        <span>URL, 텍스트, 연락처, Wi-Fi를 QR코드로 즉시 생성</span>
      </div>

      <div className="qr-layout">
        <div className="qr-form-col">
          <div className="field-block">
            <span>유형</span>
            <div className="qr-type-tabs">
              {(Object.keys(TYPE_LABELS) as QrType[]).map((t) => (
                <button key={t} type="button" className={`qr-type-tab ${qrType === t ? "is-active" : ""}`}
                  onClick={() => { setQrType(t); if (t === "url") setInputVal("https://"); else if (t !== "wifi") setInputVal(""); }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {qrType === "wifi" ? (
            <>
              <label className="field-block"><span>SSID (Wi-Fi 이름)</span>
                <input className="tool-input" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyNetwork" />
              </label>
              <label className="field-block"><span>비밀번호</span>
                <input className="tool-input" type="password" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} placeholder="password" />
              </label>
              <div className="field-block">
                <span>보안 방식</span>
                <div className="qr-type-tabs" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {(["WPA", "WEP", "nopass"] as const).map((s) => (
                    <button key={s} type="button" className={`qr-type-tab ${wifiSec === s ? "is-active" : ""}`} onClick={() => setWifiSec(s)}>
                      {s === "nopass" ? "없음" : s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <label className="field-block"><span>내용</span>
              <input className="tool-input" value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder={placeholder[qrType]} />
            </label>
          )}

          <div className="qr-divider" />

          <label className="field-block">
            <span>크기 ({size}px)</span>
            <input type="range" min={128} max={512} step={32} value={size} onChange={(e) => setSize(Number(e.target.value))} className="qr-range" />
          </label>
          <label className="field-block">
            <span>여백 ({margin})</span>
            <input type="range" min={0} max={6} step={1} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="qr-range" />
          </label>

          <div className="qr-color-row">
            <QrColorField label="QR 색상" value={darkColor} onChange={setDarkColor} />
            <QrColorField label="배경 색상" value={lightColor} onChange={setLightColor} />
          </div>
        </div>

        <div className="qr-preview-col">
          <div className="qr-preview-box">
            <canvas ref={canvasRef} width={size} height={size} className="qr-canvas" />
          </div>
          <div className="qr-btn-row">
            <button type="button" className="qr-btn-primary" onClick={download}>
              <Download size={16} /> PNG 다운로드
            </button>
            <button type="button" className="qr-btn-secondary" onClick={() => {
              if (!canvasRef.current) return;
              canvasRef.current.toBlob((blob) => {
                if (!blob) return;
                void navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              });
            }}>
              <Copy size={16} /> 이미지 복사
            </button>
          </div>
          <p className="qr-meta">오류 정정 레벨 M (약 15% 복구)</p>
        </div>
      </div>
    </section>
  );
}
