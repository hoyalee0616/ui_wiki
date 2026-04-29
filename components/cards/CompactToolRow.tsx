import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type ToolItem } from "@/data/tools";

export function CompactToolRow({ tool }: { tool: ToolItem }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.slug} className="compact-tool-row">
      <span className={`mini-icon ${tool.accent}`}>
        <Icon size={16} />
      </span>
      <div className="compact-tool-copy">
        <strong>{tool.name}</strong>
        <small>{tool.summary}</small>
      </div>
      <ArrowUpRight size={16} className="compact-tool-arrow" />
    </Link>
  );
}
