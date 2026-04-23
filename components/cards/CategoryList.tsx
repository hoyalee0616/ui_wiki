import Link from "next/link";
import { sectionMap, toolSections } from "@/data/tools";

export function CategoryList() {
  return (
    <div className="category-panel">
      {toolSections.map((section) => (
        <section key={section.id} className="category-group">
          <div className="category-group-head">
            <h3>{section.label}</h3>
            <small>{section.stats}</small>
          </div>
          <ul>
            {sectionMap[section.id].slice(0, 6).map((tool) => {
              const Icon = tool.icon;

              return (
                <li key={tool.id}>
                  <Link href={tool.slug}>
                    <span className={`mini-icon ${tool.accent}`}>
                      <Icon size={14} />
                    </span>
                    <span>{tool.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
