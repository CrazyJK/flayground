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

export default {
  google(keyword) {
    popupOpen(URL_GOOGLE + keyword, 'googleSearch', 800, 1000);
  },
  Avdbs(keyword) {
    popupOpen(URL_AVDBS + keyword + '&seq=' + Date.now(), 'avdbsSearch', 800, 1000);
  },
  opus: {
    Arzon(keyword) {
      popupOpen(URL_ARZON + keyword, 'arzonSearch', 1500, 1000);
    },
  },
  actress: {
    Minnano(keyword) {
      popupOpen(URL_MINNANO + encodeURI(keyword), 'MINNANO', 1200, 950);
    },
  },
  torrent: {
    Nextjav(keyword) {
      popupOpen(URL_NEXTJAV + keyword, 'nextjavSearch', 800, 1000);
    },
    Download(opus) {
      let url = URL_NEXTJAV_DOWNLOAD.replace(/{}/gi, opus);
      window.navigator.clipboard.writeText(url);
      popupOpen(url, 'nextjavDownload', 800, 100);
    },
    Google(keyword) {
      popupOpen(URL_GOOGLE + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
    },
    Nonojav(keyword = null) {
      const url = keyword === null ? URL_NONOJAV_PAGE : URL_NONOJAV_SEARCH + keyword;
      popupOpen(url, 'nonojavSearch', 1000, 1600);
    },
    Ijav(keyword = null) {
      const url = keyword === null ? URL_IJAV_PAGE : URL_IJAV_SEARCH + keyword;
      popupOpen(url, 'ijavSearch', 1000, 1600);
    },
  },
  translate: {
    Google(message) {
      popupOpen(URL_TRANSLATE_GOOGLE + message, 'translateByGoogle', 1000, 500);
    },
    Papago(message) {
      popupOpen(URL_TRANSLATE_PAPAGO + message, 'translateByPapago', 1000, 500);
    },
    DeepL(message) {
      popupOpen(URL_TRANSLATE_DEEPL + message, 'translateByDeepL', 1000, 700);
    },
  },
  subtitles: {
    Subtitlecat(keyword, w, h) {
      popupOpen(URL_SUBTITLECAT + keyword, 'Subtitlecat', w || 900, h || 950);
    },
  },
};

function popupOpen(url, target, width, height) {
  const top = window.screen.availTop + (window.screen.availHeight - height) / 2;
  const left = window.screen.availLeft + (window.screen.availWidth - width) / 2;
  return window.open(url, target, `width=${width}px, height=${height}px, top=${top}px, left=${left}px`);
}

export const popupFlay = (opus) => popupOpen('popup.flay.html?opus=' + opus, 'flay.' + opus, 800, 1350);
export const popupFlayCard = (opus) => popupOpen('popup.flay-card.html?opus=' + opus, 'flay.card.' + opus, 800, 536);
export const popupCover = (opus) => popupOpen('popup.cover.html?opus=' + opus, 'cover.' + opus, 800, 538);
export const popupStudio = (name, startDate = '', endDate = '') => popupOpen('popup.studio.html?name=' + name + '&s=' + startDate + '&e=' + endDate, 'studio.' + name, 960, 1200);
export const popupActress = (name, startDate = '', endDate = '') => popupOpen('popup.actress.html?name=' + name + '&s=' + startDate + '&e=' + endDate, 'actress.' + name, 960, 1200);
export const popupTag = (tagId) => popupOpen('popup.tag.html?id=' + tagId, 'tag.' + tagId, 960, 1200);

export const popupFlayInfo = (opus) => popupOpen('/flay/' + opus, 'flay.json.' + opus, 800, 1200);
export const popupVideoInfo = (opus) => popupOpen('/info/video/' + opus, 'video.json.' + opus, 400, 600);
export const popupActressInfo = (name) => popupOpen('/info/actress/' + name, 'actress.json.' + name, 640, 800);
