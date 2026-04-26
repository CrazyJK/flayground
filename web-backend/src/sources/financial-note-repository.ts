import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Account, Institution, InstitutionType, Snapshot, SnapshotEntry, StockItem } from '../domain/financial-note';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database;

/**
 * SQLite DB를 초기화하고 테이블을 생성한다.
 */
function init(): void {
  const dbPath = path.resolve(__dirname, '..', '..', 'data', 'financial-note.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS fn_institution (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('bank', 'insurance', 'stock')),
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS fn_account (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id INTEGER NOT NULL REFERENCES fn_institution(id),
      name           TEXT NOT NULL,
      account_number TEXT NOT NULL DEFAULT '',
      amount         REAL NOT NULL DEFAULT 0,
      sort           INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS fn_stock_item (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES fn_account(id),
      code       TEXT NOT NULL,
      name       TEXT NOT NULL DEFAULT '',
      buy_price  REAL NOT NULL DEFAULT 0,
      buy_qty    REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS fn_snapshot (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE TABLE IF NOT EXISTS fn_snapshot_entry (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL REFERENCES fn_snapshot(id),
      account_id  INTEGER NOT NULL,
      name        TEXT NOT NULL,
      amount      REAL NOT NULL DEFAULT 0,
      inst_name   TEXT NOT NULL,
      inst_type   TEXT NOT NULL
    );
  `);
  const instCount = (db.prepare('SELECT COUNT(*) as cnt FROM fn_institution').get() as any).cnt;
  console.log(`[FinancialNote] 금융기관 ${instCount} 건 - ${dbPath}`);
}

/* ── 금융기관 ── */

/** 모든 금융기관 목록 */
function getInstitutions(): Institution[] {
  return db.prepare('SELECT id, name, type, sort FROM fn_institution ORDER BY sort, id').all() as Institution[];
}

/** 금융기관 추가 */
function addInstitution(name: string, type: InstitutionType, sort = 0): Institution {
  const result = db.prepare('INSERT INTO fn_institution (name, type, sort) VALUES (?, ?, ?)').run(name, type, sort);
  return { id: result.lastInsertRowid as number, name, type, sort };
}

/** 금융기관 삭제 (연관 계좌/종목/스냅샷 항목도 삭제) */
function deleteInstitution(id: number): void {
  const accounts = db.prepare('SELECT id FROM fn_account WHERE institution_id = ?').all(id) as { id: number }[];
  for (const acc of accounts) {
    db.prepare('DELETE FROM fn_stock_item WHERE account_id = ?').run(acc.id);
  }
  db.prepare('DELETE FROM fn_account WHERE institution_id = ?').run(id);
  db.prepare('DELETE FROM fn_institution WHERE id = ?').run(id);
}

/* ── 계좌 ── */

/** 특정 기관의 계좌 목록 */
function getAccountsByInstitution(institutionId: number): Account[] {
  return db.prepare('SELECT id, institution_id as institutionId, name, account_number as accountNumber, amount, sort FROM fn_account WHERE institution_id = ? ORDER BY sort, id').all(institutionId) as Account[];
}

/** 전체 계좌 목록 */
function getAllAccounts(): Account[] {
  return db.prepare('SELECT id, institution_id as institutionId, name, account_number as accountNumber, amount, sort FROM fn_account ORDER BY sort, id').all() as Account[];
}

/** 계좌 추가 */
function addAccount(institutionId: number, name: string, accountNumber = '', amount = 0, sort = 0): Account {
  const result = db.prepare('INSERT INTO fn_account (institution_id, name, account_number, amount, sort) VALUES (?, ?, ?, ?, ?)').run(institutionId, name, accountNumber, amount, sort);
  return { id: result.lastInsertRowid as number, institutionId, name, accountNumber, amount, sort };
}

/** 계좌 금액 수정 */
function updateAccountAmount(id: number, amount: number): void {
  db.prepare('UPDATE fn_account SET amount = ? WHERE id = ?').run(amount, id);
}

/** 계좌 삭제 */
function deleteAccount(id: number): void {
  db.prepare('DELETE FROM fn_stock_item WHERE account_id = ?').run(id);
  db.prepare('DELETE FROM fn_account WHERE id = ?').run(id);
}

/* ── 증권 종목 ── */

/** 계좌별 종목 목록 */
function getStockItems(accountId: number): StockItem[] {
  return db.prepare('SELECT id, account_id as accountId, code, name, buy_price as buyPrice, buy_qty as buyQty FROM fn_stock_item WHERE account_id = ?').all(accountId) as StockItem[];
}

/** 종목 추가 */
function addStockItem(accountId: number, code: string, name: string, buyPrice: number, buyQty: number): StockItem {
  const result = db.prepare('INSERT INTO fn_stock_item (account_id, code, name, buy_price, buy_qty) VALUES (?, ?, ?, ?, ?)').run(accountId, code, name, buyPrice, buyQty);
  return { id: result.lastInsertRowid as number, accountId, code, name, buyPrice, buyQty };
}

/** 종목 삭제 */
function deleteStockItem(id: number): void {
  db.prepare('DELETE FROM fn_stock_item WHERE id = ?').run(id);
}

/* ── 스냅샷 ── */

/** 스냅샷 날짜 목록 (최신순) */
function getSnapshotDates(): string[] {
  const rows = db.prepare('SELECT date FROM fn_snapshot ORDER BY date DESC').all() as { date: string }[];
  return rows.map((r) => r.date);
}

/** 특정 날짜 스냅샷 조회 */
function getSnapshot(date: string): Snapshot | null {
  const snap = db.prepare('SELECT id, date, created_at as createdAt FROM fn_snapshot WHERE date = ?').get(date) as { id: number; date: string; createdAt: string } | undefined;
  if (!snap) return null;
  const entries = db.prepare('SELECT account_id as accountId, name, amount, inst_name as instName, inst_type as instType FROM fn_snapshot_entry WHERE snapshot_id = ?').all(snap.id) as SnapshotEntry[];
  return { ...snap, entries };
}

/** 모든 스냅샷 날짜 및 기관별 합계 조회 (차트용) */
function getSnapshotSummaries(): { date: string; instName: string; total: number }[] {
  return db
    .prepare(
      `
      SELECT s.date, e.inst_name as instName, SUM(e.amount) as total
      FROM fn_snapshot s
      JOIN fn_snapshot_entry e ON e.snapshot_id = s.id
      GROUP BY s.date, e.inst_name
      ORDER BY s.date
    `
    )
    .all() as { date: string; instName: string; total: number }[];
}

/** 스냅샷 저장 (같은 날짜면 덮어씀) */
function saveSnapshot(date: string, entries: SnapshotEntry[]): void {
  const existing = db.prepare('SELECT id FROM fn_snapshot WHERE date = ?').get(date) as { id: number } | undefined;
  let snapId: number;
  if (existing) {
    snapId = existing.id;
    db.prepare('DELETE FROM fn_snapshot_entry WHERE snapshot_id = ?').run(snapId);
  } else {
    const result = db.prepare('INSERT INTO fn_snapshot (date) VALUES (?)').run(date);
    snapId = result.lastInsertRowid as number;
  }
  const insertEntry = db.prepare('INSERT INTO fn_snapshot_entry (snapshot_id, account_id, name, amount, inst_name, inst_type) VALUES (?, ?, ?, ?, ?, ?)');
  for (const e of entries) {
    insertEntry.run(snapId, e.accountId, e.name, e.amount, e.instName, e.instType);
  }
}

/** DB 인스턴스 노출 (라우트에서 직접 쿼리가 필요한 경우) */
function getDb(): Database.Database {
  return db;
}

/** 전체 데이터 초기화 (기관/계좌/종목/스냅샷 전체 삭제) */
function reset(): void {
  db.exec(`
    DELETE FROM fn_snapshot_entry;
    DELETE FROM fn_snapshot;
    DELETE FROM fn_stock_item;
    DELETE FROM fn_account;
    DELETE FROM fn_institution;
  `);
}

export const financialNoteRepository = {
  init,
  getInstitutions,
  addInstitution,
  deleteInstitution,
  getAccountsByInstitution,
  getAllAccounts,
  addAccount,
  updateAccountAmount,
  deleteAccount,
  getStockItems,
  addStockItem,
  deleteStockItem,
  getSnapshotDates,
  getSnapshot,
  getSnapshotSummaries,
  saveSnapshot,
  getDb,
  reset,
};
