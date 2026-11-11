"use client";

// 로그인 상태에 따라 알맞은 화면으로 보내 줘요
// - 로그인 전 → /login
// - 가족방 없음 → /start
// - 준비 완료 → 탭 화면 (하단 탭바 보임)
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import TabBar from "@/components/TabBar";
import { useAuth, type AuthStatus } from "@/lib/auth";

// 상태마다 있어야 할 화면
function targetPath(status: AuthStatus, pathname: string): string | null {
  if (status === "signed-out") return pathname === "/login" ? null : "/login";
  if (status === "no-family") return pathname === "/start" ? null : "/start";
  if (status === "ready") return pathname === "/login" || pathname === "/start" ? "/" : null;
  return null;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const target = targetPath(status, pathname);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (status === "no-keys") {
    return (
      <main className="page">
        <div className="card empty">
          <div className="empty-emoji">🔑</div>
          <p>Supabase 키를 아직 넣지 않았어요. .env.local 파일을 확인해 주세요.</p>
        </div>
      </main>
    );
  }

  // 확인 중이거나 다른 화면으로 이동하는 중
  if (status === "loading" || target) {
    return (
      <main className="page splash">
        <div className="splash-logo">🐾</div>
        <p className="page-sub">멍로그를 여는 중이에요…</p>
      </main>
    );
  }

  return (
    <>
      <main className="page">{children}</main>
      {status === "ready" && <TabBar />}
    </>
  );
}
