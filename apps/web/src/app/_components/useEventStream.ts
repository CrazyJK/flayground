"use client";

import { useEffect, useRef } from "react";

/**
 * SSE(EventSource) 구독 공용 훅 — 주기 폴링(setInterval fetch)의 대체.
 *
 * - url 이 null 이면 연결하지 않는다(조건부 구독·종료 상태에서 close 용).
 *   EventSource 는 서버가 스트림을 닫아도 자동 재연결하므로, 종료 이벤트를 받으면
 *   호출부가 url 을 null 로 바꿔 닫는 것이 재연결 루프의 1차 방어다.
 * - 서버 프레임은 "data: <JSON>" 한 줄, 타입은 JSON 안 type 필드(기존 채팅 SSE 컨벤션).
 *   하트비트 코멘트(": ping")는 브라우저가 자동 무시한다.
 * - 재연결은 EventSource 네이티브에 위임(서버 다운 → 복구 시 자동 재구독).
 * - 탭이 숨겨지면 연결을 닫아 서버 샘플러를 쉬게 하고(구독자 0 이면 수집 정지),
 *   복귀 시 재연결 — 서버가 접속 즉시 최신 스냅샷을 선적재해 화면이 바로 채워진다.
 */
export function useEventStream<E>(url: string | null, onEvent: (ev: E) => void): void {
  // 핸들러는 ref 로 보관 — 렌더마다 재연결되지 않게 effect 의존성은 url 만
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  });

  useEffect(() => {
    if (!url) return;
    let es: EventSource | null = null;

    const open = () => {
      if (es) return;
      es = new EventSource(url);
      es.onmessage = (m) => {
        try {
          handlerRef.current(JSON.parse(m.data) as E);
        } catch {
          /* 파싱 불가 프레임은 무시 */
        }
      };
    };
    const close = () => {
      es?.close();
      es = null;
    };
    const onVis = () => {
      if (document.hidden) close();
      else open();
    };

    if (!document.hidden) open();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      close();
    };
  }, [url]);
}
