"use client";

// 👨‍👩‍👧 가족: 가족방 이름, 구성원 목록, 초대 코드
import { useState } from "react";
import { useCare } from "@/lib/care-store";

export default function FamilyPage() {
  const { family, me } = useCare();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(family.inviteCode);
    } catch {
      // 복사가 막힌 환경에서도 안내는 보여 줘요
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <h1 className="page-title">{family.name} 🏡</h1>
      <p className="page-sub">함께 돌보는 가족 {family.members.length}명이에요.</p>

      <div className="card">
        <ul className="member-list">
          {family.members.map((m) => (
            <li key={m.id} className="member">
              <span className="avatar" aria-hidden>
                🧑
              </span>
              <span>
                {m.displayName}
                {m.isOwner && <span className="badge">👑 방장</span>}
                {m.id === me.id && <span className="badge">나</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="section-title">가족 초대하기</h2>
      <div className="card">
        <p className="hint">아래 코드를 가족에게 보내 주세요</p>
        <div className="invite-code">{family.inviteCode}</div>
        <button type="button" className="btn-primary" onClick={copyCode}>
          {copied ? "코드가 복사됐어요 ✅" : "초대 코드 복사하기"}
        </button>
      </div>
    </>
  );
}
