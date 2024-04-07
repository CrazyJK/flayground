import './init/Page';
import './page.flay-page.scss';

import FlayPage from './flay/FlayPage';
import FlayCondition from './flay/page/FlayCondition';
import FlayPagination from './flay/page/FlayPagination';

const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
const flayPagination = document.querySelector('body > main > footer').appendChild(new FlayPagination());
const flayPage = document.querySelector('body > main > article').appendChild(new FlayPage());

flayCondition.addEventListener('change', (e) => flayPagination.set(e.detail.list));
flayPagination.addEventListener('change', (e) => document.startViewTransition(() => flayPage.set(e.target.opus)));
