import FlayOne from './components/FlayOne';
import './flay.one.scss';

const urlParams = new URL(location.href).searchParams;
const opus = urlParams.get('opus');

const flayOne = document.body.appendChild(new FlayOne());
flayOne.set(opus);
