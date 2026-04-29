import Link from "next/link";
import { type ToolItem } from "@/data/tools";

export function ToolCard({ tool }: { tool: ToolItem }) {
  const Icon = tool.icon;

  return (
    <Link className="tool-card" href={tool.slug}>
      <span className={`tool-icon ${tool.accent}`}>
        <Icon size={24} />
      </span>
      {tool.isNew ? <span className="tool-meta-row"><b>NEW</b></span> : null}
      <strong>{tool.name}</strong>
      <small>{tool.summary}</small>
    </Link>
  );
}
