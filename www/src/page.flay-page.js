import './init/Page';
import './page.flay-page.scss';

import FlayPage from './flay/FlayPage';
import FlayCondition from './flay/page/FlayCondition';
import FlayPagination from './flay/page/FlayPagination';

const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
const flayPagination = document.querySelector('body > main > footer').appendChild(new FlayPagination());
const flayPage = document.querySelector('body > main > article').appendChild(new FlayPage());

flayCondition.addEventListener('fetch', () => flayPagination.set(flayCondition.opusList));
flayPagination.addEventListener('change', async () => {
  flayPagination.off();
  const viewTransition = document.startViewTransition(async () => {
    const { flay } = await flayPage.set(flayPagination.opus);
    flayCondition.updateSearchItem(flay);
  });
  await viewTransition.updateCallbackDone;
  flayPagination.on();
});
