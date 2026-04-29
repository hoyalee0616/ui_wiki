import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolItem, ToolSection } from "@/data/tools";

interface SectionDirectoryCardProps {
  section: ToolSection;
  tools: ToolItem[];
}

export function SectionDirectoryCard({ section, tools }: SectionDirectoryCardProps) {
  const Icon = section.icon;

  return (
    <section className="section-directory-card" id={section.id}>
      <div className="section-directory-head">
        <div className="section-directory-title">
          <span className={`tool-icon ${section.accent}`}>
            <Icon size={20} />
          </span>
          <div>
            <h3>{section.label}</h3>
            <p>{section.description}</p>
          </div>
        </div>
        <Link href={section.href}>
          전체 보기
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="section-tool-square-grid">
        {tools.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <Link key={tool.id} href={tool.slug} className={`mobile-tool-square ${tool.accent}`}>
              <span className="mobile-tool-icon">
                <ToolIcon size={20} />
              </span>
              <span className="mobile-tool-name">{tool.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
