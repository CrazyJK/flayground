import { chat, extractHits } from '@ai/flayAiChat';
import GroundFlay from '@base/GroundFlay';
import FlayCard from '@flay/domain/FlayCard';
import FlayStorage from '@lib/storage/FlayStorage';
import './FlayAiChatPanel.scss';

const LIMIT_STORAGE_KEY = 'flay-ai-chat.limit';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100; // flay-ai API 허용 범위 1..100

// 전송(↵) / 중단(■) 아이콘 — 상태에 따라 버튼 내용 교체
const SVG_SEND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`;
const SVG_STOP = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

/**
 * FlayAiChatPanel - flay-ai RAG 채팅 패널
 *
 * 자연어 질의를 flay-ai(POST /api/chat, SSE)로 보내고,
 * 결과 hit 의 opus 를 FlayCard 로 렌더한다(상세는 flay-web backend 가 로드).
 *
 * @example
 * document.querySelector('main').appendChild(new FlayAiChatPanel());
 */
export default class FlayAiChatPanel extends GroundFlay {
  #logEl: HTMLElement;
  #inputEl: HTMLInputElement;
  #limitEl: HTMLInputElement;
  #sendEl: HTMLButtonElement;
  #abortController: AbortController | null = null;

  constructor() {
    super();
    this.classList.add('flay-ai-chat-panel');

    this.innerHTML = `
      <div class="chat-log">
        <div class="chat-intro"></div>
      </div>
      <form class="composer">
        <div class="composer-box">
          <input type="text" placeholder="검색할 내용을 입력하세요" />
          <input type="number" title="결과 개수" min="1" max="${MAX_LIMIT}" step="1" />
          <button type="submit" title="전송">${SVG_SEND}</button>
        </div>
      </form>
    `;

    this.#logEl = this.querySelector('.chat-log')!;
    this.#inputEl = this.querySelector<HTMLInputElement>('input[type="text"]')!;
    this.#limitEl = this.querySelector<HTMLInputElement>('input[type="number"]')!;
    this.#sendEl = this.querySelector('button')!;

    this.#limitEl.value = String(FlayStorage.local.getNumber(LIMIT_STORAGE_KEY, DEFAULT_LIMIT));
  }

  connectedCallback() {
    this.querySelector('form')!.addEventListener('submit', this.#handleSubmit);
    // change 는 blur 전까지 발생하지 않아 값을 바꾸고 바로 떠나면 유실 → input 으로 즉시 저장
    this.#limitEl.addEventListener('input', this.#handleLimitChange);
    this.#inputEl.focus();
  }

  disconnectedCallback() {
    this.querySelector('form')!.removeEventListener('submit', this.#handleSubmit);
    this.#limitEl.removeEventListener('input', this.#handleLimitChange);
    this.#abortController?.abort();
  }

  #handleSubmit = (e: SubmitEvent): void => {
    e.preventDefault();
    if (this.#abortController) {
      this.#abortController.abort(); // 전송 중이면 버튼이 '중단' 역할
      return;
    }
    void this.#send(this.#inputEl.value);
  };

  #handleLimitChange = (): void => {
    // 입력 중 빈 값·0 같은 일시적 값은 저장하지 않는다 (재진입 시 0개로 복원되는 것 방지)
    const n = Number(this.#limitEl.value);
    if (Number.isFinite(n) && n >= 1) {
      FlayStorage.local.set(LIMIT_STORAGE_KEY, String(Math.min(MAX_LIMIT, n)));
    }
  };

  /**
   * 질의 전송 → SSE 이벤트를 받아 대화 로그에 카드/요약 렌더
   */
  async #send(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();
    if (!query) return;

    this.#inputEl.value = '';
    this.#setBusy(true);

    // 대화 한 회차: 질문 말풍선 + 답변(카드 그리드 + 요약 한 줄)
    this.querySelector('.chat-intro')?.remove();
    const exchangeEl = this.#logEl.appendChild(document.createElement('div'));
    exchangeEl.classList.add('exchange');
    exchangeEl.innerHTML = `
      <div class="user-query"></div>
      <div class="cards"></div>
      <div class="summary streaming">검색 중…</div>
    `;
    exchangeEl.querySelector('.user-query')!.textContent = query;
    const cardsEl = exchangeEl.querySelector<HTMLElement>('.cards')!;
    const summaryEl = exchangeEl.querySelector<HTMLElement>('.summary')!;
    exchangeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const seenOpus = new Set<string>();
    // 실제 사용한 개수를 저장해 재진입 시 복원 (input 저장의 안전망)
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(this.#limitEl.value) || DEFAULT_LIMIT));
    FlayStorage.local.set(LIMIT_STORAGE_KEY, String(limit));
    this.#abortController = new AbortController();
    try {
      await chat(query, {
        limit,
        signal: this.#abortController.signal,
        onEvent: (ev) => {
          switch (ev.type) {
            case 'tool_result':
              for (const hit of extractHits(ev.result)) {
                if (!hit.opus || seenOpus.has(hit.opus)) continue;
                seenOpus.add(hit.opus);
                const card = cardsEl.appendChild(new FlayCard());
                void card.set(hit.opus);
              }
              break;
            case 'done':
              summaryEl.textContent = ev.message ?? `${seenOpus.size}건`;
              break;
            case 'error':
              throw new Error(ev.error ?? ev.message ?? 'flay-ai 오류');
            default: // tool_call·token 은 표시할 것 없음 (요약은 done 에서 렌더)
              break;
          }
        },
      });
      summaryEl.classList.remove('streaming');
    } catch (e) {
      summaryEl.classList.remove('streaming');
      if (this.#abortController.signal.aborted) {
        summaryEl.textContent = '⏹ 중단됨';
      } else {
        summaryEl.classList.add('error');
        summaryEl.textContent = `⚠ ${e instanceof Error ? e.message : String(e)}`;
      }
    } finally {
      this.#abortController = null;
      this.#setBusy(false);
    }
  }

  #setBusy(busy: boolean): void {
    this.#sendEl.innerHTML = busy ? SVG_STOP : SVG_SEND;
    this.#sendEl.title = busy ? '중단' : '전송';
    this.#inputEl.disabled = busy;
    if (!busy) this.#inputEl.focus();
  }
}

customElements.define('flay-ai-chat-panel', FlayAiChatPanel);
