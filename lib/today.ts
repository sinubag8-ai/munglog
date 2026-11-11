// 🏠 오늘 화면에 필요한 데이터를 Supabase에서 읽어 와요
import { supabase } from "./supabase";
import type { CareType } from "./types";

export interface TimelineItem {
  id: string;
  type: CareType;
  createdAt: string;
  memo?: string;
  memberId: string; // 기록한 사람 (내 기록인지 확인용)
  who: string; // 기록한 사람 표시 이름
}

export interface TodayData {
  dogId: string;
  dogName: string;
  items: TimelineItem[];
}

export type TodayResult =
  | { ok: true; data: TodayData | null } // null = 보이는 강아지가 없음
  | { ok: false; reason: "no-keys" | "error" };

// 우리 가족방의 강아지 (지금은 첫 번째 강아지 한 마리)
export async function fetchMyDog(familyId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("dogs")
    .select("id, name")
    .eq("family_id", familyId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchToday(familyId: string): Promise<TodayResult> {
  if (!supabase) return { ok: false, reason: "no-keys" };

  let dog;
  try {
    dog = await fetchMyDog(familyId);
  } catch {
    return { ok: false, reason: "error" };
  }
  if (!dog) return { ok: true, data: null };

  // 오늘 0시(휴대폰 기준) 이후 기록 + 기록한 사람 이름
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: rows, error } = await supabase
    .from("care_records")
    .select("id, type, memo, created_at, member_id, member:family_members(display_name)")
    .eq("dog_id", dog.id)
    .gte("created_at", startOfToday.toISOString())
    .order("created_at", { ascending: false });
  if (error) return { ok: false, reason: "error" };

  const items: TimelineItem[] = (rows ?? []).map((r) => {
    const member = r.member as unknown as { display_name: string } | null;
    return {
      id: r.id,
      type: r.type as CareType,
      createdAt: r.created_at,
      memo: r.memo ?? undefined,
      memberId: r.member_id,
      who: member?.display_name ?? "가족",
    };
  });

  return { ok: true, data: { dogId: dog.id, dogName: dog.name, items } };
}
