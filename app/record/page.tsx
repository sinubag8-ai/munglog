"use client";

// ✏️ 기록: 종류 고르고 저장하기
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCare } from "@/lib/care-store";
import { CARE_LABELS, CARE_ORDER, type CareType } from "@/lib/types";

export default function RecordPage() {
  const { dog, addRecord } = useCare();
  const router = useRouter();
  const [selected, setSelected] = useState<CareType | null>(null);
  const [memo, setMemo] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function handleSave() {
    if (!selected) return;
    addRecord(selected, memo);
    const { label, emoji } = CARE_LABELS[selected];
    setToast(`${label} 기록 완료! ${emoji}`);
    setTimeout(() => router.push("/"), 900);
  }

  return (
    <>
      <h1 className="page-title">기록하기 ✏️</h1>
      <p className="page-sub">{dog.name}에게 방금 무엇을 해 주었나요?</p>

      <div className="care-buttons">
        {CARE_ORDER.map((type) => (
          <button
            key={type}
            type="button"
            className={`care-button ${selected === type ? "care-button-selected" : ""}`}
            onClick={() => setSelected(type)}
            aria-pressed={selected === type}
          >
            <span className="emoji">{CARE_LABELS[type].emoji}</span>
            {CARE_LABELS[type].label}
          </button>
        ))}
      </div>

      <h2 className="section-title">메모 (선택)</h2>
      <textarea
        className="memo"
        rows={3}
        maxLength={100}
        placeholder="예: 간식 2개, 공원 한 바퀴"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <button type="button" className="btn-primary" disabled={!selected || !!toast} onClick={handleSave}>
          {selected ? "기록 저장" : "무엇을 했는지 골라 주세요"}
        </button>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
