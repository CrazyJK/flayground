import './init/Popup';
import './popup.cover.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

(async () => {
  const res = await fetch(`/static/cover/${opus}/withData`);
  const data = res.headers.get('Data');
  const dataDecoded = decodeURIComponent(data.replace(/\+/g, ' '));
  const flay = JSON.parse(dataDecoded);
  const coverBlob = await res.blob();
  const coverURL = URL.createObjectURL(coverBlob);

  document.title = `[${flay.studio}][${flay.opus}][${flay.title}][${flay.actressList.join(',')}][${flay.release}]`;

  document.querySelector('body').style.backgroundImage = `url(${coverURL})`;
})();
