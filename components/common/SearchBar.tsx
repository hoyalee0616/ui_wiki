"use client";

import { type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  hint?: string;
}

export function SearchBar({
  placeholder = "찾고 싶은 도구를 검색해 보세요",
  hint,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "");

    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/menu");
      return;
    }

    if (pathname === "/menu") {
      router.push(`/menu?q=${encodeURIComponent(trimmed)}`);
      return;
    }

    router.push(`/menu?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form className="search-shell" aria-label="도구 검색" onSubmit={onSubmit}>
      <input
        key={`${pathname}:${currentQuery}`}
        name="q"
        type="search"
        placeholder={placeholder}
        defaultValue={currentQuery}
      />
      {hint ? <span className="search-hint">{hint}</span> : null}
      <button type="submit" className="search-submit" aria-label="검색">
        <Search size={20} />
      </button>
    </form>
  );
}
