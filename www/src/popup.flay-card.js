import FlayCard from './flay/FlayCard';
import './lib/SseConnector';
import './lib/ThemeListener';
import './popup.flay-card.scss';
import { addResizeLazyEventListener } from './util/resizeListener';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

const flayCard = document.body.appendChild(new FlayCard());
flayCard.set(opus);

document.title = opus;

addResizeLazyEventListener(() => {
  flayCard.resize();
});

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
