import FlayCard from '@flay/domain/FlayCard';
import './inc/Popup';
import './popup.flay-card.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');
if (!opus) {
  throw new Error('Opus parameter is required');
}

const flayCard = document.body.appendChild(new FlayCard({}));
void flayCard.set(opus);

document.title = opus;
