import componentCssLoader from '../../style/componentCssLoader';
import SVG from '../../svg/svg.json';
import FlayAction from '../../util/FlayAction';

/**
 * Custom element of Rank
 */
export default class FlayRank extends HTMLElement {
  flay;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    componentCssLoader(this.shadowRoot);

    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('rank');

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
    this.likeBtn.type = 'button';
    this.likeBtn.classList.add('like-btn');
    this.likeBtn.addEventListener('click', (e) => {
      console.log('likeClick', this.flay.opus);
      FlayAction.setLike(this.flay.opus);
    });

    this.playLabel = this.wrapper.appendChild(document.createElement('label'));
    this.playLabel.classList.add('play-label');

    this.scoreLabel = this.wrapper.appendChild(document.createElement('label'));
    this.scoreLabel.classList.add('score-label');

    this.shadowRoot.append(STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  resize(domRect) {
    this.domRect = domRect;
    this.isCard = this.classList.contains('card');
    this.wrapper.classList.toggle('card', this.isCard);
    this.wrapper.classList.toggle('small', domRect.width < 400);
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.classList.toggle('archive', this.flay.archive);
    this.wrapper.setAttribute('data-opus', flay.opus);

    this.rankInputElementArray.forEach((input, index) => {
      input.removeAttribute('checked');
      if (index === flay.video.rank + 1) {
        input.checked = true;
      }
    });

    this.rankLabel.innerHTML = flay.video.rank + '<small>R</small>';

    let likeCount = 0;
    if (flay.video.likes?.length) {
      likeCount = flay.video.likes.length;
    }

    this.likeBtn.setAttribute('title', 'Shot ' + likeCount);
    this.likeBtn.innerHTML = '<span>Shot</span><i class="badge">' + likeCount + '</i>';
    this.likeBtn.classList.toggle('notyet', likeCount === 0);

    this.playLabel.innerHTML = '<span>Play</span><i class="badge play">' + flay.video.play + '</i>';
    this.playLabel.classList.toggle('notyet', flay.video.play === 0);

    this.scoreLabel.innerHTML = '<span>Score</span><i class="badge score">' + flay.score + '</i>';
    this.scoreLabel.classList.toggle('notyet', flay.score === 0);
  }
}

// Define the new element
customElements.define('flay-rank', FlayRank);

const CSS = `
div.rank {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: baseline;
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
div.rank.card {
  gap: 0.5rem;
}
div.rank.card .rank-group,
div.rank.card .score-label {
  display: none;
}
div.rank.card .rank-label {
  display: block;
}

div.rank.small .rank-group,
div.rank.small .like-btn,
div.rank.small .play-label,
div.rank.small .score-label {
  display: none;
}
div.rank.small .rank-label {
  display: block;
}
div.rank.small label {
  font-size: var(--size-small);
}
div.rank.small label svg {
  width: 1.25rem;
  height: 1.25rem;
}
div.rank.small button {
  font-size: var(--size-normal);
}
.badge.score {
  min-width: 2rem;
}
.notyet span,
.notyet i {
  color: var(--color-text-secondary);
}
`;
