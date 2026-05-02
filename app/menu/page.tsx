import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CompactToolRow } from "@/components/cards/CompactToolRow";
import { SearchBar } from "@/components/common/SearchBar";
import { SectionDirectoryCard } from "@/components/cards/SectionDirectoryCard";
import { DocsFrame } from "@/components/layout/DocsFrame";
import { sectionMap, toolSections } from "@/data/tools";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const filteredSections = toolSections
    .map((section) => {
      const matchedTools = sectionMap[section.id].filter((tool) => {
        const haystack = [tool.name, tool.summary, tool.description, ...tool.features, ...tool.useCases]
          .join(" ")
          .toLowerCase();
        return !query || haystack.includes(query);
      });

      return { section, tools: matchedTools };
    })
    .filter(({ tools }) => tools.length > 0 || !query);

  const matchedCount = filteredSections.reduce((sum, current) => sum + current.tools.length, 0);

  return (
    <DocsFrame contentClassName="menu-page-content">
      <div className="detail-page menu-page">
        <section className="menu-hero">
          <div>
            <h1>업무용 유틸리티 디렉토리</h1>
            <p>왼쪽 서비스 메뉴와 검색으로 원하는 유틸리티를 빠르게 찾고, 바로 실행할 수 있게 정리했습니다.</p>
          </div>
          <div className="menu-search">
            <Suspense fallback={<div className="search-shell search-shell-skeleton" />}>
              <SearchBar placeholder="도구 검색..." hint="⌘K" />
            </Suspense>
          </div>
        </section>

        {query ? (
          <section className="detail-card search-result-card">
            <strong>&quot;{q}&quot; 검색 결과</strong>
            <p>{matchedCount}개의 도구가 검색되었습니다.</p>
          </section>
        ) : null}

        {!query ? (
          <section className="menu-summary-grid">
            {toolSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.id} href={`#${section.id}`} className="menu-summary-card">
                  <span className={`tool-icon ${section.accent}`}>
                    <Icon size={22} />
                  </span>
                  <strong>{section.label}</strong>
                  <p>{section.description}</p>
                  <small>{section.stats}</small>
                </Link>
              );
            })}
          </section>
        ) : null}

        <div className="menu-sections">
          {filteredSections.map(({ section, tools }) => (
            <section key={section.id} className="menu-category-card" id={section.id}>
              <div className="menu-category-head">
                <div>
                  <h2>{section.label}</h2>
                  <p>{section.description}</p>
                </div>
                <Link href={tools[0]?.slug ?? section.href}>첫 도구 열기</Link>
              </div>
              {query ? (
                <div className="search-result-list">
                  {tools.map((tool) => (
                    <CompactToolRow key={tool.id} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="menu-section-grid">
                  <SectionDirectoryCard section={section} tools={tools} />
                </div>
              )}
            </section>
          ))}
        </div>

        {query && matchedCount === 0 ? (
          <section className="detail-card search-empty-card">
            <strong>검색 결과가 없습니다.</strong>
            <p>도구 이름, 기능, 사용 상황 키워드로 다시 검색해 보세요.</p>
          </section>
        ) : null}

        <Link href="/" className="wide-link">
          홈으로 돌아가기
          <ArrowRight size={18} />
        </Link>
      </div>
    </DocsFrame>
  );
}
