"use client";

// ✏️ 기록: 종류 고르고 저장하기 (Supabase에 저장)
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { saveRecord } from "@/lib/records";
import { fetchMyDog } from "@/lib/today";
import { CARE_LABELS, CARE_ORDER, type CareType } from "@/lib/types";

export default function RecordPage() {
  const { membership } = useAuth();
  const router = useRouter();
  const [dog, setDog] = useState<{ id: string; name: string } | null>(null);
  const [selected, setSelected] = useState<CareType | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!membership) return;
    fetchMyDog(membership.familyId)
      .then(setDog)
      .catch(() => setError("강아지 정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요."));
  }, [membership]);

  async function handleSave() {
    if (!selected || !dog || !membership || saving) return;
    setSaving(true);
    setError("");
    try {
      await saveRecord(dog.id, membership.memberId, selected, memo);
      const { label, emoji } = CARE_LABELS[selected];
      setDone(`${label} 기록 완료! ${emoji}`);
      setTimeout(() => router.push("/"), 900);
    } catch {
      setSaving(false);
      setError("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
    }
  }

  const dogName = dog?.name ?? "강아지";

  return (
    <>
      <h1 className="page-title">기록하기 ✏️</h1>
      <p className="page-sub">{dogName}에게 방금 무엇을 해 주었나요?</p>

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

      {error && (
        <p className="form-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="btn-primary"
          disabled={!selected || !dog || saving}
          onClick={handleSave}
        >
          {saving ? "저장하는 중이에요…" : selected ? "기록 저장" : "무엇을 했는지 골라 주세요"}
        </button>
      </div>

      {done && (
        <div className="toast" role="status">
          {done}
        </div>
      )}
    </>
  );
}
