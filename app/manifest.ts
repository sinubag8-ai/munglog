// 📱 홈 화면 설치용 앱 정보 (PWA manifest)
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "멍로그",
    short_name: "멍로그",
    description: "가족이 함께 남기는 강아지 돌봄 기록",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone", // 홈 화면에서 열면 주소창 없이 전체 화면
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ff8a3d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
