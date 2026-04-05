import FlayFetch from '@lib/FlayFetch';
import './inc/Popup';
import './popup.cover.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

void (async () => {
  if (!opus) {
    console.error('Opus not found');
    return;
  }
  void FlayFetch.getFlay(opus).then((flay) => {
    if (!flay) {
      console.error('Flay not found');
      return;
    }
    document.title = `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;
  });
  document.body.style.backgroundImage = `url(${await FlayFetch.getCoverURL(opus)})`;
})();

document.body.addEventListener('click', () => document.body.classList.toggle('cover'));
