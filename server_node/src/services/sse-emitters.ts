import { Request, Response } from 'express';
import { Actress } from '../domain/actress';
import { Flay } from '../domain/flay';
import { Studio } from '../domain/studio';
import { Tag } from '../domain/tag';
import { Video } from '../domain/video';
import { broadcast as pushBroadcast } from './web-push.service';

/** SSE 이벤트 타입 */
type SseEventType = 'CONNECT' | 'FLAY' | 'STUDIO' | 'VIDEO' | 'ACTRESS' | 'TAG' | 'MESSAGE';

/** SSE 메시지 타입 */
export type SseMessageType = 'Batch' | 'Notice' | 'CURL';

/** SSE 메시지 */
export interface SseMessage {
  type: SseMessageType;
  message: string;
}

/** SSE 클라이언트 */
interface SseClient {
  id: number;
  res: Response;
}

const TIMEOUT = 6 * 60 * 60 * 1000; // 6시간
let clientIdCounter = 0;
const clients: SseClient[] = [];

/**
 * 새 SSE 연결을 생성한다.
 * Java SseEmitters.create() 대응
 */
export function createSseConnection(req: Request, res: Response): void {
  const clientId = ++clientIdCounter;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const client: SseClient = { id: clientId, res };
  clients.push(client);
  console.log(`[SSE] #${clientId} 연결. 총 ${clients.length}개`);

  // CONNECT 이벤트 전송
  sendToClient(client, 'CONNECT', 'connected');

  // 타임아웃 설정
  const timeout = setTimeout(() => {
    console.warn(`[SSE] #${clientId} 타임아웃`);
    removeClient(client);
    res.end();
  }, TIMEOUT);

  // 연결 종료 시 정리
  req.on('close', () => {
    clearTimeout(timeout);
    removeClient(client);
    console.log(`[SSE] #${clientId} 연결 종료. 총 ${clients.length}개`);
  });
}

/**
 * 클라이언트를 제거한다.
 */
function removeClient(client: SseClient): void {
  const idx = clients.indexOf(client);
  if (idx !== -1) {
    clients.splice(idx, 1);
  }
}

/**
 * 개별 클라이언트에 이벤트를 전송한다.
 */
function sendToClient(client: SseClient, event: SseEventType, data: unknown): void {
  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    client.res.write(`event: ${event}\ndata: ${payload}\n\n`);
  } catch (e: any) {
    console.warn(`[SSE] #${client.id} 전송 실패: ${e.message}`);
    removeClient(client);
  }
}

/**
 * 모든 클라이언트에 이벤트를 전송한다.
 */
function broadcast(event: SseEventType, data: unknown): void {
  for (const client of [...clients]) {
    sendToClient(client, event, data);
  }
}

/**
 * 객체 타입에 따라 적절한 SSE 이벤트를 전송한다.
 * Java SseEmitters.send(Object) 대응
 */
export function sseSend(object: Flay | Studio | Video | Actress | Tag | SseMessage): void {
  if ('opus' in object && 'actressList' in object) {
    broadcast('FLAY', object);
  } else if ('opus' in object && 'play' in object) {
    broadcast('VIDEO', object);
  } else if ('name' in object && 'homepage' in object) {
    broadcast('STUDIO', object);
  } else if ('name' in object && 'localName' in object) {
    broadcast('ACTRESS', object);
  } else if ('id' in object && 'group' in object) {
    broadcast('TAG', object);
  } else if ('type' in object && 'message' in object) {
    const msg = object as SseMessage;
    // Notice 타입은 Web Push로도 발송
    if (msg.type === 'Notice') {
      pushBroadcast('🔔 중요 알림', msg.message, { type: msg.type, timestamp: Date.now() });
    }
    broadcast('MESSAGE', object);
  }
}

/**
 * 현재 연결된 SSE 클라이언트 수
 */
export function sseClientCount(): number {
  return clients.length;
}
