"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { sectionMap, toolSections } from "@/data/tools";

export function MobileMenu({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const currentToolId = pathname.startsWith("/tools/") ? pathname.split("/").pop() : null;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(toolSections.map((section) => [section.id, true])),
  );

  return (
    <aside className="mobile-menu-card">
      <div className="mobile-menu-header">
        <div>
          <h2>서비스 메뉴</h2>
        </div>
        <button type="button" className="icon-button" aria-label="메뉴 닫기" onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      {toolSections.map((section) => {
        const isOpen = openSections[section.id];
        const isSectionActive = sectionMap[section.id].some((tool) => tool.id === currentToolId);

        return (
          <section key={section.id} className="mobile-category">
            <button
              type="button"
              className={`mobile-category-title ${isSectionActive ? "active" : ""}`}
              onClick={() =>
                setOpenSections((prev) => ({
                  ...prev,
                  [section.id]: !prev[section.id],
                }))
              }
              aria-expanded={isOpen}
            >
              <span className="mobile-category-label">{section.label}</span>
              <ChevronDown size={15} className={isOpen ? "is-open" : ""} />
            </button>
            {isOpen ? (
              <div className="mobile-tool-list">
                {sectionMap[section.id].map((tool) => {
                  const Icon = tool.icon;
                  const isActive = currentToolId === tool.id;

                  return (
                    <Link
                      key={tool.id}
                      href={tool.slug}
                      className={`mobile-tool-list-item ${tool.accent} ${isActive ? "active" : ""}`}
                      onClick={onClose}
                    >
                      <span className="mobile-tool-list-icon">
                        <Icon size={18} />
                      </span>
                      <span className="mobile-tool-list-name">{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </aside>
  );
}
