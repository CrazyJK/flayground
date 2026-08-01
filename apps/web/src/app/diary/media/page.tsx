"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../../_components/AppHeader";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";
const PAGE = 60; // 한 번에 불러올 미디어 수(화면 채울 만큼)

type MediaItem = {
  url: string;
  kind: "image" | "video";
  date: string;
  session_id: number;
  created_at: string;
};

// "YYYY-MM-DD" → "2026년 6월 20일"
function dateLabel(date?: string | null): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// 날짜 구간 헤더 — 일기 화면과 동일한 sticky 강조색 pill
function DateHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 -mx-6 px-6 py-2.5 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="font-sans inline-flex items-center rounded-full bg-[var(--diary-accent-soft)] px-3.5 py-1 text-[13px] font-semibold tracking-[0.02em] text-[var(--diary-accent)] ring-1 ring-[var(--diary-accent)]/25">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}

export default function DiaryMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [viewer, setViewer] = useState<MediaItem | null>(null); // 라이트박스 대상
  const offsetRef = useRef(0);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/diary/media?limit=${PAGE}&offset=${offsetRef.current}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      const arr = (Array.isArray(j.items) ? j.items : []) as MediaItem[];
      setItems((prev) => [...prev, ...arr]);
      offsetRef.current += PAGE;
      setHasMore(Boolean(j.has_more));
      setTotal(Number(j.total ?? 0));
    } catch {
      setHasMore(false); // 실패 시 더 시도하지 않음
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // 최초 1회 로드(load 참조가 바뀌어도 재실행 방지)
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      void load();
    }
  }, [load]);

  // 라이트박스 ESC 닫기
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  // 아래로 스크롤 → 더 과거 미디어 로드
  const onScroll = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    if (c.scrollTop + c.clientHeight > c.scrollHeight - 400) void load();
  }, [load]);

  // 날짜별 그룹(도착 순서 = 최신순 유지)
  const groups: { date: string; items: MediaItem[] }[] = [];
  for (const it of items) {
    const g = groups[groups.length - 1];
    if (g && g.date === it.date) g.items.push(it);
    else groups.push({ date: it.date, items: [it] });
  }

  return (
    <main className="flex-1 flex flex-col w-full min-h-0">
      <AppHeader
        active="diary"
        actions={
          <span className="flex items-baseline gap-3">
            <Link href="/diary" className="text-xs text-muted-foreground hover:text-foreground">
              ← 일기
            </Link>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">미디어 {total}개</span>
            )}
          </span>
        }
      />

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto w-full">
        <div className="max-w-[960px] mx-auto px-6 pt-4 pb-8 flex flex-col gap-4">
          {groups.map((g) => (
            <section key={g.date}>
              <DateHeader label={dateLabel(g.date)} />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mt-1">
                {g.items.map((it) => (
                  <button
                    key={it.url}
                    type="button"
                    onClick={() => setViewer(it)}
                    title={dateLabel(it.date)}
                    className="group relative aspect-square overflow-hidden rounded-[10px] border border-border bg-muted cursor-pointer"
                  >
                    {it.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${API_BASE}${it.url}`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <>
                        <video
                          src={`${API_BASE}${it.url}`}
                          preload="metadata"
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                        {/* 재생 배지 — 동영상 구분 */}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="8 5 19 12 8 19" />
                            </svg>
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}

          {loading && (
            <div className="font-sans text-center text-xs text-muted-foreground py-3">
              불러오는 중…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="text-lg text-muted-foreground">
                아직 일기에 첨부한 사진·동영상이 없어요.
              </div>
              <Link href="/diary" className="font-sans text-sm text-[var(--diary-accent)] hover:opacity-80">
                일기 쓰러 가기 →
              </Link>
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div className="font-sans text-center text-xs text-muted-foreground opacity-70 py-2">
              — 전부 봤어요 —
            </div>
          )}
        </div>
      </div>

      {/* 라이트박스 — 원본 보기/재생 (배경 클릭·ESC 닫기) */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setViewer(null)}
            className="absolute top-4 right-5 text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {viewer.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${API_BASE}${viewer.url}`}
                alt=""
                className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
              />
            ) : (
              <video
                src={`${API_BASE}${viewer.url}`}
                controls
                autoPlay
                className="max-h-[88vh] max-w-[92vw] rounded-lg"
              />
            )}
            <div className="mt-2 text-center font-sans text-xs text-neutral-300">
              {dateLabel(viewer.date)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
