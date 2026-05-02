"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Lightbulb, Bug, MessageSquare } from "lucide-react";
import type { InquiryType } from "@/lib/inquiries";

const TYPES: { value: InquiryType; label: string; icon: typeof Lightbulb; accent: string }[] = [
  { value: "도구 제안", label: "도구 제안", icon: Lightbulb, accent: "blue" },
  { value: "버그 신고", label: "버그 신고", icon: Bug, accent: "red" },
  { value: "기타 의견", label: "기타 의견", icon: MessageSquare, accent: "green" },
];

export function ContactForm() {
  const [type, setType] = useState<InquiryType>("도구 제안");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content, contact }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "오류가 발생했습니다.");
        setStatus("error");
      } else {
        setStatus("success");
        setTitle("");
        setContent("");
        setContact("");
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="detail-card info-card contact-success">
        <CheckCircle size={40} className="contact-success-icon" />
        <h2>문의가 접수되었습니다</h2>
        <p>소중한 의견 감사합니다. 연락처를 남겨주셨다면 검토 후 답변드리겠습니다.</p>
        <button type="button" className="contact-reset-btn" onClick={() => setStatus("idle")}>
          새 문의 작성
        </button>
      </div>
    );
  }

  return (
    <form className="detail-card info-card contact-form" onSubmit={handleSubmit}>
      <h2>문의 작성</h2>

      {/* 유형 선택 */}
      <div className="contact-field">
        <label className="contact-label">문의 유형</label>
        <div className="contact-type-row">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                className={`contact-type-btn ${t.accent} ${type === t.value ? "active" : ""}`}
                onClick={() => setType(t.value)}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 제목 */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-title">
          제목 <span className="contact-required">*</span>
        </label>
        <input
          id="contact-title"
          className="contact-input"
          type="text"
          placeholder="문의 제목을 입력해 주세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      {/* 내용 */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-content">
          내용 <span className="contact-required">*</span>
        </label>
        <textarea
          id="contact-content"
          className="contact-textarea"
          placeholder="자세한 내용을 입력해 주세요&#10;&#10;버그 신고의 경우: 어떤 도구에서 어떤 상황이었는지 알려주세요&#10;도구 제안의 경우: 어떤 기능이 필요한지 설명해 주세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          required
          rows={7}
        />
        <span className="contact-char-count">{content.length} / 5000</span>
      </div>

      {/* 연락처 */}
      <div className="contact-field">
        <label className="contact-label" htmlFor="contact-contact">
          연락처 <span className="contact-optional">(선택)</span>
        </label>
        <input
          id="contact-contact"
          className="contact-input"
          type="text"
          placeholder="이메일 또는 기타 연락처 (답변이 필요한 경우)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* 에러 */}
      {status === "error" && (
        <div className="contact-error-banner">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        className="contact-submit-btn"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <span className="contact-spinner" />
        ) : (
          <Send size={16} />
        )}
        {status === "loading" ? "전송 중..." : "문의 보내기"}
      </button>
    </form>
  );
}
