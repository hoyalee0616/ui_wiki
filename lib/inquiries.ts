import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export type InquiryType = "도구 제안" | "버그 신고" | "기타 의견";

export interface Inquiry {
  id: string;
  type: InquiryType;
  title: string;
  content: string;
  contact: string;
  createdAt: string;
  read: boolean;
}

// INQUIRIES_DATA_DIR 환경변수로 경로 지정 가능 (기본: {프로젝트}/data)
const DATA_DIR = process.env.INQUIRIES_DATA_DIR ?? join(process.cwd(), "data");
const FILE_PATH = join(DATA_DIR, "inquiries.json");

async function readAll(): Promise<Inquiry[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as Inquiry[];
  } catch {
    return [];
  }
}

async function writeAll(list: Inquiry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
}

export async function addInquiry(data: Omit<Inquiry, "id" | "createdAt" | "read">): Promise<Inquiry> {
  const list = await readAll();
  const entry: Inquiry = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  list.unshift(entry);
  await writeAll(list);
  return entry;
}

export async function getInquiries(): Promise<Inquiry[]> {
  return readAll();
}

export async function markRead(id: string): Promise<void> {
  const list = await readAll();
  const item = list.find((i) => i.id === id);
  if (item) {
    item.read = true;
    await writeAll(list);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  const list = await readAll();
  await writeAll(list.filter((i) => i.id !== id));
}
