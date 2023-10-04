import FlayPage from './flay/FlayPage';
import './lib/SseConnector';
import './lib/ThemeListener';
import './popup.flay.scss';
import componentCssLoader from './style/componentCssLoader';

componentCssLoader();

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

document.title = opus;
const flayPage = document.querySelector('body').appendChild(new FlayPage());
flayPage.set(opus);

window.emitFlay = (flay) => {
  if (flayPage.opus === flay.opus) flayPage.reload();
};
window.emitStudio = (studio) => {
  if (flayPage.flay.studio === studio.name) flayPage.reload();
};
window.emitVideo = (video) => {
  if (flayPage.opus === video.opus) flayPage.reload();
};
window.emitActress = (actress) => {
  if (Array.from(flayPage.flay.actressList).filter((name) => name === actress.name).length > 0) flayPage.reload();
};
window.emitTag = (tag) => {
  flayPage.reload();
};
