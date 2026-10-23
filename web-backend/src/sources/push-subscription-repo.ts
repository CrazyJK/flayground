import Database from 'better-sqlite3';
import path from 'path';

/** Push 구독 정보 */
export interface PushSubscription {
  id?: number;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
  updatedAt: string;
}

/** Push 구독 DTO (클라이언트에서 받는 형식) */
export interface PushSubscriptionDTO {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

let db: Database.Database;

/**
 * SQLite DB를 초기화하고 테이블을 생성한다.
 * Java H2 + JPA PushSubscriptionRepository 대응
 */
function init(): void {
  const dbPath = path.resolve(__dirname, '..', '..', 'data', 'push-subscriptions.db');

  // data 디렉토리 생성
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscription (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  const count = (db.prepare('SELECT COUNT(*) as cnt FROM push_subscription').get() as any).cnt;
  console.log(`[PushSubscription] ${count} 건 - ${dbPath}`);
}

/** 모든 구독 목록 */
function findAll(): PushSubscription[] {
  return db.prepare('SELECT id, user_id as userId, endpoint, p256dh, auth, created_at as createdAt, updated_at as updatedAt FROM push_subscription').all() as PushSubscription[];
}

/** 사용자 ID로 조회 */
function findByUserId(userId: string): PushSubscription[] {
  return db.prepare('SELECT id, user_id as userId, endpoint, p256dh, auth, created_at as createdAt, updated_at as updatedAt FROM push_subscription WHERE user_id = ?').all(userId) as PushSubscription[];
}

/** endpoint로 조회 */
function findByEndpoint(endpoint: string): PushSubscription | undefined {
  return db.prepare('SELECT id, user_id as userId, endpoint, p256dh, auth, created_at as createdAt, updated_at as updatedAt FROM push_subscription WHERE endpoint = ?').get(endpoint) as PushSubscription | undefined;
}

/** 구독 등록 또는 업데이트 */
function subscribe(userId: string, dto: PushSubscriptionDTO): PushSubscription {
  const existing = findByEndpoint(dto.endpoint);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare('UPDATE push_subscription SET user_id = ?, p256dh = ?, auth = ?, updated_at = ? WHERE endpoint = ?').run(userId, dto.keys.p256dh, dto.keys.auth, now, dto.endpoint);
    return { ...existing, userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth, updatedAt: now };
  }

  const result = db.prepare('INSERT INTO push_subscription (user_id, endpoint, p256dh, auth, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(userId, dto.endpoint, dto.keys.p256dh, dto.keys.auth, now, now);

  return {
    id: Number(result.lastInsertRowid),
    userId,
    endpoint: dto.endpoint,
    p256dh: dto.keys.p256dh,
    auth: dto.keys.auth,
    createdAt: now,
    updatedAt: now,
  };
}

/** endpoint로 삭제 */
function deleteByEndpoint(endpoint: string): void {
  db.prepare('DELETE FROM push_subscription WHERE endpoint = ?').run(endpoint);
}

/** 사용자 ID로 모든 구독 삭제 */
function deleteByUserId(userId: string): void {
  db.prepare('DELETE FROM push_subscription WHERE user_id = ?').run(userId);
}

/** DB 연결 닫기 */
function close(): void {
  if (db) db.close();
}

export const pushSubscriptionRepo = {
  init,
  findAll,
  findByUserId,
  findByEndpoint,
  subscribe,
  deleteByEndpoint,
  deleteByUserId,
  close,
};
