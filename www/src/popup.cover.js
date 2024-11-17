import './init/Popup';
import FlayCache from './lib/FlayCache';
import './popup.cover.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

(async () => {
  FlayCache.getFlay(opus).then((flay) => {
    document.title = `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;
  });
  document.querySelector('body').style.backgroundImage = `url(${await FlayCache.getCover(opus)})`;
})();
