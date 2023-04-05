import FlayCard from './components/FlayCard';
import './flay.card.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

const flayCard = document.body.appendChild(new FlayCard());
flayCard.set(opus);

document.title = opus;

window.emitFlay = (flay) => {
  flayCard.set(flay.opus);
};
window.emitVideo = (video) => {
  flayCard.set(video.opus);
};
