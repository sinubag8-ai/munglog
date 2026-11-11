// 돌봄 기록 저장 · 삭제 (Supabase)
// 보안 규칙이 "내 이름으로만 남기기", "내 기록만 삭제"를 한 번 더 막아 줘요.
import { supabase } from "./supabase";
import type { CareType } from "./types";

export async function saveRecord(dogId: string, memberId: string, type: CareType, memo?: string) {
  if (!supabase) throw new Error("no-keys");
  const { error } = await supabase.from("care_records").insert({
    dog_id: dogId,
    member_id: memberId, // 기록한 사람: 자동 (로그인한 나)
    type,
    memo: memo?.trim() || null,
    // 시간(created_at)은 Supabase가 저장하는 순간으로 자동으로 넣어요
  });
  if (error) throw error;
}

export async function deleteRecord(recordId: string) {
  if (!supabase) throw new Error("no-keys");
  const { data, error } = await supabase.from("care_records").delete().eq("id", recordId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not-deleted"); // 내 기록이 아니면 0개 지워져요
}
