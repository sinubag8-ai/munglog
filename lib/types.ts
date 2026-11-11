// 멍로그 공통 정의
// 데이터 구조: 가족방(families) → 강아지(dogs) → 기록(care_records)
// 표 모양은 supabase/schema.sql 에 있어요.

export type CareType = "walk" | "meal" | "snack";

export const CARE_LABELS: Record<CareType, { label: string; emoji: string }> = {
  walk: { label: "산책", emoji: "🦮" },
  meal: { label: "밥", emoji: "🍚" },
  snack: { label: "간식", emoji: "🦴" },
};

export const CARE_ORDER: CareType[] = ["walk", "meal", "snack"];
