"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      const json = await res.json();
      setErrMsg(json.error ?? "로그인 실패");
      setStatus("error");
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-icon">
          <Lock size={28} />
        </div>
        <h1>관리자 로그인</h1>
        <p>Gomdol Tool 관리자 전용 페이지입니다.</p>

        <div className="admin-login-field">
          <div className="admin-password-wrap">
            <input
              type={show ? "text" : "password"}
              className="admin-login-input"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              className="admin-eye-btn"
              onClick={() => setShow((v) => !v)}
              tabIndex={-1}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {status === "error" && (
          <div className="admin-login-error">
            <AlertCircle size={15} />
            {errMsg}
          </div>
        )}

        <button
          type="submit"
          className="admin-login-btn"
          disabled={status === "loading"}
        >
          {status === "loading" ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
