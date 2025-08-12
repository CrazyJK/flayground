import ApiClient from '@lib/ApiClient';
import FlayFetch, { Actress, Flay, Studio, Tag, Video } from '@lib/FlayFetch';
import '@lib/SseConnector.scss';
import { addBeforeunloadListener } from '@lib/windowAddEventListener';

/**
 * Server-Sent Events를 통한 실시간 데이터 동기화 모듈
 *
 * 서버에서 발생하는 Flay, Studio, Video, Actress, Tag 등의 변경사항을
 * 실시간으로 수신하여 클라이언트 UI를 업데이트합니다.
 *
 * @see https://developer.mozilla.org/ko/docs/Web/API/Server-sent_events
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

/** EventSource 인스턴스 생성 및 기본 이벤트 핸들러 설정 */
const sse = new EventSource(ApiClient.buildUrl('/sse'));

addBeforeunloadListener(() => sse.close());

sse.onopen = (e: Event) => {
  console.debug('<< onopen', e);
};

sse.onerror = (e: Event) => {
  console.debug('<< onerror', e);
};

sse.onmessage = (e: MessageEvent) => {
  console.debug('<< onmessage', e);
};

/*
 * Event name: CONNECT, FLAY, STUDIO, VIDEO, ACTRESS, TAG, MESSAGE
 */

sse.addEventListener('heartbeat', (e: MessageEvent) => {
  // 하트비트 무시 (연결 유지용)
  console.debug('<< Heartbeat received', e);
});

sse.addEventListener('CONNECT', (e: MessageEvent) => {
  const { data: receivedConnectData } = e;
  console.debug('<< connected', receivedConnectData);
});

sse.addEventListener('FLAY', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const flay: Flay = JSON.parse(e.data);
  FlayFetch.clear(flay.opus);
  emitFlay(flay);
  if (typeof window.emitFlay === 'function') window.emitFlay(flay);
});

sse.addEventListener('STUDIO', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const studio: Studio = JSON.parse(e.data);
  emitStudio(studio);
  if (typeof window.emitStudio === 'function') window.emitStudio(studio);
});

sse.addEventListener('VIDEO', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const video: Video = JSON.parse(e.data);
  FlayFetch.clear(video.opus);
  emitVideo(video);
  if (typeof window.emitVideo === 'function') window.emitVideo(video);
});

sse.addEventListener('ACTRESS', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const actress: Actress = JSON.parse(e.data);
  emitActress(actress);
  if (typeof window.emitActress === 'function') window.emitActress(actress);
});

sse.addEventListener('TAG', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const tag: Tag = JSON.parse(e.data);
  FlayFetch.clearTag();
  emitTag(tag);
  if (typeof window.emitTag === 'function') window.emitTag(tag);
});

sse.addEventListener('MESSAGE', (e: MessageEvent) => {
  console.debug(e.type, e.data);
  const data: SseMessageData = JSON.parse(e.data);
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
});

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

  let messageWrapper = document.querySelector('#message-wrapper') as HTMLElement;
  if (messageWrapper === null) {
    messageWrapper = document.body.appendChild(document.createElement('div'));
    messageWrapper.id = 'message-wrapper';
    messageWrapper.appendChild(document.createElement('div')).id = 'message';
    messageWrapper.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      target.classList.remove('show');
      const messageElement = target.querySelector('#message') as HTMLElement;
      if (messageElement) {
        messageElement.textContent = '';
      }
    });
  }
  const messageElement = messageWrapper.querySelector('#message') as HTMLElement;
  if (messageElement) {
    messageElement.innerHTML += `<label>${messages}</label>`;
  }
  messageWrapper.classList.add('show');
};

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

/**
 * Server-Sent Events 커넥터 모듈을 내보냅니다.
 * @default EventSource 인스턴스
 */
export default sse;
