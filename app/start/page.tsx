"use client";

// 가족방 시작: 새로 만들기(첫 설정) 또는 초대 코드로 참여하기
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { familyErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

type View = "choose" | "create" | "join";

export default function StartPage() {
  const { refresh, signOut, user } = useAuth();
  const [view, setView] = useState<View>("choose");
  const [familyName, setFamilyName] = useState("");
  const [dogName, setDogName] = useState("");
  const [myName, setMyName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function go(next: View) {
    setView(next);
    setError("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("create_family", {
      family_name: familyName.trim(),
      dog_name: dogName.trim(),
      my_name: myName.trim(),
    });
    setBusy(false);
    if (error) return setError(familyErrorMessage(error));
    await refresh(); // 오늘 화면으로 가요
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    if (code.trim().length !== 6) return setError("초대 코드 6자리를 입력해 주세요.");
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("join_family", { code: code.trim(), my_name: myName.trim() });
    setBusy(false);
    if (error) return setError(familyErrorMessage(error));
    await refresh();
  }

  const errorBox = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  );

  const myNameField = (
    <label className="field">
      <span className="field-label">내 표시 이름 (타임라인에 보여요)</span>
      <input
        className="input"
        required
        maxLength={10}
        value={myName}
        onChange={(e) => setMyName(e.target.value)}
        placeholder="예: 엄마, 막내"
      />
    </label>
  );

  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="auth-logo">🏡</div>
        <h1 className="auth-title">가족방 시작하기</h1>
        <p className="page-sub">가족과 함께 강아지를 돌봐요</p>
      </div>

      {view === "choose" && (
        <div className="choices">
          <button type="button" className="choice" onClick={() => go("create")}>
            <span className="choice-emoji">✨</span>
            <span>
              <strong>새 가족방 만들기</strong>
              <span className="choice-sub">처음 시작하는 가족이에요</span>
            </span>
          </button>
          <button type="button" className="choice" onClick={() => go("join")}>
            <span className="choice-emoji">🔑</span>
            <span>
              <strong>초대 코드로 참여하기</strong>
              <span className="choice-sub">가족에게 6자리 코드를 받았어요</span>
            </span>
          </button>
        </div>
      )}

      {view === "create" && (
        <form className="card auth-form" onSubmit={handleCreate}>
          <h2 className="auth-form-title">우리 가족방 정보를 알려 주세요</h2>
          <label className="field">
            <span className="field-label">가족방 이름</span>
            <input
              className="input"
              required
              maxLength={20}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="예: 땅콩이네"
            />
          </label>
          <label className="field">
            <span className="field-label">강아지 이름</span>
            <input
              className="input"
              required
              maxLength={20}
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="예: 땅콩이"
            />
          </label>
          {myNameField}
          {errorBox}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "만드는 중이에요…" : "가족방 만들기"}
          </button>
          <button type="button" className="link-button" onClick={() => go("choose")}>
            ← 뒤로
          </button>
        </form>
      )}

      {view === "join" && (
        <form className="card auth-form" onSubmit={handleJoin}>
          <h2 className="auth-form-title">받은 초대 코드를 입력해 주세요</h2>
          <label className="field">
            <span className="field-label">초대 코드 6자리</span>
            <input
              className="input code-input"
              required
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="A3K9P2"
            />
          </label>
          {myNameField}
          {errorBox}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "참여하는 중이에요…" : "참여하기"}
          </button>
          <button type="button" className="link-button" onClick={() => go("choose")}>
            ← 뒤로
          </button>
        </form>
      )}

      <button type="button" className="link-button" onClick={signOut}>
        {user?.email} 계정에서 로그아웃
      </button>
    </div>
  );
}
