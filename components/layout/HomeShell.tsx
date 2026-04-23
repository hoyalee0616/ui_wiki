"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { HeroMascot } from "@/components/brand/Logo";
import { CompactToolRow } from "@/components/cards/CompactToolRow";
import { SectionOverviewCard } from "@/components/cards/SectionOverviewCard";
import { SectionDirectoryCard } from "@/components/cards/SectionDirectoryCard";
import { SearchBar } from "@/components/common/SearchBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import { RecentToolItem } from "@/components/cards/RecentToolItem";
import { ToolCard } from "@/components/cards/ToolCard";
import { Footer } from "@/components/layout/Footer";
import { DocsFrame } from "@/components/layout/DocsFrame";
import { highlightedSections, popularTools, recentTools, sectionMap } from "@/data/tools";

export function HomeShell() {
  return (
    <DocsFrame>
      <div className="home-stack">
          <section className="hero-card">
            <div className="hero-copy">
              <h1>
                문서처럼 찾고
                <br />
                도구처럼 바로 실행하기
              </h1>
              <p>
                문서/콘텐츠, PDF 도구, 업무용 계산기, 업무 서류를
                <br />
                왼쪽 서비스 메뉴에서 바로 이동하고 브라우저에서 곧바로 실행해 보세요.
              </p>
              <div className="trust-badges">
                <span><ShieldCheck size={16} /> 프라이버시 보호</span>
                <span><Lock size={16} /> 로그인 불필요</span>
                <span><Sparkles size={16} /> 빠른 즉시 실행</span>
              </div>
            </div>
            <HeroMascot />
          </section>

          <div className="mobile-search">
            <Suspense fallback={<div className="search-shell search-shell-skeleton" />}>
              <SearchBar placeholder="도구 검색..." hint="⌘K" />
            </Suspense>
          </div>

          <section className="spotlight-grid">
            {highlightedSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.id} href={section.href} className="spotlight-card">
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

          <section className="content-section">
            <SectionTitle title="빠르게 많이 쓰는 도구" />
            <div className="tool-grid">
              {popularTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
            <Link href="/menu" className="wide-link">
              모든 도구 보기
              <ArrowRight size={18} />
            </Link>
          </section>

          <section className="content-section">
            <SectionTitle title="카테고리별 디렉토리" />
            <div className="section-directory-list">
              {highlightedSections.map((section) => (
                <SectionDirectoryCard key={section.id} section={section} tools={sectionMap[section.id]} />
              ))}
            </div>
          </section>

          <section className="content-section two-column-section">
            <div>
              <SectionTitle title="추천 워크플로우" />
              <div className="section-overview-list">
                {highlightedSections.map((section) => (
                  <SectionOverviewCard key={section.id} section={section} tools={section.tools} />
                ))}
              </div>
            </div>
            <div>
              <SectionTitle title="방금 많이 찾은 도구" />
              <div className="compact-tool-panel">
                {popularTools.slice(0, 8).map((tool) => (
                  <CompactToolRow key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          </section>

          <section className="content-section">
            <SectionTitle title="최근 사용한 도구" action="전체 삭제" />
            <div className="recent-list">
              {recentTools.map((tool) => (
                <RecentToolItem key={`${tool.name}-${tool.time}`} {...tool} />
              ))}
            </div>
          </section>

          <Footer />
      </div>
    </DocsFrame>
  );
}
