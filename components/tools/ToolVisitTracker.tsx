"use client";

import { useEffect } from "react";
import { recordToolVisit } from "@/hooks/useRecentTools";
import type { Accent } from "@/data/tools";

interface Props {
  id: string;
  name: string;
  href: string;
  accent: Accent;
}

export function ToolVisitTracker({ id, name, href, accent }: Props) {
  useEffect(() => {
    recordToolVisit({ id, name, href, accent });
  }, [id, name, href, accent]);

  return null;
}
