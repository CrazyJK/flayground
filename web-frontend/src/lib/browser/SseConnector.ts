import '@lib/browser/SseConnector.scss';
import { addBeforeunloadListener } from '@lib/browser/windowAddEventListener';
import ApiClient from '@lib/services/ApiClient';
import FlayFetch, { Actress, Flay, Studio, Tag, Video } from '@lib/services/FlayFetch';
import { showAlert } from '../components/showAlert';

/**
 * Server-Sent Events를 통한 실시간 데이터 동기화 모듈
 *
 * 서버에서 발생하는 Flay, Studio, Video, Actress, Tag 등의 변경사항을
 * 실시간으로 수신하여 클라이언트 UI를 업데이트합니다.
 *
 * 다중 탭 환경 최적화:
 *   브라우저는 동일 도메인에 대해 최대 6개의 동시 HTTP/1.1 연결만 허용한다.
 *   각 탭이 SSE 연결을 1개씩 점유하면 6번째 탭부터 리소스 로드가 막힌다.
 *   이를 해결하기 위해 Web Locks API로 리더 탭을 1개 선출하고,
 *   리더만 EventSource를 보유한다. 다른 탭은 BroadcastChannel로 이벤트만 수신한다.
 *   리더 탭이 닫히면 대기 중이던 다른 탭이 자동으로 리더를 승계한다.
 *
 * @see https://developer.mozilla.org/ko/docs/Web/API/Server-sent_events
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
 */

/** Server-Sent Events 메시지 데이터 타입 */
interface SseMessageData {
  type: 'Batch' | 'Notice' | 'CURL' | string;
  message?: string;
  [key: string]: unknown;
}

/** Flay 요소 인터페이스 */
interface FlayElement extends HTMLElement {
  opus: string;
  flay: Flay;
  reload(): void;
}

/** Window 객체에 글로벌 이벤트 핸들러 추가 */
declare global {
  interface Window {
    emitFlay?: (flay: Flay) => void;
    emitStudio?: (studio: Studio) => void;
    emitVideo?: (video: Video) => void;
    emitActress?: (actress: Actress) => void;
    emitTag?: (tag: Tag) => void;
    emitBatch?: (data: SseMessageData) => void;
    emitNotice?: (data: string, warn?: boolean) => void;
    emitCurl?: (data: SseMessageData) => void;
    emitMessage?: (...datas: unknown[]) => void;
  }
}

/** 서버가 보내는 명명 이벤트 종류 */
type SseEventName = 'CONNECT' | 'FLAY' | 'STUDIO' | 'VIDEO' | 'ACTRESS' | 'TAG' | 'MESSAGE';
const SSE_EVENT_NAMES: SseEventName[] = ['CONNECT', 'FLAY', 'STUDIO', 'VIDEO', 'ACTRESS', 'TAG', 'MESSAGE'];

/** 리더 탭이 팔로워 탭에 전달하는 메시지 포맷 */
interface SseBroadcastMessage {
  event: SseEventName;
  /** EventSource 원본 데이터(문자열). JSON.parse는 수신 측에서 수행 */
  data: string;
}

const LOCK_NAME = 'flayground-sse-leader';
const CHANNEL_NAME = 'flayground-sse';

// ─────────────────────────────────────────────────────────────────────────────
// 비즈니스 로직 핸들러 (리더/팔로워 공통)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SSE 이벤트를 처리한다. 리더 탭(EventSource 직접 수신)과 팔로워 탭(BroadcastChannel 수신)
 * 모두 동일하게 호출되며, 각 탭의 DOM과 캐시를 갱신한다.
 *
 * @param eventName 이벤트 이름
 * @param rawData 서버가 보낸 원본 문자열
 */
function handleSseEvent(eventName: SseEventName, rawData: string): void {
  switch (eventName) {
    case 'CONNECT': {
      console.debug(eventName, rawData);
      break;
    }
    case 'FLAY': {
      console.debug(eventName, rawData);
      const flay: Flay = JSON.parse(rawData);
      FlayFetch.clear(flay.opus);
      emitFlay(flay);
      if (typeof window.emitFlay === 'function') window.emitFlay(flay);
      break;
    }
    case 'STUDIO': {
      console.debug(eventName, rawData);
      const studio: Studio = JSON.parse(rawData);
      emitStudio(studio);
      if (typeof window.emitStudio === 'function') window.emitStudio(studio);
      break;
    }
    case 'VIDEO': {
      console.debug(eventName, rawData);
      const video: Video = JSON.parse(rawData);
      FlayFetch.clear(video.opus);
      emitVideo(video);
      if (typeof window.emitVideo === 'function') window.emitVideo(video);
      break;
    }
    case 'ACTRESS': {
      console.debug(eventName, rawData);
      const actress: Actress = JSON.parse(rawData);
      emitActress(actress);
      if (typeof window.emitActress === 'function') window.emitActress(actress);
      break;
    }
    case 'TAG': {
      console.debug(eventName, rawData);
      const tag: Tag = JSON.parse(rawData);
      FlayFetch.clearTag();
      emitTag(tag);
      if (typeof window.emitTag === 'function') window.emitTag(tag);
      break;
    }
    case 'MESSAGE': {
      console.debug(eventName, rawData?.substring(0, 100) + '...');
      const data: SseMessageData = JSON.parse(rawData);
      switch (data.type) {
        case 'Batch':
          if (typeof window.emitBatch === 'function') window.emitBatch(data);
          break;
        case 'Notice':
          if (typeof window.emitNotice === 'function') {
            window.emitNotice(typeof data === 'object' ? (data.message ?? '') : String(data));
          }
          break;
        case 'CURL':
          if (typeof window.emitCurl === 'function') window.emitCurl(data);
          break;
        default:
          if (typeof window.emitMessage === 'function') window.emitMessage(data);
          break;
      }
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 멀티 탭 조정: BroadcastChannel + Web Locks 기반 리더 선출
// ─────────────────────────────────────────────────────────────────────────────

const channel: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

// 팔로워 탭: 리더가 fan-out한 SSE 이벤트를 수신
if (channel) {
  channel.onmessage = (e: MessageEvent<SseBroadcastMessage>) => {
    const { event, data } = e.data;
    handleSseEvent(event, data);
  };
}

/**
 * 리더 탭에서 실제 EventSource 연결을 생성하고, 수신한 이벤트를
 * 로컬 처리 + BroadcastChannel fan-out 한다.
 *
 * 리턴되는 Promise는 페이지가 unload될 때 resolve되어 Web Lock을 해제한다.
 */
function runAsLeader(): Promise<void> {
  return new Promise<void>((resolve) => {
    console.debug('%c<< SSE Leader 선출됨, EventSource 연결 시작', 'color: orange');

    const sse = new EventSource(ApiClient.buildUrl('/sse'));

    sse.onopen = () => {
      console.debug('%c<< SSE onopen', 'color: orange');
    };

    sse.onerror = (e: Event) => {
      console.error('%c<< SSE onerror', 'color: red', {
        event: e,
        readyState: sse.readyState,
        url: sse.url,
        withCredentials: sse.withCredentials,
        timestamp: new Date().toISOString(),
      });

      switch (sse.readyState) {
        case EventSource.CONNECTING:
          console.warn('SSE: 연결 시도 중...');
          break;
        case EventSource.OPEN:
          console.warn('SSE: 연결 중이지만 오류 발생');
          break;
        case EventSource.CLOSED:
          console.warn('SSE: 연결 닫힌 상태에서 오류 발생');
          break;
        default:
          console.warn('SSE: 알 수 없는 상태:', sse.readyState);
      }
    };

    sse.onmessage = (e: MessageEvent) => {
      console.debug('%c<< SSE onmessage', 'color: blue', e.type, e.data?.substring(0, 100) + '...');
    };

    // 각 명명 이벤트를 로컬 처리 + 다른 탭에 broadcast
    for (const eventName of SSE_EVENT_NAMES) {
      sse.addEventListener(eventName, (e: MessageEvent) => {
        handleSseEvent(eventName, e.data);
        if (channel) {
          channel.postMessage({ event: eventName, data: e.data } satisfies SseBroadcastMessage);
        }
      });
    }

    // 페이지 unload 시 EventSource 정리 후 락 해제(=Promise resolve)
    addBeforeunloadListener(() => {
      sse.close();
      resolve();
    });
  });
}

/**
 * 모든 탭이 호출. 첫 탭만 락을 획득해 리더가 되고, 나머지는 대기열에서 머문다.
 * 리더가 페이지를 닫으면 다음 대기 탭이 자동으로 리더를 승계한다.
 */
async function joinLeaderElection(): Promise<void> {
  await navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, async () => {
    await runAsLeader();
  });
}

const supportsLocks = typeof navigator !== 'undefined' && 'locks' in navigator && typeof navigator.locks?.request === 'function';

if (supportsLocks && channel) {
  void joinLeaderElection();
} else {
  // Fallback: Web Locks 또는 BroadcastChannel 미지원 환경 → 탭마다 EventSource 직접 보유 (기존 방식)
  console.warn('%c<< SSE: Web Locks/BroadcastChannel 미지원 환경, 탭별 EventSource로 동작', 'color: orange');
  void runAsLeader();
}

// ─────────────────────────────────────────────────────────────────────────────
// 글로벌 emit 핸들러
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 알림 메시지를 화면에 표시합니다.
 * @param data 메시지 문자열
 * @param warn 경고 스타일 여부
 */
window.emitNotice = (data: string, warn: boolean = false): void => {
  console.log('emitNotice', data);
  let noticeWrapper = document.querySelector('#notice-wrapper') as HTMLElement;
  if (noticeWrapper === null) {
    noticeWrapper = document.body.appendChild(document.createElement('div'));
    noticeWrapper.id = 'notice-wrapper';
  }
  const notice = noticeWrapper.appendChild(document.createElement('div'));
  notice.innerHTML = `<label>${data}</label>`;
  notice.classList.toggle('warn', warn);
  setTimeout(async () => {
    await notice.animate(
      [
        { opacity: 1, transform: 'scale(1.0)' },
        { opacity: 0, transform: 'scale(0)' },
      ],
      { duration: 400, iterations: 1 }
    ).finished;
    notice.remove();
  }, 1000 * 3);
};

/**
 * 메시지를 화면에 표시합니다.
 * @param datas 표시할 데이터들
 */
window.emitMessage = (...datas: unknown[]): void => {
  const messages = datas.map((data) => JSON.stringify(data).replace(/"/g, '')).join('<br>');
  void showAlert(messages, '알림');
};

// ─────────────────────────────────────────────────────────────────────────────
// 도메인별 DOM 갱신 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flay 업데이트 이벤트를 처리합니다.
 * @param flay 업데이트된 Flay 객체
 */
function emitFlay(flay: Flay): void {
  document.querySelectorAll('flay-page, flay-card, flay-video-player').forEach((flayElement) => {
    const element = flayElement as FlayElement;
    if (element.opus === flay.opus) {
      element.reload();
    }
  });
}

/**
 * Video 업데이트 이벤트를 처리합니다.
 * @param video 업데이트된 Video 객체
 */
function emitVideo(video: Video): void {
  document.querySelectorAll('flay-page, flay-card, flay-video-player').forEach((flayElement) => {
    const element = flayElement as FlayElement;
    if (element.opus === video.opus) {
      element.reload();
    }
  });
}

/**
 * Studio 업데이트 이벤트를 처리합니다.
 * @param studio 업데이트된 Studio 객체
 */
function emitStudio(studio: Studio): void {
  document.querySelectorAll('flay-page, flay-card, flay-video-player').forEach((flayElement) => {
    const element = flayElement as FlayElement;
    if (element.flay.studio === studio.name) {
      element.reload();
    }
  });
}

/**
 * Actress 업데이트 이벤트를 처리합니다.
 * @param actress 업데이트된 Actress 객체
 */
function emitActress(actress: Actress): void {
  document.querySelectorAll('flay-page, flay-card, flay-video-player').forEach((flayElement) => {
    const element = flayElement as FlayElement;
    if (element.flay.actressList.includes(actress.name)) {
      element.reload();
    }
  });
}

/**
 * Tag 업데이트 이벤트를 처리합니다.
 * @param _tag 업데이트된 Tag 객체 (사용되지 않음)
 */
function emitTag(_tag: Tag): void {
  document.querySelectorAll('flay-page, flay-card, flay-video-player').forEach((flayElement) => {
    const element = flayElement as FlayElement;
    element.reload();
  });
}
