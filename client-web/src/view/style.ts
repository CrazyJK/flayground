import arrow from '@svg/arrow';
import basketSVG from '@svg/basket';
import cloudDownSVG from '@svg/cloudDown';
import controlsSVG from '@svg/controls';
import editSVG from '@svg/edit';
import favoriteSVG from '@svg/favorite';
import folderSVG from '@svg/folder';
import jsonSVG from '@svg/json';
import newWindowSVG from '@svg/newWindow';
import noFavoriteSVG from '@svg/noFavorite';
import playSVG from '@svg/play';
import rankSVG from '@svg/ranks';
import subtitlesSVG from '@svg/subtitles';
import tagSVG from '@svg/tag';
import themeSVG from '@svg/themes';
import torrentSVG from '@svg/torrent';
import trashBinSVG from '@svg/trashBin';
import vaginaSVG from '@svg/vagina';
import weatherSVG from '@svg/weathers';
import windowButton from '@svg/windowButton';
import youtubeSVG from '@svg/youtube';
import './style.scss';

// Element prototype 확장을 위한 타입 선언
declare global {
  interface Element {
    /** SVG 문자열을 label 엘리먼트로 감싸서 추가 */
    appendSVG(svg: string): Element;
    /** 이미지 소스를 label로 감싸진 img 엘리먼트로 추가 */
    appendIMG(imgSrc: string): Element;
  }
}

/**
 * Element에 SVG 문자열을 label로 감싸서 추가하는 프로토타입 메서드
 * @param svg - 추가할 SVG 문자열
 * @returns 메서드 체이닝을 위한 Element 인스턴스
 */
Element.prototype.appendSVG = function (svg: string): Element {
  this.appendChild(document.createElement('label')).innerHTML = svg;
  return this;
};

/**
 * Element에 이미지를 label로 감싸서 추가하는 프로토타입 메서드
 * @param imgSrc - 이미지 소스 URL
 * @returns 메서드 체이닝을 위한 Element 인스턴스
 */
Element.prototype.appendIMG = function (imgSrc: string): Element {
  this.appendChild(document.createElement('label')).appendChild(new Image()).src = imgSrc;
  return this;
};

// SVG 컨테이너에 모든 SVG 아이콘들을 추가
const svgContainer = document.getElementById('svgContainer');
if (svgContainer) {
  svgContainer
    .appendSVG(subtitlesSVG)
    .appendSVG(favoriteSVG)
    .appendSVG(noFavoriteSVG)
    .appendSVG(folderSVG)
    .appendSVG(newWindowSVG)
    .appendSVG(editSVG)
    .appendSVG(torrentSVG)
    .appendSVG(cloudDownSVG)
    .appendSVG(tagSVG)
    .appendSVG(trashBinSVG)
    .appendSVG(basketSVG)
    .appendSVG(jsonSVG)
    .appendSVG(playSVG)
    .appendSVG(youtubeSVG)
    .appendSVG(vaginaSVG)
    .appendSVG(controlsSVG.nextTrack)
    .appendSVG(controlsSVG.pause)
    .appendSVG(controlsSVG.volume)
    .appendSVG(rankSVG[0]!)
    .appendSVG(rankSVG[1]!)
    .appendSVG(rankSVG[2]!)
    .appendSVG(rankSVG[3]!)
    .appendSVG(rankSVG[4]!)
    .appendSVG(rankSVG[5]!)
    .appendSVG(rankSVG[6]!)
    .appendSVG(themeSVG.os)
    .appendSVG(themeSVG.light)
    .appendSVG(themeSVG.dark)
    .appendSVG(weatherSVG.cloud)
    .appendSVG(weatherSVG.rain)
    .appendSVG(weatherSVG.snow)
    .appendSVG(weatherSVG.sunny)
    .appendSVG(windowButton.minimize)
    .appendSVG(windowButton.maximize)
    .appendSVG(windowButton.terminate)
    .appendSVG(windowButton.reload)
    .appendSVG(windowButton.fullscreen)
    .appendSVG(windowButton.normalscreen)
    .appendSVG(windowButton.expand)
    .appendSVG(windowButton.compress)
    .appendSVG(arrow.square.Up)
    .appendSVG(arrow.square.Down)
    .appendSVG(arrow.square.Left)
    .appendSVG(arrow.square.Right)
    .appendSVG(arrow.square.UpLeft)
    .appendSVG(arrow.square.UpRight)
    .appendSVG(arrow.square.DownLeft)
    .appendSVG(arrow.square.DownRight)
    .appendSVG(arrow.circle.Up)
    .appendSVG(arrow.circle.Down)
    .appendSVG(arrow.circle.Left)
    .appendSVG(arrow.circle.Right)
    .appendSVG(arrow.circle.UpLeft)
    .appendSVG(arrow.circle.UpRight)
    .appendSVG(arrow.circle.DownLeft)
    .appendSVG(arrow.circle.DownRight)
    .appendIMG('./svg/flayground-text.svg')
    .appendIMG('./svg/flayground-circle.svg')
    .appendIMG('./svg/flayground-circle-t.svg');
} else {
  console.warn('SVG container element not found');
}

// 탭 전환 (Fonts / SVG)
const tabBar = document.getElementById('tabBar');
tabBar?.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBar.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll<HTMLElement>('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.remove('hidden');
  });
});

// 폰트 프리뷰 렌더링
const FONTS = [
  { name: 'Ink Free', note: 'Windows 시스템 폰트' },
  { name: 'Poor Story', note: 'OFL 1.1 · YoonDesign Inc. · 한글' },
  { name: 'Hachi Maru Pop', note: 'OFL 1.1 · Nonty · 日本語' },
];

const PREVIEW_TEXTS: Record<string, string> = {
  en: 'The quick brown fox jumps over the lazy dog',
  ko: '가나다라마바사아자차카타파하 — 손글씨 느낌의 한글 폰트',
  ja: 'あいうえおかきくけこさしすせそたちつてとなにぬねの',
  num: '0123456789  !@#$%^&*()  +-=[]{}|;:,./<>?',
};

const fontPreview = document.getElementById('fontPreview');
if (fontPreview) {
  FONTS.forEach(({ name, note }) => {
    const card = fontPreview.appendChild(document.createElement('div'));
    card.className = 'font-card';

    const header = card.appendChild(document.createElement('div'));
    header.className = 'font-card__header';

    const title = header.appendChild(document.createElement('span'));
    title.className = 'font-card__name';
    title.textContent = name;

    const noteEl = header.appendChild(document.createElement('span'));
    noteEl.className = 'font-card__note';
    noteEl.textContent = note;

    Object.entries(PREVIEW_TEXTS).forEach(([lang, text]) => {
      const p = card.appendChild(document.createElement('p'));
      p.className = 'font-card__sample';
      p.dataset.lang = lang;
      p.style.fontFamily = `'${name}', cursive`;
      p.textContent = text;
    });
  });
}

// 언어별 탭 전환
const langTabBar = document.getElementById('langTabBar');

function applyLangTab(lang: string) {
  const isAll = lang === 'all';
  fontPreview?.classList.toggle('font-preview--compact', !isAll);
  document.querySelectorAll<HTMLElement>('.font-card__sample').forEach((p) => {
    p.classList.toggle('hidden', !isAll && p.dataset.lang !== lang);
  });
}

langTabBar?.querySelectorAll<HTMLButtonElement>('.lang-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    langTabBar.querySelectorAll('.lang-tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    applyLangTab(btn.dataset.lang ?? 'en');
  });
});

// 초기 상태: 첫 번째 활성 탭 적용
const initialLangBtn = langTabBar?.querySelector<HTMLButtonElement>('.lang-tab-btn.active');
applyLangTab(initialLangBtn?.dataset.lang ?? 'all');
