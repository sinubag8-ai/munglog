"use client";

// 로그인 상태 + 내가 속한 가족방 정보를 앱 전체에 알려 주는 곳
import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export interface Membership {
  memberId: string;
  familyId: string;
  displayName: string;
  isOwner: boolean;
}

export type AuthStatus =
  | "loading" // 확인 중
  | "no-keys" // Supabase 키가 없음
  | "signed-out" // 로그인 전
  | "no-family" // 로그인했지만 가족방이 없음
  | "ready"; // 가족방까지 준비 완료

interface AuthState {
  status: AuthStatus;
  user: User | null;
  membership: Membership | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(supabase ? "loading" : "no-keys");
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setMembership(null);
      setStatus("signed-out");
      return;
    }

    const { data: row } = await supabase
      .from("family_members")
      .select("id, family_id, display_name, is_owner")
      .eq("user_id", currentUser.id)
      .limit(1)
      .maybeSingle();

    if (!row) {
      setMembership(null);
      setStatus("no-family");
      return;
    }

    setMembership({
      memberId: row.id,
      familyId: row.family_id,
      displayName: row.display_name,
      isOwner: row.is_owner,
    });
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    refresh();
    // 로그인·로그아웃이 일어나면 다시 확인해요
    // (Supabase 안내대로, 이 알림 안에서 바로 DB를 부르지 않고 한 박자 뒤에 불러요)
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(refresh, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ status, user, membership, refresh, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
