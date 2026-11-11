import type { Metadata, Viewport } from "next";
import AuthGate from "@/components/AuthGate";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "멍로그",
  description: "가족이 함께 남기는 강아지 돌봄 기록",
  applicationName: "멍로그",
  // 아이폰 '홈 화면에 추가'용 설정
  appleWebApp: {
    capable: true, // 홈 화면에서 열면 주소창 없이 전체 화면
    title: "멍로그",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // 아이폰 화면 끝(노치·하단 바)까지 꽉 차게
  themeColor: "#ff8a3d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <div className="app">
            <AuthGate>{children}</AuthGate>
          </div>
        </AuthProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
