// 🏠 오늘 화면에 필요한 데이터를 Supabase에서 읽어 와요
import { supabase } from "./supabase";
import type { CareType } from "./types";

export interface TimelineItem {
  id: string;
  type: CareType;
  createdAt: string;
  memo?: string;
  who: string; // 기록한 사람 표시 이름
}

export interface TodayData {
  dogName: string;
  items: TimelineItem[];
}

export type TodayResult =
  | { ok: true; data: TodayData | null } // null = 보이는 강아지가 없음
  | { ok: false; reason: "no-keys" | "error" };

export async function fetchToday(): Promise<TodayResult> {
  if (!supabase) return { ok: false, reason: "no-keys" };

  // 1) 보이는 강아지 한 마리 (보안 규칙 때문에 우리 가족 강아지만 보여요)
  const { data: dog, error: dogError } = await supabase
    .from("dogs")
    .select("id, name")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (dogError) return { ok: false, reason: "error" };
  if (!dog) return { ok: true, data: null };

  // 2) 오늘 0시(휴대폰 기준) 이후 기록 + 기록한 사람 이름
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: rows, error } = await supabase
    .from("care_records")
    .select("id, type, memo, created_at, member:family_members(display_name)")
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
      who: member?.display_name ?? "가족",
    };
  });

  return { ok: true, data: { dogName: dog.name, items } };
}
