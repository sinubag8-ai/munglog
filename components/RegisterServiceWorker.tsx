"use client";

// 서비스 워커 등록 (배포된 사이트에서만 켜요. 개발 중에는 화면이 옛날 것으로 남지 않게 꺼 둬요)
import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // 등록에 실패해도 앱은 그대로 쓸 수 있어요
    });
  }, []);
  return null;
}
