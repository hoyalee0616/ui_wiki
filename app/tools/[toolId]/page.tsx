import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToolCard } from "@/components/cards/ToolCard";
import { Footer } from "@/components/layout/Footer";
import { DocsFrame } from "@/components/layout/DocsFrame";
import { ToolWorkbench } from "@/components/tools/ToolWorkbench";
import { ToolVisitTracker } from "@/components/tools/ToolVisitTracker";
import { getRelatedTools, getSectionById, getToolById, tools } from "@/data/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({ toolId: tool.id }));
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const tool = getToolById(toolId);

  if (!tool) {
    notFound();
  }

  const section = getSectionById(tool.sectionId);
  const relatedTools = getRelatedTools(tool.id);
  const Icon = tool.icon;

  return (
    <DocsFrame contentClassName="tool-page-content">
      <ToolVisitTracker id={tool.id} name={tool.name} href={tool.slug} accent={tool.accent} />
      <div className="detail-page tool-detail-page">
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "전체 메뉴", href: "/menu" },
            { label: section.label, href: `/menu#${section.id}` },
            { label: tool.name },
          ]}
        />

        <div className="tool-detail-grid">
          <div className="tool-detail-main">
            <section className="detail-card tool-workbench-shell">
              <div className="tool-detail-copy tool-detail-copy-embedded">
                <span className={`tool-detail-badge ${tool.accent}`}>
                  <Icon size={18} />
                  {section.label}
                </span>
                <h1>{tool.name}</h1>
                <p>{tool.description}</p>
              </div>
              <ToolWorkbench toolId={tool.id} sectionId={tool.sectionId} toolName={tool.name} />
            </section>
          </div>
        </div>

        <section className="content-section">
          <div className="tool-section-head">
            <h2>같이 보기 좋은 도구</h2>
          </div>
          <div className="tool-grid">
            {relatedTools.map((item) => (
              <ToolCard key={item.id} tool={item} />
            ))}
          </div>
        </section>

        <div className="tool-detail-bottom-action">
          <Link href="/menu" className="primary-action">
            전체 도구 보기
            <ArrowRight size={16} />
          </Link>
        </div>
        <Footer />
      </div>
    </DocsFrame>
  );
}
