const URL_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
const URL_AVDBS = 'https://www.avdbs.com/menu/search.php?kwd=';
const URL_NEXTJAV = 'https://nextjav.com/torrent/detail/';
const URL_NEXTJAV_DOWNLOAD = 'https://nextjav.com/save/{}/nextjav-torrent-{}.torrent';
const URL_MINNANO = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';
const URL_NEXTJAV_ACTRESS = 'https://nextjav.com/actress/';
const URL_GOOGLE = 'https://www.google.co.kr/search?q=';
const URL_SUBTITLECAT = 'https://www.subtitlecat.com/index.php?search=';
const URL_TRANSLATE_GOOGLE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';
const URL_TRANSLATE_PAPAGO = 'https://papago.naver.com/?sk=auto&tk=ko&st=';
const URL_TRANSLATE_DEEPL = 'https://www.deepl.com/translator#ja/ko/';

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
