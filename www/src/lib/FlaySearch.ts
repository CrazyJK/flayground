import ApiClient from './ApiClient';

// URL constants for various search services
export const URL_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
export const URL_AVDBS = 'https://www.avdbs.com/menu/search.php?kwd=';
export const URL_NEXTJAV = 'https://nextjav.com/torrent/detail/';
export const URL_NEXTJAV_DOWNLOAD = 'https://nextjav.com/save/{}/nextjav-torrent-{}.torrent';
export const URL_MINNANO = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';
export const URL_NEXTJAV_ACTRESS = 'https://nextjav.com/actress/';
export const URL_GOOGLE = 'https://www.google.co.kr/search?q=';
export const URL_SUBTITLECAT = 'https://www.subtitlecat.com/index.php?search=';
export const URL_TRANSLATE_GOOGLE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';
export const URL_TRANSLATE_PAPAGO = 'https://papago.naver.com/?sk=auto&tk=ko&st=';
export const URL_TRANSLATE_DEEPL = 'https://www.deepl.com/translator#ja/ko/';
export const URL_NONOJAV_PAGE = 'https://www.nanojav.com/jav/?order=new&page=1';
export const URL_NONOJAV_SEARCH = 'https://www.nanojav.com/jav/search/?q=';
export const URL_IJAV_PAGE = 'https://ijavtorrent.com/';
export const URL_IJAV_SEARCH = 'https://ijavtorrent.com/?searchTerm=';
export const URL_DONDETH = 'http://www.dondetch.com/dvd/database2.cgi?index=';

/**
 * 다양한 검색 서비스를 위한 검색 유틸리티
 * 팝업 창으로 외부 사이트 검색을 제공
 */
const FlaySearch = {
  /**
   * Google 검색
   * @param keyword - 검색 키워드
   */
  google(keyword: string): Window | null {
    return popupOpen(URL_GOOGLE + keyword, 'googleSearch', 800, 1000);
  },

  /**
   * AVDBS 검색
   * @param keyword - 검색 키워드
   */
  Avdbs(keyword: string): Window | null {
    return popupOpen(URL_AVDBS + keyword + '&seq=' + Date.now(), 'avdbsSearch', 800, 1000);
  },

  opus: {
    /**
     * Arzon에서 opus 검색
     * @param keyword - opus 키워드
     */
    Arzon(keyword: string): Window | null {
      return popupOpen(URL_ARZON + keyword, 'arzonSearch', 1500, 1000);
    },

    /**
     * Dondeth에서 opus 검색
     * @param keyword - opus 키워드
     */
    Dondeth(keyword: string): Window | null {
      return popupOpen(URL_DONDETH + keyword, 'dondethSearch', 1500, 1000);
    },
  },

  actress: {
    /**
     * Minnano에서 배우 검색
     * @param keyword - 배우 이름
     */
    Minnano(keyword: string): Window | null {
      return popupOpen(URL_MINNANO + encodeURI(keyword), 'MINNANO', 1200, 950);
    },
  },

  torrent: {
    /**
     * Nextjav에서 토렌트 검색
     * @param keyword - 검색 키워드
     */
    Nextjav(keyword: string): Window | null {
      return popupOpen(URL_NEXTJAV + keyword, 'nextjavSearch', 800, 1000);
    },

    /**
     * Nextjav 토렌트 다운로드 링크 생성 및 클립보드 복사
     * @param opus - opus 번호
     */
    Download(opus: string): Window | null {
      const url = URL_NEXTJAV_DOWNLOAD.replace(/{}/gi, opus);
      window.navigator.clipboard.writeText(url);
      return popupOpen(url, 'nextjavDownload', 800, 100);
    },

    /**
     * Google에서 토렌트 검색
     * @param keyword - 검색 키워드
     */
    Google(keyword: string): Window | null {
      return popupOpen(URL_GOOGLE + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
    },

    /**
     * Nonojav에서 검색 또는 메인 페이지 열기
     * @param keyword - 검색 키워드 (null이면 메인 페이지)
     */
    Nonojav(keyword: string | null = null): Window | null {
      const url = keyword === null ? URL_NONOJAV_PAGE : URL_NONOJAV_SEARCH + keyword;
      return popupOpen(url, 'nonojavSearch', 1000, 1600);
    },

    /**
     * Ijav에서 검색 또는 메인 페이지 열기
     * @param keyword - 검색 키워드 (null이면 메인 페이지)
     */
    Ijav(keyword: string | null = null): Window | null {
      const url = keyword === null ? URL_IJAV_PAGE : URL_IJAV_SEARCH + keyword;
      return popupOpen(url, 'ijavSearch', 1000, 1600);
    },
  },

  translate: {
    /**
     * Google 번역
     * @param message - 번역할 텍스트
     */
    Google(message: string): Window | null {
      return popupOpen(URL_TRANSLATE_GOOGLE + message, 'translateByGoogle', 1000, 500);
    },

    /**
     * Papago 번역
     * @param message - 번역할 텍스트
     */
    Papago(message: string): Window | null {
      return popupOpen(URL_TRANSLATE_PAPAGO + message, 'translateByPapago', 1000, 500);
    },

    /**
     * DeepL 번역
     * @param message - 번역할 텍스트
     */
    DeepL(message: string): Window | null {
      return popupOpen(URL_TRANSLATE_DEEPL + message, 'translateByDeepL', 1000, 700);
    },
  },

  subtitles: {
    /**
     * Subtitlecat에서 자막 검색
     * @param keyword - 검색 키워드
     * @param w - 팝업 창 너비 (기본값: 900)
     * @param h - 팝업 창 높이 (기본값: 950)
     */
    Subtitlecat(keyword: string, w?: number, h?: number): Window | null {
      return popupOpen(URL_SUBTITLECAT + keyword, 'Subtitlecat', w || 900, h || 950);
    },
  },
};

/**
 * 팝업 창을 열고 중앙에 위치시키는 유틸리티 함수
 * @param url - 열 URL
 * @param target - 창 이름
 * @param width - 창 너비
 * @param height - 창 높이
 * @returns 열린 창 객체
 */
function popupOpen(url: string, target: string, width: number, height: number): Window | null {
  // Screen API의 availTop, availLeft가 모든 브라우저에서 지원되지 않을 수 있으므로 안전하게 처리
  interface ExtendedScreen extends Screen {
    availTop?: number;
    availLeft?: number;
  }

  const screen = window.screen as ExtendedScreen;
  const availTop = screen.availTop || 0;
  const availLeft = screen.availLeft || 0;
  const availHeight = screen.availHeight || window.screen.height;
  const availWidth = screen.availWidth || window.screen.width;

  const top = availTop + (availHeight - height) / 2;
  const left = availLeft + (availWidth - width) / 2;
  return window.open(url, target, `width=${width}px, height=${height}px, top=${top}px, left=${left}px`);
}

// FlaySearch 객체를 기본 export
export default FlaySearch;

// 팝업 유틸리티 함수들
export const popupFlay = (opus: string): Window | null => popupOpen('popup.flay.html?opus=' + opus, 'flay.' + opus, 800, 1350);

export const popupFlayCard = (opus: string): Window | null => popupOpen('popup.flay-card.html?opus=' + opus, 'flay.card.' + opus, 800, 536);

export const popupCover = (opus: string): Window | null => popupOpen('popup.cover.html?opus=' + opus, 'cover.' + opus, 800, 538);

export const popupStudio = (name: string, startDate = '', endDate = ''): Window | null => popupOpen('popup.studio.html?name=' + name + '&s=' + startDate + '&e=' + endDate, 'studio.' + name, 1080, 1200);

export const popupActress = (name: string, startDate = '', endDate = ''): Window | null => popupOpen('popup.actress.html?name=' + name + '&s=' + startDate + '&e=' + endDate, 'actress.' + name, 1080, 1200);

export const popupTag = (tagId: number): Window | null => popupOpen('popup.tag.html?id=' + tagId, 'tag.' + tagId, 1080, 1200);

export const popupFlayInfo = (opus: string): Window | null => popupOpen(ApiClient.buildUrl('/flay/' + opus), 'flay.json.' + opus, 800, 1200);

export const popupVideoInfo = (opus: string): Window | null => popupOpen(ApiClient.buildUrl('/info/video/' + opus), 'video.json.' + opus, 400, 600);

export const popupActressInfo = (name: string): Window | null => popupOpen(ApiClient.buildUrl('/info/actress/' + name), 'actress.json.' + name, 640, 800);
