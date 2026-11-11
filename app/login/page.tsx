"use client";

// 로그인 / 가입 화면 (이메일 + 비밀번호)
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상으로 해 주세요.");
      return;
    }

    setBusy(true);
    const { data, error } = isSignup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);

    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    if (isSignup && !data.session) {
      setError("메일함에서 인증 링크를 눌러 주세요.");
      return;
    }
    await refresh(); // 가족방이 있으면 오늘 화면, 없으면 가족방 시작 화면으로 가요
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError("");
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="auth-logo">🐾</div>
        <h1 className="auth-title">멍로그</h1>
        <p className="page-sub">가족이 함께 남기는 강아지 돌봄 기록</p>
      </div>

      <form className="card auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-title">{isSignup ? "처음 오셨군요! 가입해 주세요" : "다시 오셨군요! 로그인해 주세요"}</h2>

        <label className="field">
          <span className="field-label">이메일</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mung@example.com"
          />
        </label>

        <label className="field">
          <span className="field-label">비밀번호 {isSignup && "(6자 이상)"}</span>
          <input
            className="input"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "잠시만요…" : isSignup ? "가입하기" : "로그인"}
        </button>
      </form>

      <button type="button" className="link-button" onClick={switchMode}>
        {isSignup ? "이미 계정이 있어요 → 로그인" : "처음이에요 → 가입하기"}
      </button>
    </div>
  );
}
