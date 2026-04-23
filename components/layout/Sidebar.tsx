"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { primaryMenu, sectionMap, toolSections } from "@/data/tools";

export function Sidebar() {
  const pathname = usePathname();
  const currentToolId = pathname.startsWith("/tools/") ? pathname.split("/").pop() : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-block">
          <p className="sidebar-eyebrow">Service Menu</p>
          <nav aria-label="주요 메뉴" className="sidebar-primary-nav">
            {primaryMenu.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith("/menu") || pathname.startsWith("/tools/");

              return (
                <Link key={item.label} href={item.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {toolSections.map((section) => {
          const Icon = section.icon;

          return (
            <section key={section.id} className="sidebar-block">
              <Link href={section.href} className="sidebar-section-link">
                <span className={`mini-icon ${section.accent}`}>
                  <Icon size={15} />
                </span>
                <div>
                  <strong>{section.label}</strong>
                  <small>{section.stats}</small>
                </div>
              </Link>
              <div className="sidebar-tool-list">
                {sectionMap[section.id].map((tool) => {
                  const isActive = currentToolId === tool.id;

                  return (
                    <Link key={tool.id} href={tool.slug} className={`sidebar-tool-link ${isActive ? "active" : ""}`}>
                      <span>{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <Link href="/menu" className="sidebar-all-tools">
          <LayoutGrid size={16} />
          <span>전체 서비스 보기</span>
        </Link>
      </div>
    </aside>
  );
}
