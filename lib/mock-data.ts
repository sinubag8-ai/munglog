// 가짜 데이터 (STEP 5에서 Supabase로 바꿀 예정이에요)
import type { CareRecord, Dog, Family } from "./types";

export const mockFamily: Family = {
  id: "family-1",
  name: "콩이네",
  inviteCode: "A3K9P2",
  members: [
    { id: "m-mom", displayName: "엄마", isOwner: true },
    { id: "m-dad", displayName: "아빠", isOwner: false },
    { id: "m-me", displayName: "나", isOwner: false },
    { id: "m-sis", displayName: "언니", isOwner: false },
  ],
};

export const mockDog: Dog = {
  id: "dog-1",
  familyId: "family-1",
  name: "콩이",
  breed: "말티즈",
  birthday: "2022-04-15",
};

// 지금 로그인한 사람이라고 가정
export const CURRENT_MEMBER_ID = "m-me";

// 가짜 기록 시각: 오늘 0시부터 지금 사이에 골고루 나눠서 만들어요.
// (언제 열어도 "오늘"이고 "지금보다 이전"인 기록이 보이게)
function todayFraction(fraction: number): string {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return new Date(start.getTime() + (now.getTime() - start.getTime()) * fraction).toISOString();
}

export function createMockRecords(): CareRecord[] {
  return [
    { id: "r1", dogId: "dog-1", type: "meal", createdAt: todayFraction(0.35), memberId: "m-mom", memo: "사료 반 컵" },
    { id: "r2", dogId: "dog-1", type: "walk", createdAt: todayFraction(0.42), memberId: "m-dad", memo: "공원 한 바퀴" },
    { id: "r3", dogId: "dog-1", type: "snack", createdAt: todayFraction(0.55), memberId: "m-me" },
    { id: "r4", dogId: "dog-1", type: "snack", createdAt: todayFraction(0.68), memberId: "m-sis", memo: "덴탈껌 1개" },
    { id: "r5", dogId: "dog-1", type: "meal", createdAt: todayFraction(0.8), memberId: "m-mom" },
    { id: "r6", dogId: "dog-1", type: "walk", createdAt: todayFraction(0.92), memberId: "m-me", memo: "비 와서 짧게 🌧️" },
  ];
}
