// 멍로그 데이터 모양 정의
// 구조: 가족방(Family) → 강아지(Dog) → 기록(CareRecord)
// 나중에 Supabase 테이블도 이 모양 그대로 만들 예정이에요.

export type CareType = "walk" | "meal" | "snack";

export interface Member {
  id: string;
  displayName: string; // 타임라인에 "· 엄마"처럼 보이는 이름
  isOwner: boolean; // 가족방을 만든 사람(방장)
}

export interface Dog {
  id: string;
  familyId: string;
  name: string;
  breed: string;
  birthday: string; // YYYY-MM-DD
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string; // 6자리 초대 코드
  members: Member[];
}

export interface CareRecord {
  id: string;
  dogId: string;
  type: CareType;
  createdAt: string; // 저장한 순간 (자동)
  memberId: string; // 기록한 사람 (자동)
  memo?: string; // 선택
}

export const CARE_LABELS: Record<CareType, { label: string; emoji: string }> = {
  walk: { label: "산책", emoji: "🦮" },
  meal: { label: "밥", emoji: "🍚" },
  snack: { label: "간식", emoji: "🦴" },
};

export const CARE_ORDER: CareType[] = ["walk", "meal", "snack"];
