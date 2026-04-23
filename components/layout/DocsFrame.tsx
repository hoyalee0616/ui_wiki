"use client";

import { type ReactNode, useEffect, useState } from "react";
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

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="app-shell">
      <Header menuOpen={mobileMenuOpen} onMenuClick={() => setMobileMenuOpen((prev) => !prev)} />
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
