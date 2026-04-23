import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import type { Accent } from "@/data/tools";

const accentClass: Record<Accent, string> = {
  blue: "blue",
  green: "green",
  purple: "purple",
  red: "red",
  orange: "orange",
  yellow: "yellow",
};

interface RecentToolItemProps {
  name: string;
  href: string;
  time: string;
  accent: Accent;
}

export function RecentToolItem({ name, href, time, accent }: RecentToolItemProps) {
  return (
    <Link className="recent-item" href={href}>
      <span className={`recent-badge ${accentClass[accent]}`}>
        <Clock3 size={16} />
      </span>
      <strong>{name}</strong>
      <small>{time}</small>
      <ChevronRight size={18} />
    </Link>
  );
}
