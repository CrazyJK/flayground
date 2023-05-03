import FlayAction from '../../util/flay.action';
import SVG from '../svg.json';

/**
 *
 */
export default class FlayRank extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('rank');
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

    this.flay = null;
    this.rankInputElementArray = [];

    const rankGroupElement = this.wrapper.appendChild(document.createElement('div'));
    rankGroupElement.classList.add('rank-group');

    for (let i = -1; i <= 5; i++) {
      const rankInputElement = rankGroupElement.appendChild(document.createElement('input'));
      rankInputElement.setAttribute('type', 'radio');
      rankInputElement.setAttribute('name', 'rank');
      rankInputElement.setAttribute('value', i);
      rankInputElement.setAttribute('id', 'rank' + i);
      rankInputElement.addEventListener('change', (e) => {
        console.log('rankChange', this.flay.opus, e.target.value);
        FlayAction.setRank(this.flay.opus, e.target.value);
      });

      const rankLabelElement = rankGroupElement.appendChild(document.createElement('label'));
      rankLabelElement.setAttribute('for', 'rank' + i);
      rankLabelElement.setAttribute('title', 'rank ' + i);
      rankLabelElement.innerHTML = SVG.rank[i + 1];

      this.rankInputElementArray.push(rankInputElement);
    }

    this.rankLabel = this.wrapper.appendChild(document.createElement('label'));
    this.rankLabel.classList.add('rank-label');

    this.likeBtn = this.wrapper.appendChild(document.createElement('button'));
    this.likeBtn.classList.add('like-btn');
    this.likeBtn.addEventListener('click', (e) => {
      console.log('likeClick', this.flay.opus);
      FlayAction.setLike(this.flay.opus);
    });

    this.scoreLabel = this.wrapper.appendChild(document.createElement('label'));
    this.scoreLabel.classList.add('score-label');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('small', this.parentElement.classList.contains('small'));

    this.rankInputElementArray.forEach((input, index) => {
      input.removeAttribute('checked');
      if (index === flay.video.rank + 1) {
        input.checked = true;
      }
    });

    this.rankLabel.innerHTML = flay.video.rank + '<small>R</small>';

    let likeCount = flay.video.likes ? (flay.video.likes.length > 0 ? flay.video.likes.length : '') : '';

    this.likeBtn.setAttribute('title', 'Like' + likeCount);
    this.likeBtn.innerHTML = 'Like<i class="badge">' + likeCount + '</i>';

    this.scoreLabel.innerHTML = 'Score<i class="badge">' + flay.score + '</i>';
  }
}

// Define the new element
customElements.define('flay-rank', FlayRank);

const CSS = `
/* for FlayRank */
div.rank {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}
div.rank div.rank-group {
  display: inline-flex;
  gap: 0.5rem;
}
div.rank div.rank-group label svg {
  aspect-ratio: 157 / 150;
}
div.rank div.rank-group input[value='-1']:checked + label {
  color: #f00a;
}
div.rank div.rank-group input[value='0']:checked + label {
  color: #3f7e7e;
}
div.rank .rank-label {
  display: none;
}
@media screen and (max-width: 600px) {
  .score-label {
    display: none;
  }
}
div.rank.small {
  gap: 0.5rem;
}
div.rank.small .rank-group,
div.rank.small .score-label,
div.rank.small .like-btn {
  display: none;
}
div.rank.small .rank-label {
  display: block;
}
div.rank.small label {
  font-size: var(--font-small);
}
div.rank.small label svg {
  width: 1.25rem;
  height: 1.25rem;
}
div.rank.small button {
  font-size: var(--font-normal);
}
`;
