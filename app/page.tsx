"use client";

// 🏠 오늘: 오늘 요약 + 시간 순 타임라인 (Supabase에서 읽어 와요)
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCare } from "@/lib/care-store";
import { fetchToday, type TimelineItem, type TodayResult } from "@/lib/today";
import { CARE_LABELS, CARE_ORDER } from "@/lib/types";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TodayPage() {
  const { family, records: localRecords } = useCare();
  const [result, setResult] = useState<TodayResult | null>(null); // null = 불러오는 중

  useEffect(() => {
    fetchToday()
      .then(setResult)
      .catch(() => setResult({ ok: false, reason: "error" }));
  }, []);

  if (!result) {
    return <p className="page-sub loading">기록을 불러오는 중이에요… 🐾</p>;
  }

  if (!result.ok) {
    return (
      <div className="card empty">
        <div className="empty-emoji">{result.reason === "no-keys" ? "🔑" : "📡"}</div>
        <p>
          {result.reason === "no-keys"
            ? "Supabase 키를 아직 넣지 않았어요. .env.local 파일을 확인해 주세요."
            : "기록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요."}
        </p>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="card empty">
        <div className="empty-emoji">🐶</div>
        <p>아직 등록된 강아지가 없어요</p>
      </div>
    );
  }

  const { dogName, items: savedItems } = result.data;

  // 이번에 새로 남긴 기록(아직 Supabase에 저장 전)도 함께 보여 줘요
  const nameOf = (memberId: string) =>
    family.members.find((m) => m.id === memberId)?.displayName ?? "가족";
  const localItems: TimelineItem[] = localRecords
    .filter((r) => isToday(r.createdAt))
    .map((r) => ({ id: r.id, type: r.type, createdAt: r.createdAt, memo: r.memo, who: nameOf(r.memberId) }));

  const todayItems = [...savedItems, ...localItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ); // 최신이 위

  const now = new Date();
  const dateText = `${now.getMonth() + 1}월 ${now.getDate()}일`;

  return (
    <>
      <h1 className="page-title">
        {dateText} · {dogName} 🐶
      </h1>
      <p className="page-sub">오늘 {dogName}의 하루를 확인해 보세요.</p>

      <div className="summary">
        {CARE_ORDER.map((type) => (
          <div key={type} className="summary-item">
            <div className="summary-emoji">{CARE_LABELS[type].emoji}</div>
            <div className="summary-label">{CARE_LABELS[type].label}</div>
            <div className="summary-count">{todayItems.filter((r) => r.type === type).length}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">오늘 타임라인</h2>

      {todayItems.length === 0 ? (
        <div className="card empty">
          <div className="empty-emoji">🐾</div>
          <p>아직 오늘 기록이 없어요</p>
          <Link href="/record" className="btn-primary">
            기록하러 가기
          </Link>
        </div>
      ) : (
        <ul className="timeline">
          {todayItems.map((r) => (
            <li key={r.id} className="card timeline-item">
              <span className="timeline-time">{formatTime(r.createdAt)}</span>
              <div>
                <div className="timeline-main">
                  {CARE_LABELS[r.type].emoji} {CARE_LABELS[r.type].label}{" "}
                  <span className="timeline-who">· {r.who}</span>
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
