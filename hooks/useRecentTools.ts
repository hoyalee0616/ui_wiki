"use client";

import { useEffect, useState, useCallback } from "react";
import type { Accent } from "@/data/tools";

const STORAGE_KEY = "gomdol_recent_tools";
const MAX_RECENT = 12;

export interface RecentEntry {
  id: string;
  name: string;
  href: string;
  accent: Accent;
  visitedAt: number;
}

function getStored(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export function recordToolVisit(entry: Omit<RecentEntry, "visitedAt">) {
  try {
    let recent = getStored();
    recent = recent.filter((r) => r.id !== entry.id);
    recent.unshift({ ...entry, visitedAt: Date.now() });
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {}
}

export function clearRecentTools() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useRecentTools() {
  const [tools, setTools] = useState<RecentEntry[]>([]);

  const refresh = useCallback(() => {
    setTools(getStored());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const clear = useCallback(() => {
    clearRecentTools();
    setTools([]);
  }, []);

  return { tools, clear };
}
