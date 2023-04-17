import FlayCard from './components/FlayCard';
import './flay.card.scss';
import './util/flay.sse';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

const flayCard = document.body.appendChild(new FlayCard());
flayCard.set(opus);

document.title = opus;

window.emitFlay = (flay) => {
  if (opus === flay.opus) flayCard.reload();
};
window.emitStudio = (studio) => {
  if (flayCard.flay.studio === studio.name) flayCard.reload();
};
window.emitVideo = (video) => {
  if (opus === video.opus) flayCard.reload();
};
window.emitActress = (actress) => {
  if (Array.from(flayCard.flay.actressList).filter((name) => name === actress.name).length > 0) flayCard.reload();
};
window.emitTag = (tag) => {
  flayCard.reload();
};

/**
 * Storage change Listener
 */
onstorage = (e) => {
  console.log('onstorage', e.key, e.oldValue, e.newValue);
  if (e.key === 'FlayNav.theme') {
    document.getElementsByTagName('html')[0].setAttribute('theme', e.newValue);
  }
};
