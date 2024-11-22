import './init/Popup';
import FlayFetch from './lib/FlayFetch';
import './popup.cover.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

(async () => {
  FlayFetch.getFlay(opus).then((flay) => {
    document.title = `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;
  });
  document.querySelector('body').style.backgroundImage = `url(${await FlayFetch.getCover(opus)})`;
})();
