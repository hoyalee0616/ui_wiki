"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SearchBar } from "@/components/common/SearchBar";

interface HeaderProps {
  menuOpen?: boolean;
  onMenuClick?: () => void;
}

export function Header({ menuOpen = false, onMenuClick }: HeaderProps) {
  const menuButton = onMenuClick ? (
    <button
      type="button"
      className={`icon-button header-menu-button ${menuOpen ? "is-active" : ""}`}
      aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
      aria-expanded={menuOpen}
      onClick={onMenuClick}
    >
      <Menu size={22} />
    </button>
  ) : (
    <Link href="/menu" className="icon-button header-menu-button" aria-label="전체 메뉴">
      <Menu size={22} />
    </Link>
  );

  return (
    <header className="site-header">
      {menuButton}
      <Logo />
      <div className="header-search">
        <Suspense fallback={<div className="search-shell search-shell-skeleton" />}>
          <SearchBar placeholder="도구 검색..." hint="⌘K" />
        </Suspense>
      </div>
      <nav className="header-actions" aria-label="빠른 메뉴">
        <Link href="/menu">전체 도구</Link>
        <Link href="/menu#documents">문서/콘텐츠</Link>
        <Link href="/menu#business-calculators">업무 계산기</Link>
      </nav>
    </header>
  );
}
