// 👨‍👩‍👧 가족방 · 구성원 · 강아지 정보 (Supabase)
import { supabase } from "./supabase";

export interface FamilyMember {
  id: string;
  displayName: string;
  isOwner: boolean;
}

export interface FamilyInfo {
  name: string;
  inviteCode: string;
  members: FamilyMember[];
}

export interface DogProfile {
  id: string;
  name: string;
  breed: string | null;
  birthday: string | null; // YYYY-MM-DD
}

export async function fetchFamily(familyId: string): Promise<FamilyInfo> {
  if (!supabase) throw new Error("no-keys");
  const [{ data: family, error: fErr }, { data: members, error: mErr }] = await Promise.all([
    supabase.from("families").select("name, invite_code").eq("id", familyId).single(),
    supabase
      .from("family_members")
      .select("id, display_name, is_owner")
      .eq("family_id", familyId)
      .order("joined_at"),
  ]);
  if (fErr) throw fErr;
  if (mErr) throw mErr;
  return {
    name: family.name,
    inviteCode: family.invite_code,
    members: (members ?? []).map((m) => ({ id: m.id, displayName: m.display_name, isOwner: m.is_owner })),
  };
}

export async function fetchDogProfile(familyId: string): Promise<DogProfile | null> {
  if (!supabase) throw new Error("no-keys");
  const { data, error } = await supabase
    .from("dogs")
    .select("id, name, breed, birthday")
    .eq("family_id", familyId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 내 표시 이름 바꾸기 (보안 규칙: 내 이름만 바꿀 수 있어요)
export async function updateMyDisplayName(memberId: string, name: string) {
  if (!supabase) throw new Error("no-keys");
  const { data, error } = await supabase
    .from("family_members")
    .update({ display_name: name.trim() })
    .eq("id", memberId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not-updated");
}
