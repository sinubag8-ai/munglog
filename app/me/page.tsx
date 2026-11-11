"use client";

// 👤 내 정보: 표시 이름, 강아지 프로필, 로그아웃
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCare } from "@/lib/care-store";

export default function MePage() {
  const { me, dog, updateMyName } = useCare();
  const { signOut } = useAuth();
  const [name, setName] = useState(me.displayName);
  const [saved, setSaved] = useState(false);

  const trimmed = name.trim();
  const changed = trimmed.length > 0 && trimmed !== me.displayName;

  function handleSave() {
    if (!changed) return;
    updateMyName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <>
      <h1 className="page-title">내 정보 👤</h1>
      <p className="page-sub">가족에게 보이는 내 이름을 정해 주세요.</p>

      <div className="card">
        <p className="field-label">내 표시 이름 (타임라인에 “· {me.displayName}”으로 보여요)</p>
        <div className="row">
          <input
            className="text-input"
            value={name}
            maxLength={10}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 엄마, 막내"
          />
          <button type="button" className="btn-outline" onClick={handleSave} disabled={!changed}>
            {saved ? "저장됐어요" : "저장"}
          </button>
        </div>
      </div>

      <h2 className="section-title">강아지 프로필</h2>
      <div className="card dog-profile">
        <div className="dog-photo" aria-hidden>
          🐶
        </div>
        <div>
          <div className="dog-name">{dog.name}</div>
          <div className="dog-info">{dog.breed}</div>
          <div className="dog-info">생일 {dog.birthday.replaceAll("-", ".")}</div>
        </div>
      </div>

      <button type="button" className="logout" onClick={signOut}>
        로그아웃
      </button>
    </>
  );
}
