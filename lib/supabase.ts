// Supabase 연결 (키는 .env.local 에서 읽어요. 코드에 키를 직접 쓰지 않아요)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 키를 아직 안 넣었으면 null → 화면에서 안내 문구를 보여 줘요
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
