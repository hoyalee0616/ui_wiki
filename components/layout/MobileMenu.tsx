"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { sectionMap, toolSections } from "@/data/tools";

export function MobileMenu({ onClose }: { onClose?: () => void }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(toolSections.map((section) => [section.id, true])),
  );

  return (
    <aside className="mobile-menu-card">
      <div className="mobile-menu-header">
        <div>
          <h2>서비스 메뉴</h2>
          <small>모든 도구를 카테고리별로 바로 이동할 수 있어요.</small>
        </div>
        <button type="button" className="icon-button" aria-label="메뉴 닫기" onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      {toolSections.map((section) => {
        const isOpen = openSections[section.id];

        return (
          <section key={section.id} className="mobile-category">
            <button
              type="button"
              className="mobile-category-title"
              onClick={() =>
                setOpenSections((prev) => ({
                  ...prev,
                  [section.id]: !prev[section.id],
                }))
              }
              aria-expanded={isOpen}
            >
              <div>
                <h3>{section.label}</h3>
                <small>{section.description}</small>
              </div>
              <ChevronDown size={18} className={isOpen ? "is-open" : ""} />
            </button>
            {isOpen ? (
              <div className="mobile-category-list">
                {sectionMap[section.id].map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link key={tool.id} href={tool.slug} onClick={onClose}>
                      <span className={`mini-icon ${tool.accent}`}>
                        <Icon size={16} />
                      </span>
                      <span>{tool.name}</span>
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
