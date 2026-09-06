"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// 스튜디오(도구 영역) 네비 — 컬렉션 검색과 무관한 영상·이미지 도구만 모은다.
const NAV = [
  { key: "video", href: "/studio/video", label: "영상" },
  { key: "ico", href: "/studio/ico", label: "ICO" },
] as const;

export type StudioNavKey = (typeof NAV)[number]["key"];

/**
 * 스튜디오 영역 공통 상단 헤더 — AppHeader 와 같은 크기·위치, 좌측에 flayAI 복귀 링크.
 * @param active 현재 페이지 키(강조 표시)
 */
export default function StudioHeader({ active }: { active: StudioNavKey }) {
  return (
    <header className="shrink-0 mx-auto w-full max-w-[900px] px-4 py-4 border-b border-border flex items-baseline gap-2 font-sans">
      <h1 className="text-lg font-semibold">
        flayAI <span className="text-primary">스튜디오</span>
      </h1>
      <nav className="ml-auto flex items-center gap-3 text-xs">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={n.key === active ? "page" : undefined}
            className={
              n.key === active
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {n.label}
          </Link>
        ))}
        <span aria-hidden className="h-3 w-px bg-border" />
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← flayAI
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
