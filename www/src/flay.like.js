import './components/FlayMenu';
import { ThreadUtils } from './lib/crazy.common';
import { View } from './lib/flay.utils';

import './flay.like.scss';
import './styles/common.scss';

fetch('/flay/list')
  .then((response) => response.json())
  .then((list) => render(list));

async function render(list) {
  const likeDateMap = Array.from(list)
    .filter((f) => f.video.likes !== null && f.video.likes.length > 0)
    .sort((f1, f2) => {
      // 역순 정렬
      let like1 = Array.from(f1.video.likes)
        .sort((l1, l2) => l1.localeCompare(l2))
        .pop();

      let like2 = Array.from(f2.video.likes)
        .sort((l1, l2) => l1.localeCompare(l2))
        .pop();

      return like2.localeCompare(like1);
    })
    .reduce((acc, flay) => {
      // 좋아요 날짜별 묶기
      const likeDate = Array.from(flay.video.likes)
        .sort((l1, l2) => l2.localeCompare(l1))
        .pop()
        .substring(0, 10);

      if (!acc[likeDate]) {
        acc[likeDate] = [];
      }
      acc[likeDate].push(flay);
      return acc;
    }, {});

  for (const likeDate in likeDateMap) {
    document.querySelector('body > main').innerHTML += `
      <article>
        <h3><i class="fa fa-thumbs-up ms-2 text-danger" title="Like"></i> ${likeDate}</h3>
        <ol>
          ${Array.from(likeDateMap[likeDate])
            .map((flay) => {
              return `
                <li>
                  <div class="flay" data-opus="${flay.opus}">
                    <label class="flay-title">${flay.title}</label>
                  </div>
                </li>
              `;
            })
            .join('')}
        </ol>
      </article>
    `;
  }

  const flayCards = document.querySelectorAll('.flay');
  for (let flayCard of flayCards) {
    flayCard.style.backgroundImage = `url(/static/cover/${flayCard.dataset.opus})`;

    await ThreadUtils.sleep(300);
  }
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('flay-title')) {
    View.flay(e.target.parentNode.dataset.opus);
  }
});
