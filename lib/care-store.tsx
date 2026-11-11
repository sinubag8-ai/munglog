"use client";

// 가족 · 내 정보 화면이 쓰는 임시 저장소 (가짜 데이터)
// 오늘 기록 읽기·저장·삭제는 이제 Supabase로 해요 (lib/today.ts, lib/records.ts).
// 이 파일은 STEP 6-3에서 진짜 데이터로 바꾸면서 정리할 예정이에요.

import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_MEMBER_ID, mockDog, mockFamily } from "./mock-data";
import type { Dog, Family, Member } from "./types";

interface CareStore {
  family: Family;
  dog: Dog;
  me: Member;
  updateMyName: (name: string) => void;
}

const CareContext = createContext<CareStore | null>(null);

export function CareProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family>(mockFamily);
  const dog = mockDog;
  const me = family.members.find((m) => m.id === CURRENT_MEMBER_ID)!;

  function updateMyName(name: string) {
    setFamily((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === me.id ? { ...m, displayName: name } : m)),
    }));
  }

  return (
    <CareContext.Provider value={{ family, dog, me, updateMyName }}>
      {children}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error("useCare는 CareProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
