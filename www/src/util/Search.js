const URL_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
const URL_AVNORI = 'https://avnori6.com/bbs/search.php?search_flag=search&stx=';
const URL_AVDBS = 'https://www.avdbs.com/menu/search.php?kwd=';
const URL_NEXTJAV = 'https://nextjav.com/torrent/detail/';
const URL_ACTRESS = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';
const URL_GOOGLE = 'https://www.google.co.kr/search?q=';
const URL_SUBTITLES = 'https://www.subtitlecat.com/index.php?search=';
const URL_TRANSLATE_GOOGLE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';
const URL_TRANSLATE_PAPAGO = 'https://papago.naver.com/?sk=auto&tk=ko&st=';

export default {
  google(keyword) {
    popupOpen(URL_GOOGLE + keyword, 'googleSearch', 800, 1000);
  },
  opusByArzon(keyword) {
    popupOpen(URL_ARZON + keyword, 'arzonSearch', 1500, 1000);
  },
  opusByAvnori(keyword) {
    popupOpen(URL_AVNORI + keyword, 'avnoriSearch', 800, 1000);
  },
  opusByAvdbs(keyword) {
    popupOpen(URL_AVDBS + keyword, 'avdbsSearch', 800, 1000);
  },
  actress(keyword) {
    popupOpen(URL_ACTRESS + encodeURI(keyword), 'actressSearch', 1200, 950);
  },
  torrentByNextjav(keyword) {
    popupOpen(URL_NEXTJAV + keyword, 'nextjavSearch', 800, 1000);
  },
  torrentByGoogle(keyword) {
    popupOpen(URL_GOOGLE + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
  },
  translateByPapago(message) {
    popupOpen(URL_TRANSLATE_PAPAGO + message, 'translateByPapago', 1000, 500);
  },
  translateByGoogle(message) {
    popupOpen(URL_TRANSLATE_GOOGLE + message, 'translateByGoogle', 1000, 500);
  },
  subtitles(keyword, w, h) {
    popupOpen(URL_SUBTITLES + keyword, 'subtitlesSearch', w || 900, h || 950);
  },
};

function popupOpen(url, target, width, height) {
  window.open(url, target, `width=${width}px, height=${height}px`);
}
