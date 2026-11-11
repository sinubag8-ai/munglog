"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "오늘", emoji: "🏠" },
  { href: "/record", label: "기록", emoji: "✏️" },
  { href: "/family", label: "가족", emoji: "👨‍👩‍👧" },
  { href: "/me", label: "내 정보", emoji: "👤" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="하단 메뉴">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab ${active ? "tab-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="tab-emoji" aria-hidden>
              {tab.emoji}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
