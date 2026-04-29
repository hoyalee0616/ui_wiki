"use client";

import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { useRecentTools, formatRelativeTime } from "@/hooks/useRecentTools";
import { SectionTitle } from "@/components/common/SectionTitle";

export function RecentToolsSection() {
  const { tools, clear } = useRecentTools();

  if (tools.length === 0) return null;

  return (
    <section className="content-section">
      <SectionTitle title="최근 사용한 도구" action="전체 삭제" onAction={clear} />
      <div className="recent-list">
        {tools.slice(0, 8).map((tool) => (
          <Link key={tool.id} className="recent-item" href={tool.href}>
            <span className={`recent-badge ${tool.accent}`}>
              <Clock3 size={16} />
            </span>
            <strong>{tool.name}</strong>
            <small>{formatRelativeTime(tool.visitedAt)}</small>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}
