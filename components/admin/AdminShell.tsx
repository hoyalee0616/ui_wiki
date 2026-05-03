"use client";

import { useState } from "react";
import { LogOut, Trash2, Eye, EyeOff, Lightbulb, Bug, MessageSquare, Inbox, ChevronLeft } from "lucide-react";
import type { Inquiry } from "@/lib/inquiries";

const TYPE_ICON = {
  "도구 제안": Lightbulb,
  "버그 신고": Bug,
  "기타 의견": MessageSquare,
};

const TYPE_ACCENT = {
  "도구 제안": "blue",
  "버그 신고": "red",
  "기타 의견": "green",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AdminShell({ inquiries: initial }: { inquiries: Inquiry[] }) {
  const [list, setList] = useState<Inquiry[]>(initial);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState<string>("전체");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function handleRead(id: string) {
    await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setList((prev) => prev.map((i) => i.id === id ? { ...i, read: true } : i));
  }

  async function handleDelete(id: string) {
    if (!confirm("이 문의를 삭제할까요?")) return;
    await fetch("/api/admin/inquiries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setList((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openItem(item: Inquiry) {
    setSelected(item);
    setMobileView("detail");
    if (!item.read) handleRead(item.id);
  }

  const FILTERS = ["전체", "도구 제안", "버그 신고", "기타 의견", "읽지 않음"];
  const filtered = list.filter((i) => {
    if (filter === "전체") return true;
    if (filter === "읽지 않음") return !i.read;
    return i.type === filter;
  });
  const unreadCount = list.filter((i) => !i.read).length;

  return (
    <div className="admin-shell">
      {/* 헤더 */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>문의 관리</h1>
          {unreadCount > 0 && (
            <span className="admin-unread-badge">{unreadCount} 미읽음</span>
          )}
        </div>
        <button type="button" className="admin-logout-btn" onClick={logout}>
          <LogOut size={16} />
          로그아웃
        </button>
      </header>

      <div className="admin-body">
        {/* 사이드 리스트 */}
        <aside className={`admin-list-panel ${mobileView === "detail" ? "admin-mobile-hidden" : ""}`}>
          {/* 필터 */}
          <div className="admin-filter-row">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="admin-empty">
              <Inbox size={32} />
              <p>문의가 없습니다</p>
            </div>
          ) : (
            <ul className="admin-inquiry-list">
              {filtered.map((item) => {
                const Icon = TYPE_ICON[item.type] ?? MessageSquare;
                const accent = TYPE_ACCENT[item.type] ?? "blue";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`admin-inquiry-item ${selected?.id === item.id ? "active" : ""} ${!item.read ? "unread" : ""}`}
                      onClick={() => openItem(item)}
                    >
                      <span className={`admin-type-icon ${accent}`}>
                        <Icon size={15} />
                      </span>
                      <div className="admin-item-info">
                        <strong>{item.title}</strong>
                        <small>{item.type} · {formatDate(item.createdAt)}</small>
                      </div>
                      {!item.read && <span className="admin-unread-dot" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* 상세 */}
        <main className={`admin-detail-panel ${mobileView === "list" ? "admin-mobile-hidden" : ""}`}>
          {selected ? (
            <div className="admin-detail">
              <div className="admin-detail-head">
                <div>
                  <button
                    type="button"
                    className="admin-back-btn"
                    onClick={() => setMobileView("list")}
                  >
                    <ChevronLeft size={16} />
                    목록으로
                  </button>
                  <span className={`admin-detail-type ${TYPE_ACCENT[selected.type] ?? "blue"}`}>
                    {selected.type}
                  </span>
                  <h2>{selected.title}</h2>
                  <p className="admin-detail-meta">
                    {formatDate(selected.createdAt)}
                    {selected.contact && (
                      <> · <a href={`mailto:${selected.contact}`}>{selected.contact}</a></>
                    )}
                    {" · "}
                    <span className={selected.read ? "admin-status-read" : "admin-status-unread"}>
                      {selected.read ? (
                        <><Eye size={13} /> 읽음</>
                      ) : (
                        <><EyeOff size={13} /> 미읽음</>
                      )}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-delete-btn"
                  onClick={() => handleDelete(selected.id)}
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
              <div className="admin-detail-body">
                {selected.content.split("\n").map((line, i) => (
                  <p key={i}>{line || <br />}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-detail-empty">
              <Inbox size={40} />
              <p>왼쪽에서 문의를 선택하세요</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
