"use client";

// 🏠 오늘: 오늘 요약 + 시간 순 타임라인 (Supabase에서 읽어 와요)
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { deleteRecord } from "@/lib/records";
import { fetchToday, type TodayResult } from "@/lib/today";
import { CARE_LABELS, CARE_ORDER } from "@/lib/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function TodayPage() {
  const { membership } = useAuth();
  const [result, setResult] = useState<TodayResult | null>(null); // null = 불러오는 중
  const [toast, setToast] = useState<string | null>(null);

  const familyId = membership?.familyId;

  const load = useCallback(() => {
    if (!familyId) return;
    fetchToday(familyId)
      .then(setResult)
      .catch(() => setResult({ ok: false, reason: "error" }));
  }, [familyId]);

  useEffect(() => {
    load();
    // 앱을 다시 열면(다른 앱에 갔다 돌아오면) 가족이 남긴 최신 기록을 다시 불러와요
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }

  async function handleDelete(recordId: string, label: string) {
    if (!result?.ok || !result.data) return;
    if (!window.confirm(`이 ${label} 기록을 지울까요?`)) return;

    // 화면에서 먼저 지우고(숫자 바로 줄어듦), 실패하면 되돌려요
    const before = result;
    setResult({ ok: true, data: { ...result.data, items: result.data.items.filter((r) => r.id !== recordId) } });
    try {
      await deleteRecord(recordId);
      showToast("기록을 지웠어요 🗑️");
    } catch {
      setResult(before);
      showToast("지우지 못했어요. 다시 시도해 주세요.");
    }
  }

  if (!result) {
    return <p className="page-sub loading">기록을 불러오는 중이에요… 🐾</p>;
  }

  if (!result.ok) {
    return (
      <div className="card empty">
        <div className="empty-emoji">📡</div>
        <p>기록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>
        <button type="button" className="btn-primary" onClick={load}>
          다시 불러오기
        </button>
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

  const { dogName, items } = result.data;
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
            <div className="summary-count">{items.filter((r) => r.type === type).length}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">오늘 타임라인</h2>

      {items.length === 0 ? (
        <div className="card empty">
          <div className="empty-emoji">🐾</div>
          <p>아직 오늘 기록이 없어요</p>
          <Link href="/record" className="btn-primary">
            기록하러 가기
          </Link>
        </div>
      ) : (
        <ul className="timeline">
          {items.map((r) => {
            const mine = r.memberId === membership?.memberId;
            return (
              <li key={r.id} className="card timeline-item">
                <span className="timeline-time">{formatTime(r.createdAt)}</span>
                <div className="timeline-body">
                  <div className="timeline-main">
                    {CARE_LABELS[r.type].emoji} {CARE_LABELS[r.type].label}{" "}
                    <span className="timeline-who">· {r.who}</span>
                  </div>
                  {r.memo && <div className="timeline-memo">“{r.memo}”</div>}
                </div>
                {mine && (
                  <button
                    type="button"
                    className="delete-btn"
                    aria-label={`${formatTime(r.createdAt)} ${CARE_LABELS[r.type].label} 기록 지우기`}
                    onClick={() => handleDelete(r.id, CARE_LABELS[r.type].label)}
                  >
                    🗑️
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
