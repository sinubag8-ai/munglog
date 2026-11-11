"use client";

// 화면들이 같이 쓰는 임시 저장소
// 오늘 기록 "읽기"는 Supabase에서 해요 (lib/today.ts).
// 기록 "저장"은 STEP 6(로그인)에서 Supabase로 연결할 예정이라,
// 그전까지 새로 남긴 기록은 여기(메모리)에만 있어서 새로고침하면 사라져요.

import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_MEMBER_ID, mockDog, mockFamily } from "./mock-data";
import type { CareRecord, CareType, Dog, Family, Member } from "./types";

interface CareStore {
  family: Family;
  dog: Dog;
  me: Member;
  records: CareRecord[];
  addRecord: (type: CareType, memo?: string) => void;
  updateMyName: (name: string) => void;
}

const CareContext = createContext<CareStore | null>(null);

export function CareProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family>(mockFamily);
  const [records, setRecords] = useState<CareRecord[]>([]);
  const dog = mockDog;
  const me = family.members.find((m) => m.id === CURRENT_MEMBER_ID)!;

  function addRecord(type: CareType, memo?: string) {
    const record: CareRecord = {
      id: `r-${Date.now()}`,
      dogId: dog.id,
      type,
      createdAt: new Date().toISOString(), // 시간: 자동
      memberId: me.id, // 기록한 사람: 자동
      memo: memo?.trim() || undefined,
    };
    setRecords((prev) => [...prev, record]);
  }

  function updateMyName(name: string) {
    setFamily((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === me.id ? { ...m, displayName: name } : m)),
    }));
  }

  return (
    <CareContext.Provider value={{ family, dog, me, records, addRecord, updateMyName }}>
      {children}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error("useCare는 CareProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
