"use client";

// 🏠 오늘: 오늘 요약 + 시간 순 타임라인
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCare } from "@/lib/care-store";
import { CARE_LABELS, CARE_ORDER } from "@/lib/types";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TodayPage() {
  const { dog, family, records } = useCare();

  // 시간은 사용자 휴대폰 기준으로 보여 줘야 해서, 화면이 열린 뒤에 그려요.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const todayRecords = records
    .filter((r) => r.dogId === dog.id && isToday(r.createdAt))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // 최신이 위

  const nameOf = (memberId: string) =>
    family.members.find((m) => m.id === memberId)?.displayName ?? "가족";

  const now = new Date();
  const dateText = `${now.getMonth() + 1}월 ${now.getDate()}일`;

  return (
    <>
      <h1 className="page-title">
        {dateText} · {dog.name} 🐶
      </h1>
      <p className="page-sub">오늘 {dog.name}의 하루를 확인해 보세요.</p>

      <div className="summary">
        {CARE_ORDER.map((type) => (
          <div key={type} className="summary-item">
            <div className="summary-emoji">{CARE_LABELS[type].emoji}</div>
            <div className="summary-label">{CARE_LABELS[type].label}</div>
            <div className="summary-count">{todayRecords.filter((r) => r.type === type).length}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">오늘 타임라인</h2>

      {todayRecords.length === 0 ? (
        <div className="card empty">
          <div className="empty-emoji">🐾</div>
          <p>아직 오늘 기록이 없어요</p>
          <Link href="/record" className="btn-primary">
            기록하러 가기
          </Link>
        </div>
      ) : (
        <ul className="timeline">
          {todayRecords.map((r) => (
            <li key={r.id} className="card timeline-item">
              <span className="timeline-time">{formatTime(r.createdAt)}</span>
              <div>
                <div className="timeline-main">
                  {CARE_LABELS[r.type].emoji} {CARE_LABELS[r.type].label}{" "}
                  <span className="timeline-who">· {nameOf(r.memberId)}</span>
                </div>
                {r.memo && <div className="timeline-memo">“{r.memo}”</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
