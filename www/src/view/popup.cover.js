import './inc/Popup';
import './popup.cover.scss';

import FlayFetch from '../lib/FlayFetch';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

(async () => {
  FlayFetch.getFlay(opus).then((flay) => {
    document.title = `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;
  });
  document.body.style.backgroundImage = `url(${await FlayFetch.getCover(opus)})`;
})();

document.body.addEventListener('click', () => document.body.classList.toggle('cover'));
