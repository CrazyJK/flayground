/**
 * flay-ai RAG 채팅 API 클라이언트 (SSE)
 *
 * flay-ai(FastAPI, ai.kamoru.jk:8000)의 POST /api/chat 을 호출하고
 * SSE 스트림 이벤트(tool_call / tool_result / token / done / error)를 콜백으로 전달한다.
 * POST 라서 EventSource 를 쓸 수 없어 fetch + ReadableStream 으로 파싱한다.
 * 이벤트 계약은 flay-ai/packages/rag/router.py 와 공유 — 한쪽만 바꾸지 말 것.
 */

// flay-ai API 베이스 (flay-mcp 의 index-proxy.ts 와 같은 상수 방식)
const API_BASE = 'https://ai.kamoru.jk:8000';

/** flay-ai 검색 결과 hit — flay-web 에서는 opus 만 사용해 FlayCard 로 렌더한다 */
export interface VideoHit {
  opus: string;
  title?: string | null;
  kind?: 'instance' | 'archive' | null;
  score?: number;
  [key: string]: unknown;
}

/** SSE 이벤트 (flay-ai 계약) */
export type ChatEvent =
  | { type: 'tool_call'; name?: string; args?: Record<string, unknown> }
  | { type: 'tool_result'; name?: string; result?: unknown }
  | { type: 'token'; text?: string }
  | { type: 'done'; message?: string }
  | { type: 'error'; error?: string; message?: string };

/**
 * tool_result.result 에서 hit 목록 추출 (배열 또는 {items: [...]} 두 형태 지원)
 * @param result tool_result 이벤트의 result 값
 * @returns VideoHit 배열 (해석 불가 시 빈 배열)
 */
export function extractHits(result: unknown): VideoHit[] {
  if (Array.isArray(result)) return result as VideoHit[];
  if (result && typeof result === 'object' && Array.isArray((result as { items?: unknown }).items)) {
    return (result as { items: VideoHit[] }).items;
  }
  return [];
}

/**
 * flay-ai 채팅 질의 (SSE 스트리밍)
 *
 * @param query 사용자 자연어 질의
 * @param options limit(결과 최대 개수), signal(중단), onEvent(이벤트 콜백)
 * @returns 스트림 종료 시 resolve. HTTP 오류·네트워크 오류는 throw (중단은 AbortError)
 */
export async function chat(query: string, options: { limit: number; signal?: AbortSignal; onEvent: (ev: ChatEvent) => void }): Promise<void> {
  const { limit, signal, onEvent } = options;

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ query, limit, kind: 'instance' }), // flay-web 은 instance 만 대상 (확정)
    ...(signal && { signal }),
  });
  if (!response.ok || !response.body) {
    throw new Error(`flay-ai 응답 오류: HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE 이벤트 경계: 빈 줄 (\n\n 또는 \r\n\r\n)
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const payload = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
        .trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as ChatEvent);
      } catch {
        // JSON 이 아닌 조각은 무시
      }
    }
  }
}
