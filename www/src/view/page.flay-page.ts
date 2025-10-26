import FlayPage from '@flay/domain/FlayPage';
import FlayCondition from '@flay/panel/FlayCondition';
import FlayPagination from '@flay/panel/FlayPagination';
import './inc/Page';
import './page.flay-page.scss';

const flayCondition = document.querySelector('body > main > header')!.appendChild(new FlayCondition());
const flayPagination = document.querySelector('body > main > footer')!.appendChild(new FlayPagination());
const flayPage = document.querySelector('body > main > article')!.appendChild(new FlayPage());

flayCondition.addEventListener('fetch', () => flayPagination.set(flayCondition.opusList));
flayPagination.addEventListener('change', async () => {
  flayPagination.off();
  if (flayPagination.opus) {
    const viewTransition = document.startViewTransition(async () => {
      await flayPage.set(flayPagination.opus!);
      flayPage.classList.toggle('hide', false);
    });
    await viewTransition.updateCallbackDone;
    flayPagination.on();
  } else {
    flayPage.classList.toggle('hide', true);
  }
});
