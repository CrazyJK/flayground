"use client";

// 일기 첨부 미디어 모아보기 패널 — /diary 페이지 안에서 뷰 전환으로 표시(라우트 아님).
// 항상 마운트되어 있고 visibility 로만 숨겨지므로 스크롤·로드 상태가 유지된다.
// 데이터는 첫 활성화(active=true) 때 처음 불러온다.

import { useCallback, useEffect, useRef, useState } from "react";

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

export default function MediaPane({
  active,
  onWrite,
}: {
  active: boolean;
  onWrite: () => void; // 빈 상태에서 '일기 쓰러 가기' → 일기 뷰로 전환
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null); // 라이트박스 대상(items 인덱스)
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

  // 첫 활성화 때 1회 로드(일기 뷰에만 머무는 동안은 불러오지 않음)
  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true;
      void load();
    }
  }, [active, load]);

  // 라이트박스 이전/다음(경계에서 멈춤). 다음(과거) 끝에 다다르면 다음 페이지 미리 로드.
  const step = useCallback(
    (delta: number) => {
      setViewerIdx((cur) => {
        if (cur == null) return cur;
        const next = cur + delta;
        if (next < 0 || next >= items.length) return cur;
        if (next >= items.length - 3) void load(); // 끝 근처 → 미리 더 불러오기
        return next;
      });
    },
    [items.length, load]
  );

  // 라이트박스 키보드 — ESC 닫기, ←(최신)/→(과거) 이동. 미디어 뷰가 활성일 때만.
  useEffect(() => {
    if (!active || viewerIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerIdx(null);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, viewerIdx, step]);

  // 아래로 스크롤 → 더 과거 미디어 로드
  const onScroll = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    if (c.scrollTop + c.clientHeight > c.scrollHeight - 400) void load();
  }, [load]);

  // 날짜별 그룹(도착 순서 = 최신순 유지). idx = items 전역 인덱스(라이트박스 탐색용)
  const groups: { date: string; items: { it: MediaItem; idx: number }[] }[] = [];
  items.forEach((it, idx) => {
    const g = groups[groups.length - 1];
    if (g && g.date === it.date) g.items.push({ it, idx });
    else groups.push({ date: it.date, items: [{ it, idx }] });
  });
  const viewer = viewerIdx != null ? items[viewerIdx] : null;

  return (
    <>
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto w-full">
        <div className="max-w-[960px] mx-auto px-6 pt-4 pb-8 flex flex-col gap-4">
          {total > 0 && (
            <div className="font-sans text-center text-xs text-muted-foreground">
              사진·동영상 {total}개
            </div>
          )}
          {groups.map((g) => (
            <section key={g.date}>
              <DateHeader label={dateLabel(g.date)} />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 mt-1">
                {g.items.map(({ it, idx }) => (
                  <button
                    key={it.url}
                    type="button"
                    onClick={() => setViewerIdx(idx)}
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
          {/* 로드가 끝났는데(hasMore=false) 아무것도 없으면 빈 상태 */}
          {!loading && !hasMore && items.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="text-lg text-muted-foreground">
                아직 일기에 첨부한 사진·동영상이 없어요.
              </div>
              <button
                type="button"
                onClick={onWrite}
                className="font-sans text-sm text-[var(--diary-accent)] hover:opacity-80"
              >
                일기 쓰러 가기 →
              </button>
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <div className="font-sans text-center text-xs text-muted-foreground opacity-70 py-2">
              — 전부 봤어요 —
            </div>
          )}
        </div>
      </div>

      {/* 라이트박스 — 원본 보기/재생 (배경 클릭·ESC 닫기, ←→·버튼으로 이전/다음) */}
      {viewer && viewerIdx != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setViewerIdx(null)}
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setViewerIdx(null)}
            className="absolute top-4 right-5 text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
          {/* 이전(최신 쪽) */}
          {viewerIdx > 0 && (
            <button
              type="button"
              aria-label="이전"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {/* 다음(과거 쪽) */}
          {viewerIdx < items.length - 1 && (
            <button
              type="button"
              aria-label="다음"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {viewer.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={viewer.url}
                src={`${API_BASE}${viewer.url}`}
                alt=""
                className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
              />
            ) : (
              <video
                key={viewer.url}
                src={`${API_BASE}${viewer.url}`}
                controls
                autoPlay
                className="max-h-[88vh] max-w-[92vw] rounded-lg"
              />
            )}
            <div className="mt-2 text-center font-sans text-xs text-neutral-300">
              {dateLabel(viewer.date)} · {viewerIdx + 1}/{total || items.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
