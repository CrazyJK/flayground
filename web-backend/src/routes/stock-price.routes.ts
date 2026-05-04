import { Router } from 'express';

const router = Router();

/* ══════════════════════════════════
    주식 현재가 프록시
══════════════════════════════════ */

// ─── 타입 정의 ────────────────────────────────────────────
type Market = 'KS' | 'KQ';

interface PriceData {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  timestamp: string;
}

interface YahooMeta {
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose: number;
  currency: string;
  marketState: string;
  regularMarketTime: number;
}

interface YahooResponse {
  chart: {
    result: Array<{ meta: YahooMeta }> | null;
    error: { code: string; description: string } | null;
  };
}

// ─── 상수 ─────────────────────────────────────────────────
const MARKET_SUFFIX: Record<Market, string> = {
  KS: '.KS', // 코스피 (주식, ETF)
  KQ: '.KQ', // 코스닥
};

/**
 * @openapi
 * /stock-price/{code}:
 *   get:
 *     tags: [FinancialNote]
 *     summary: 주식 현재가 조회 (CORS 우회 프록시)
 */
router.get('/stock-price/:code/:market', async (req, res) => {
  const { code, market } = req.params;
  const marketUpper = market?.toUpperCase() as Market | undefined;
  const suffix = marketUpper ? (MARKET_SUFFIX[marketUpper] ?? '') : '';
  const symbol = `${code}${suffix}`;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Yahoo Finance 오류: ${response.status}`);

    const json = (await response.json()) as YahooResponse;
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('데이터 없음');

    const { meta } = result;
    const returnData: PriceData = {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose,
      change: +(meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2),
      changePercent: +(((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2),
      currency: meta.currency,
      marketState: meta.marketState,
      timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
    };
    res.json(returnData);
  } catch {
    res.status(502).json({ error: '주가 조회 실패' });
  }
});

export default router;
