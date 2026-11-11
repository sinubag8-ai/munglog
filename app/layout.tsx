import type { Metadata, Viewport } from "next";
import TabBar from "@/components/TabBar";
import { CareProvider } from "@/lib/care-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "멍로그",
  description: "가족이 함께 남기는 강아지 돌봄 기록",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff8a3d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <CareProvider>
          <div className="app">
            <main className="page">{children}</main>
            <TabBar />
          </div>
        </CareProvider>
      </body>
    </html>
  );
}
