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
    Nextjav(name) {
      popupOpen(URL_NEXTJAV_ACTRESS + name.toLowerCase().replace(' ', '-'), 'NEXTJAV_ACTRESS', 800, 100);
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
      popupOpen(url, 'nonojavSearch', 800, 1000);
    },
    Ijav(keyword = null) {
      const url = keyword === null ? URL_IJAV_PAGE : URL_IJAV_SEARCH + keyword;
      popupOpen(url, 'ijavSearch', 800, 1000);
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
  window.open(url, target, `width=${width}px, height=${height}px`);
}
