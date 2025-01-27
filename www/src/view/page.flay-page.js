import './inc/Page';
import './page.flay-page.scss';

import FlayPage from '../flay/domain/FlayPage';
import FlayCondition from '../flay/panel/FlayCondition';
import { FlayMemoEditor } from '../flay/panel/FlayMemoEditor';
import FlayPagination from '../flay/panel/FlayPagination';
import { MODAL_EDGE, MODAL_MODE } from '../GroundConstant';
import { ModalWindow } from '../ui/ModalWindow';

const flayCondition = document.querySelector('body > main > header').appendChild(new FlayCondition());
const flayPagination = document.querySelector('body > main > footer').appendChild(new FlayPagination());
const flayPage = document.querySelector('body > main > article').appendChild(new FlayPage());

flayCondition.addEventListener('fetch', () => flayPagination.set(flayCondition.opusList));
flayPagination.addEventListener('change', async () => {
  flayPagination.off();
  if (flayPagination.opus) {
    const viewTransition = document.startViewTransition(async () => {
      const { flay } = await flayPage.set(flayPagination.opus);
      flayPage.classList.toggle('hide', false);
      flayCondition.updateSearchItem(flay);
    });
    await viewTransition.updateCallbackDone;
    flayPagination.on();
  } else {
    flayPage.classList.toggle('hide', true);
  }
});

document
  .querySelector('body')
  .appendChild(
    new ModalWindow('Memo', {
      top: 60,
      left: 0,
      width: 300,
      height: 200,
      edges: [MODAL_EDGE.RIGHT],
      initialMode: MODAL_MODE.MINIMIZE,
    })
  )
  .appendChild(new FlayMemoEditor());
