import './inc/Page';
import './page.collatz.scss';

// ── DOM 요소 ──
const numberInput = document.querySelector('#numberInput') as HTMLInputElement;
const calculateBtn = document.querySelector('#calculateBtn') as HTMLButtonElement;
const randomBtn = document.querySelector('#randomBtn') as HTMLButtonElement;
const canvas = document.querySelector('#collatzCanvas') as HTMLCanvasElement;
const emptyMessage = document.querySelector('#emptyMessage') as HTMLDivElement;
const infoSection = document.querySelector('#infoSection') as HTMLElement;
const sequenceSection = document.querySelector('#sequenceSection') as HTMLElement;
const sequenceList = document.querySelector('#sequenceList') as HTMLDivElement;
const startValueEl = document.querySelector('#startValue') as HTMLSpanElement;
const stepCountEl = document.querySelector('#stepCount') as HTMLSpanElement;
const maxValueEl = document.querySelector('#maxValue') as HTMLSpanElement;
const maxStepEl = document.querySelector('#maxStep') as HTMLSpanElement;

const ctx = canvas.getContext('2d')!;

// ── 콜라츠 수열 계산 ──
function computeCollatz(n: number): number[] {
  const seq: number[] = [n];
  while (n !== 1) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    seq.push(n);
  }
  return seq;
}

// ── CSS 변수값 읽기 ──
function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ── 그래프 그리기 ──
function drawGraph(sequence: number[]): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement!.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;

  const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...sequence);
  const steps = sequence.length - 1;

  // 색상
  const colorBg = getCssVar('--color-bg') || '#202020';
  const colorBorder = getCssVar('--color-border') || '#111111';
  const colorText = getCssVar('--color-text') || '#f1f1f1';
  const colorPrimary = getCssVar('--color-primary') || '#4285f4';
  const colorGrid = getCssVar('--color-gray-b3') || '#3c3c3c';
  const colorPeak = getCssVar('--color-orange') || '#ffa500';

  // 배경
  ctx.fillStyle = colorBg;
  ctx.fillRect(0, 0, W, H);

  // ── 격자선 ──
  ctx.strokeStyle = colorGrid;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 3]);

  const yGridCount = 5;
  for (let i = 0; i <= yGridCount; i++) {
    const y = PAD.top + (plotH / yGridCount) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + plotW, y);
    ctx.stroke();

    // Y축 레이블
    const val = Math.round(maxVal - (maxVal / yGridCount) * i);
    ctx.fillStyle = colorText;
    ctx.font = `11px D2Coding, monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(val.toLocaleString(), PAD.left - 6, y + 4);
  }
  ctx.setLineDash([]);

  // ── 좌표 변환 함수 ──
  const toX = (step: number) => PAD.left + (step / steps) * plotW;
  const toY = (val: number) => PAD.top + plotH - (val / maxVal) * plotH;

  // ── 선 아래 그라디언트 채우기 ──
  const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
  gradient.addColorStop(0, colorPrimary + '55');
  gradient.addColorStop(1, colorPrimary + '05');

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(sequence[0]!));
  sequence.forEach((val, i) => ctx.lineTo(toX(i), toY(val)));
  ctx.lineTo(toX(steps), PAD.top + plotH);
  ctx.lineTo(toX(0), PAD.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // ── 꺾은선 그래프 ──
  ctx.strokeStyle = colorPrimary;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(sequence[0]!));
  sequence.forEach((val, i) => ctx.lineTo(toX(i), toY(val)));
  ctx.stroke();

  // ── 최댓값 점 강조 ──
  const peakIdx = sequence.indexOf(maxVal);
  ctx.fillStyle = colorPeak;
  ctx.beginPath();
  ctx.arc(toX(peakIdx), toY(maxVal), 5, 0, Math.PI * 2);
  ctx.fill();

  // 최댓값 레이블
  ctx.fillStyle = colorPeak;
  ctx.font = `bold 11px D2Coding, monospace`;
  ctx.textAlign = 'center';
  const labelX = Math.max(PAD.left + 30, Math.min(W - PAD.right - 30, toX(peakIdx)));
  ctx.fillText(`max: ${maxVal.toLocaleString()}`, labelX, toY(maxVal) - 10);

  // ── 시작점·끝점 ──
  ctx.fillStyle = colorPrimary;
  ctx.beginPath();
  ctx.arc(toX(0), toY(sequence[0]!), 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(toX(steps), toY(1), 4, 0, Math.PI * 2);
  ctx.fill();

  // ── X축 레이블 ──
  ctx.fillStyle = colorText;
  ctx.font = `11px D2Coding, monospace`;
  ctx.textAlign = 'center';

  const xLabelCount = Math.min(steps, 10);
  for (let i = 0; i <= xLabelCount; i++) {
    const step = Math.round((steps / xLabelCount) * i);
    ctx.fillText(String(step), toX(step), H - PAD.bottom + 16);
  }

  // ── 테두리 ──
  ctx.strokeStyle = colorBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);

  // ── 축 레이블 ──
  ctx.fillStyle = colorText;
  ctx.font = `11px D2Coding, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('단계 (Step)', PAD.left + plotW / 2, H - 4);
}

// ── 수열 태그 렌더링 ──
function renderSequence(sequence: number[]): void {
  const maxVal = Math.max(...sequence);
  sequenceList.innerHTML = '';
  sequence.forEach((val) => {
    const span = document.createElement('span');
    span.className = 'seq-item';
    span.textContent = val.toLocaleString();
    if (val === maxVal) span.classList.add('peak');
    if (val === 1) span.classList.add('one');
    sequenceList.appendChild(span);
  });
}

// ── 메인 계산 및 렌더링 ──
function run(n: number): void {
  if (!Number.isInteger(n) || n < 1) {
    alert('1 이상의 양의 정수를 입력하세요.');
    return;
  }

  const sequence = computeCollatz(n);
  const maxVal = Math.max(...sequence);
  const maxIdx = sequence.indexOf(maxVal);

  // 정보 카드 업데이트
  startValueEl.textContent = n.toLocaleString();
  stepCountEl.textContent = String(sequence.length - 1);
  maxValueEl.textContent = maxVal.toLocaleString();
  maxStepEl.textContent = String(maxIdx);

  // 섹션 표시
  emptyMessage.hidden = true;
  infoSection.hidden = false;
  sequenceSection.hidden = false;

  drawGraph(sequence);
  renderSequence(sequence);
}

// ── 이벤트 ──
calculateBtn.addEventListener('click', () => {
  const n = parseInt(numberInput.value, 10);
  run(n);
});

numberInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calculateBtn.click();
});

randomBtn.addEventListener('click', () => {
  const n = Math.floor(Math.random() * 9999) + 2;
  numberInput.value = String(n);
  run(n);
});

// 리사이즈 시 다시 그리기
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!infoSection.hidden) {
      const n = parseInt(numberInput.value, 10);
      if (n >= 1) {
        const sequence = computeCollatz(n);
        drawGraph(sequence);
      }
    }
  }, 150);
});
