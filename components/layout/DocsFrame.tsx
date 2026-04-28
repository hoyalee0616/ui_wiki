"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Sidebar } from "@/components/layout/Sidebar";

export function DocsFrame({
  children,
  contentClassName = "",
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y < 10) {
        setCompact(false);
      } else if (y > lastScrollY.current + 4) {
        setCompact(true);
      } else if (y < lastScrollY.current - 4) {
        setCompact(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app-shell">
      <Header menuOpen={mobileMenuOpen} onMenuClick={() => setMobileMenuOpen((prev) => !prev)} scrolled={scrolled} compact={compact} />
      <div className="main-layout docs-layout">
        <Sidebar />
        <main className={`content-area docs-content ${contentClassName}`.trim()}>{children}</main>
      </div>

      {mobileMenuOpen ? (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true">
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label="메뉴 닫기"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-menu-drawer">
            <MobileMenu onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
