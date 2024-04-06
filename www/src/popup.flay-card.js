import './init/Popup';
import './popup.flay-card.scss';

import FlayCard from './flay/FlayCard';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

const flayCard = document.body.appendChild(new FlayCard());
flayCard.set(opus);

document.title = opus;
