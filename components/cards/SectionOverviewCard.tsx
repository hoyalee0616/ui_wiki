import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "@/components/cards/ToolCard";
import type { ToolItem, ToolSection } from "@/data/tools";

interface SectionOverviewCardProps {
  section: ToolSection;
  tools: ToolItem[];
}

export function SectionOverviewCard({ section, tools }: SectionOverviewCardProps) {
  const Icon = section.icon;

  return (
    <section className="section-overview-card">
      <div className="section-overview-head">
        <div>
          <span className={`tool-icon ${section.accent}`}>
            <Icon size={22} />
          </span>
          <h3>{section.label}</h3>
          <p>{section.description}</p>
        </div>
        <div className="section-overview-meta">
          <strong>{section.stats}</strong>
          <Link href={section.href}>
            자세히 보기
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="section-tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
