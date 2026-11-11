"use client";

// 👤 내 정보: 표시 이름, 강아지 프로필, 로그아웃 (Supabase)
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchDogProfile, updateMyDisplayName, type DogProfile } from "@/lib/family";

export default function MePage() {
  const { membership, user, refresh, signOut } = useAuth();
  const [name, setName] = useState(membership?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dog, setDog] = useState<DogProfile | null | undefined>(undefined); // undefined = 불러오는 중
  const [dogFailed, setDogFailed] = useState(false);

  const currentName = membership?.displayName ?? "";
  const trimmed = name.trim();
  const changed = trimmed.length > 0 && trimmed !== currentName;

  useEffect(() => {
    if (!membership) return;
    fetchDogProfile(membership.familyId)
      .then(setDog)
      .catch(() => setDogFailed(true));
  }, [membership]);

  async function handleSave() {
    if (!membership || !changed || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateMyDisplayName(membership.memberId, trimmed);
      await refresh(); // 앱 전체에 바뀐 이름 알리기
      setMessage({ ok: true, text: "이름을 바꿨어요 ✅" });
    } catch {
      setMessage({ ok: false, text: "저장하지 못했어요. 다시 시도해 주세요." });
    }
    setSaving(false);
  }

  return (
    <>
      <h1 className="page-title">내 정보 👤</h1>
      <p className="page-sub">가족에게 보이는 내 이름을 정해 주세요.</p>

      <div className="card">
        <p className="field-label">내 표시 이름 (타임라인에 &ldquo;· {currentName}&rdquo;으로 보여요)</p>
        <div className="row">
          <input
            className="text-input"
            value={name}
            maxLength={10}
            onChange={(e) => {
              setName(e.target.value);
              setMessage(null);
            }}
            placeholder="예: 엄마, 막내"
          />
          <button type="button" className="btn-outline" onClick={handleSave} disabled={!changed || saving}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
        {message && (
          <p className={message.ok ? "form-ok" : "form-error"} role="status" style={{ marginTop: 10 }}>
            {message.text}
          </p>
        )}
      </div>

      <h2 className="section-title">강아지 프로필</h2>
      <div className="card dog-profile">
        <div className="dog-photo" aria-hidden>
          🐶
        </div>
        {dogFailed ? (
          <p className="dog-info">강아지 정보를 불러오지 못했어요.</p>
        ) : dog === undefined ? (
          <p className="dog-info">불러오는 중이에요…</p>
        ) : dog === null ? (
          <p className="dog-info">아직 등록된 강아지가 없어요.</p>
        ) : (
          <div>
            <div className="dog-name">{dog.name}</div>
            <div className="dog-info">{dog.breed ?? "견종을 아직 안 적었어요"}</div>
            <div className="dog-info">
              {dog.birthday ? `생일 ${dog.birthday.replaceAll("-", ".")}` : "생일을 아직 안 적었어요"}
            </div>
          </div>
        )}
      </div>

      <p className="hint" style={{ marginTop: 28 }}>
        {user?.email} 로 로그인했어요
      </p>
      <button type="button" className="logout" style={{ marginTop: 4 }} onClick={signOut}>
        로그아웃
      </button>
    </>
  );
}
