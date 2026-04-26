import './inc/Page';
import './index.scss';

const portfolio = {
  /** 국내 주식 포트폴리오 */
  domesticStock: [
    {
      market: 'KS',
      stockCode: '066570',
      stockName: 'LG전자',
      averagePrice: 144000,
      quantityHeld: 1,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
    {
      market: 'KS',
      stockCode: '069500',
      stockName: 'KODEX 200',
      averagePrice: 79033,
      quantityHeld: 2,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
    {
      market: 'KS',
      stockCode: '395160',
      stockName: 'KODEX AI반도체',
      averagePrice: 27350,
      quantityHeld: 4866,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
  ],
  /** 퇴직연금 포트폴리오 */
  retirementPension: [
    {
      market: 'KS',
      stockCode: '0162Z0',
      stockName: 'RISE 삼성전자SK하이닉스채권혼합50',
      averagePrice: 10437,
      quantityHeld: 4172,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
    {
      market: 'KS', // ETF는 KS
      stockCode: '0163Y0',
      stockName: 'KoAct 코스닥액티브',
      averagePrice: 12684,
      quantityHeld: 1182,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
    {
      market: 'KS',
      stockCode: '102110',
      stockName: 'TIGER 200',
      averagePrice: 85087,
      quantityHeld: 987,
      currentPrice: NaN,
      evaluationAmount: NaN,
    },
  ],
};

const fetchStockData = async (stockCode: string, market: string) => {
  const res = await fetch(`/api/v1/stock-price/${stockCode}/${market}`);
  if (!res.ok) throw new Error('Failed to fetch stock data');
  return res.json();
};

window.addEventListener('DOMContentLoaded', async () => {
  for (const stock of [...portfolio.domesticStock, ...portfolio.retirementPension]) {
    try {
      const data = await fetchStockData(stock.stockCode, stock.market);
      stock.currentPrice = data.price ?? NaN;
      stock.evaluationAmount = stock.currentPrice * stock.quantityHeld;
    } catch (e) {
      console.error(`Failed to fetch data for ${stock.stockName} (${stock.stockCode})`, e);
    }
  }

  const portfolioEl = document.body.appendChild(document.createElement('div'));
  portfolioEl.id = 'portfolio';
  portfolioEl.innerHTML = `
    <h2>주식</h2>
    <table style="width: 800px;">
      <thead>
        <tr>
          <th style="text-align: left;">종목명</th>
          <th style="text-align: right;">평균 단가</th>
          <th style="text-align: right;">보유 수량</th>
          <th style="text-align: right;">현재가</th>
          <th style="text-align: right;">평가 금액</th>
        </tr>
      </thead>
      <tbody>
        ${portfolio.domesticStock
          .map(
            (stock) => `
          <tr>
            <td>${stock.stockName}</td>
            <td style="text-align: right; width: 120px;">${stock.averagePrice.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${stock.quantityHeld.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${isNaN(stock.currentPrice) ? '조회 실패' : stock.currentPrice.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${isNaN(stock.evaluationAmount) ? '조회 실패' : stock.evaluationAmount.toLocaleString()}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <th style="text-align: left;">총합계</th>
          <th colspan="4" style="text-align: right;">${portfolio.domesticStock.reduce((sum, stock) => sum + (isNaN(stock.evaluationAmount) ? 0 : stock.evaluationAmount), 0).toLocaleString()} </th>
        </tr>
      </tfoot>
    </table>

    <h2>퇴직연금</h2>
    <table style="width: 800px;">
      <thead>
        <tr>
          <th style="text-align: left;">종목명</th>
          <th style="text-align: right;">평균 단가</th>
          <th style="text-align: right;">보유 수량</th>
          <th style="text-align: right;">현재가</th>
          <th style="text-align: right;">평가 금액</th>
        </tr>
      </thead>
      <tbody>
        ${portfolio.retirementPension
          .map(
            (stock) => `
          <tr>
            <td>${stock.stockName}</td>
            <td style="text-align: right; width: 120px;">${stock.averagePrice.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${stock.quantityHeld.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${isNaN(stock.currentPrice) ? '조회 실패' : stock.currentPrice.toLocaleString()}</td>
            <td style="text-align: right; width: 120px;">${isNaN(stock.evaluationAmount) ? '조회 실패' : stock.evaluationAmount.toLocaleString()}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <th style="text-align: left;">총합계</th>
          <th colspan="4" style="text-align: right;">${portfolio.retirementPension.reduce((sum, stock) => sum + (isNaN(stock.evaluationAmount) ? 0 : stock.evaluationAmount), 0).toLocaleString()} </th>
        </tr>
      </tfoot>
    </table>
  `;
});
