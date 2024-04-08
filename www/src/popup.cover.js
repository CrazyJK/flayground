import './init/Popup';
import './popup.cover.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
document.querySelector('body').style.backgroundImage = `url(/static/cover/${opus})`;
