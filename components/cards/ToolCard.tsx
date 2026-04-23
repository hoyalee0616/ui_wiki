import Link from "next/link";
import { getSectionById, type ToolItem } from "@/data/tools";

export function ToolCard({ tool }: { tool: ToolItem }) {
  const Icon = tool.icon;
  const section = getSectionById(tool.sectionId);

  return (
    <Link className="tool-card" href={tool.slug}>
      <span className={`tool-icon ${tool.accent}`}>
        <Icon size={24} />
      </span>
      <span className="tool-meta-row">
        <em>{section.label}</em>
        {tool.isNew ? <b>NEW</b> : null}
      </span>
      <strong>{tool.name}</strong>
      <small>{tool.summary}</small>
    </Link>
  );
}
