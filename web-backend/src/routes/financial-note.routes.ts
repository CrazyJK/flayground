import { Router } from 'express';
import { InstitutionType, SnapshotEntry } from '../domain/financial-note';
import { financialNoteRepository as repo } from '../sources/financial-note-repository';

const router = Router();

/* ══════════════════════════════════
   금융기관
══════════════════════════════════ */

/**
 * @openapi
 * /financial-note/institutions:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 금융기관 목록 조회
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/financial-note/institutions', (_req, res) => {
  res.json(repo.getInstitutions());
});

/**
 * @openapi
 * /financial-note/institutions:
 *   post:
 *     tags: [FinancialNote]
 *     summary: 금융기관 추가
 */
router.post('/financial-note/institutions', (req, res) => {
  const { name, type, sort } = req.body as { name: string; type: InstitutionType; sort?: number };
  if (!name || !type) {
    res.status(400).json({ error: 'name, type 필수' });
    return;
  }
  res.status(201).json(repo.addInstitution(name, type, sort ?? 0));
});

/**
 * @openapi
 * /financial-note/institutions/{id}:
 *   delete:
 *     tags: [FinancialNote]
 *     summary: 금융기관 삭제
 */
router.delete('/financial-note/institutions/:id', (req, res) => {
  repo.deleteInstitution(Number(req.params.id));
  res.status(204).send();
});

/* ══════════════════════════════════
   계좌
══════════════════════════════════ */

/**
 * @openapi
 * /financial-note/accounts:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 전체 계좌 목록
 */
router.get('/financial-note/accounts', (_req, res) => {
  res.json(repo.getAllAccounts());
});

/**
 * @openapi
 * /financial-note/institutions/{institutionId}/accounts:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 기관별 계좌 목록
 */
router.get('/financial-note/institutions/:institutionId/accounts', (req, res) => {
  res.json(repo.getAccountsByInstitution(Number(req.params.institutionId)));
});

/**
 * @openapi
 * /financial-note/accounts:
 *   post:
 *     tags: [FinancialNote]
 *     summary: 계좌 추가
 */
router.post('/financial-note/accounts', (req, res) => {
  const { institutionId, name, accountNumber, amount, sort } = req.body as {
    institutionId: number;
    name: string;
    accountNumber?: string;
    amount?: number;
    sort?: number;
  };
  if (!institutionId || !name) {
    res.status(400).json({ error: 'institutionId, name 필수' });
    return;
  }
  res.status(201).json(repo.addAccount(institutionId, name, accountNumber ?? '', amount ?? 0, sort ?? 0));
});

/**
 * @openapi
 * /financial-note/accounts/{id}/amount:
 *   put:
 *     tags: [FinancialNote]
 *     summary: 계좌 금액 수정
 */
router.put('/financial-note/accounts/:id/amount', (req, res) => {
  const { amount } = req.body as { amount: number };
  if (amount === undefined || amount === null) {
    res.status(400).json({ error: 'amount 필수' });
    return;
  }
  repo.updateAccountAmount(Number(req.params.id), amount);
  res.json({ id: Number(req.params.id), amount });
});

/**
 * @openapi
 * /financial-note/accounts/{id}:
 *   delete:
 *     tags: [FinancialNote]
 *     summary: 계좌 삭제
 */
router.delete('/financial-note/accounts/:id', (req, res) => {
  repo.deleteAccount(Number(req.params.id));
  res.status(204).send();
});

/* ══════════════════════════════════
   증권 종목
══════════════════════════════════ */

/**
 * @openapi
 * /financial-note/accounts/{id}/stock-items:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 계좌별 종목 목록
 */
router.get('/financial-note/accounts/:id/stock-items', (req, res) => {
  res.json(repo.getStockItems(Number(req.params.id)));
});

/**
 * @openapi
 * /financial-note/accounts/{id}/stock-items:
 *   post:
 *     tags: [FinancialNote]
 *     summary: 종목 추가
 */
router.post('/financial-note/accounts/:id/stock-items', (req, res) => {
  const accountId = Number(req.params.id);
  const { code, name, buyPrice, buyQty } = req.body as { code: string; name?: string; buyPrice: number; buyQty: number };
  if (!code || buyPrice === undefined || buyQty === undefined) {
    res.status(400).json({ error: 'code, buyPrice, buyQty 필수' });
    return;
  }
  res.status(201).json(repo.addStockItem(accountId, code, name ?? '', buyPrice, buyQty));
});

/**
 * @openapi
 * /financial-note/stock-items/{id}:
 *   delete:
 *     tags: [FinancialNote]
 *     summary: 종목 삭제
 */
router.delete('/financial-note/stock-items/:id', (req, res) => {
  repo.deleteStockItem(Number(req.params.id));
  res.status(204).send();
});

/* ══════════════════════════════════
   주식 현재가 프록시
══════════════════════════════════ */

/**
 * @openapi
 * /financial-note/stock-price/{code}:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 네이버 주식 현재가 조회 (CORS 우회 프록시)
 */
router.get('/financial-note/stock-price/:code', async (req, res) => {
  const { code } = req.params;
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: '종목코드는 6자리 숫자' });
    return;
  }
  try {
    const response = await fetch(`https://m.stock.naver.com/api/stock/${code}/integration`);
    if (!response.ok) {
      res.status(502).json({ error: '네이버 API 오류' });
      return;
    }
    const data = (await response.json()) as any;
    const price = Number(data?.stockInfo?.closePrice ?? data?.stockInfo?.currentPrice ?? 0);
    res.json({ code, price });
  } catch {
    res.status(502).json({ error: '주가 조회 실패' });
  }
});

/* ══════════════════════════════════
   스냅샷
══════════════════════════════════ */

/**
 * @openapi
 * /financial-note/snapshots:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 스냅샷 날짜 목록
 */
router.get('/financial-note/snapshots', (_req, res) => {
  res.json(repo.getSnapshotDates());
});

/**
 * @openapi
 * /financial-note/snapshots/summaries:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 스냅샷 날짜별 기관별 합계 (차트용)
 */
router.get('/financial-note/snapshots/summaries', (_req, res) => {
  res.json(repo.getSnapshotSummaries());
});

/**
 * @openapi
 * /financial-note/snapshots/{date}:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 특정 날짜 스냅샷 조회
 */
router.get('/financial-note/snapshots/:date', (req, res) => {
  const snap = repo.getSnapshot(req.params.date);
  if (!snap) {
    res.status(404).json({ error: '스냅샷 없음' });
    return;
  }
  res.json(snap);
});

/**
 * @openapi
 * /financial-note/snapshots:
 *   post:
 *     tags: [FinancialNote]
 *     summary: 스냅샷 저장
 */
router.post('/financial-note/snapshots', (req, res) => {
  const { date, entries } = req.body as { date: string; entries: SnapshotEntry[] };
  if (!date || !Array.isArray(entries)) {
    res.status(400).json({ error: 'date, entries 필수' });
    return;
  }
  repo.saveSnapshot(date, entries);
  res.status(201).json({ date });
});

/* ══════════════════════════════════
   CSV Import
══════════════════════════════════ */

/**
 * CSV 한 행을 파싱한다. 콤마 포함 값은 따옴표로 감싸져 있다.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 기관명으로 타입을 자동 감지한다.
 */
function detectInstitutionType(name: string): InstitutionType {
  const lower = name.toLowerCase();
  if (/생명|보험|라이프|metlife/i.test(name)) return 'insurance';
  if (/은행|뱅크|bank/i.test(lower)) return 'bank';
  return 'stock';
}

/**
 * @openapi
 * /financial-note/import/institutions:
 *   post:
 *     tags: [FinancialNote]
 *     summary: CSV로 기관/계좌 초기 데이터 import
 */
router.post('/financial-note/import/institutions', (req, res) => {
  const { csv } = req.body as { csv: string };
  if (!csv) {
    res.status(400).json({ error: 'csv 필수' });
    return;
  }

  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  // 첫 행은 헤더(기관,계좌들,...) — 건너뜀
  let created = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const instName = cols[0].trim();
    if (!instName) continue;

    const existing = repo.getInstitutions().find((inst) => inst.name === instName);
    if (existing) {
      // 계좌만 추가
      const existingAccounts = repo.getAccountsByInstitution(existing.id).map((a) => a.name);
      for (let j = 1; j < cols.length; j++) {
        const accName = cols[j].trim();
        if (accName && !existingAccounts.includes(accName)) {
          repo.addAccount(existing.id, accName, '', 0, j - 1);
          created++;
        }
      }
      skipped++;
      continue;
    }

    const type = detectInstitutionType(instName);
    const inst = repo.addInstitution(instName, type, i - 1);
    for (let j = 1; j < cols.length; j++) {
      const accName = cols[j].trim();
      if (accName) {
        repo.addAccount(inst.id, accName, '', 0, j - 1);
        created++;
      }
    }
    created++;
  }

  res.json({ message: `import 완료`, created, skipped });
});

/**
 * @openapi
 * /financial-note/import/snapshots:
 *   post:
 *     tags: [FinancialNote]
 *     summary: CSV로 스냅샷 초기 데이터 import
 */
router.post('/financial-note/import/snapshots', (req, res) => {
  const { csv } = req.body as { csv: string };
  if (!csv) {
    res.status(400).json({ error: 'csv 필수' });
    return;
  }

  const rawLines = csv.split(/\r?\n/);
  // 1행: 기관명 (스패닝)
  // 2행: Date + 계좌명
  // 3행~: 데이터
  if (rawLines.length < 3) {
    res.status(400).json({ error: 'CSV 형식 오류' });
    return;
  }

  const headerCols = parseCsvLine(rawLines[1]); // Date, acct1, acct2, ...
  const accountNames = headerCols.slice(1); // Date 제외

  // 계좌명 → Account 매핑
  const allAccounts = repo.getAllAccounts();
  const allInstitutions = repo.getInstitutions();
  const instMap = new Map(allInstitutions.map((i) => [i.id, i]));

  // 계좌명으로 매칭 (동일한 계좌명이 여러 기관에 있을 수 있으므로 배열)
  const accountByName = new Map<string, (typeof allAccounts)[0]>();
  for (const acc of allAccounts) {
    accountByName.set(acc.name, acc);
  }

  let imported = 0;
  let failed = 0;

  for (let i = 2; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    const date = cols[0].trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const entries: SnapshotEntry[] = [];
    for (let j = 0; j < accountNames.length; j++) {
      const accName = accountNames[j];
      if (!accName) continue;
      const rawVal = cols[j + 1]?.trim() ?? '';
      if (!rawVal) continue;
      const amount = parseFloat(rawVal.replace(/,/g, ''));
      if (isNaN(amount)) continue;

      const acc = accountByName.get(accName);
      if (!acc) continue;
      const inst = instMap.get(acc.institutionId);
      if (!inst) continue;

      entries.push({
        accountId: acc.id,
        name: accName,
        amount,
        instName: inst.name,
        instType: inst.type,
      });
    }

    if (entries.length > 0) {
      repo.saveSnapshot(date, entries);
      imported++;
    } else {
      failed++;
    }
  }

  res.json({ message: `스냅샷 import 완료`, imported, failed });
});

export default router;
