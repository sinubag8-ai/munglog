"use client";

// 👨‍👩‍👧 가족: 가족방 이름, 구성원 목록, 초대 코드 (Supabase)
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchFamily, type FamilyInfo } from "@/lib/family";

export default function FamilyPage() {
  const { membership } = useAuth();
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const familyId = membership?.familyId;

  const load = useCallback(() => {
    if (!familyId) return;
    setFailed(false);
    fetchFamily(familyId)
      .then(setFamily)
      .catch(() => setFailed(true));
  }, [familyId]);

  useEffect(load, [load]);

  async function copyCode() {
    if (!family) return;
    try {
      await navigator.clipboard.writeText(family.inviteCode);
    } catch {
      // 복사가 막힌 환경에서도 안내는 보여 줘요
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (failed) {
    return (
      <div className="card empty">
        <div className="empty-emoji">📡</div>
        <p>가족 정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>
        <button type="button" className="btn-primary" onClick={load}>
          다시 불러오기
        </button>
      </div>
    );
  }

  if (!family) {
    return <p className="page-sub loading">가족 정보를 불러오는 중이에요… 🐾</p>;
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
                {m.id === membership?.memberId && <span className="badge">나</span>}
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
        <p className="hint" style={{ marginTop: 12 }}>
          가족은 멍로그에 가입한 뒤 &lsquo;초대 코드로 참여하기&rsquo;에 입력하면 돼요
        </p>
      </div>
    </>
  );
}
