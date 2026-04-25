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
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

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
          const isSectionActive = sectionMap[section.id].some((tool) => tool.id === currentToolId);

          return (
            <section key={section.id} className="sidebar-block">
              <Link href={section.href} className={`sidebar-section-link ${isSectionActive ? "active" : ""}`}>
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
                  const ToolIcon = tool.icon;

                  return (
                    <Link key={tool.id} href={tool.slug} className={`sidebar-tool-link ${isActive ? "active" : ""}`}>
                      <span className={`sidebar-tool-mini ${tool.accent}`}>
                        <ToolIcon size={14} />
                      </span>
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
