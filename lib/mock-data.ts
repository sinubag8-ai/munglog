// 가짜 데이터: 가족·내 정보 화면용 (STEP 6에서 Supabase로 바꿀 예정이에요)
// 오늘 기록은 이제 Supabase에서 읽어 와요.
import type { Dog, Family } from "./types";

export const mockFamily: Family = {
  id: "family-1",
  name: "땅콩이네",
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
  name: "땅콩이",
  breed: "말티즈",
  birthday: "2022-04-15",
};

// 지금 로그인한 사람이라고 가정
export const CURRENT_MEMBER_ID = "m-me";
