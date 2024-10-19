import rankSVG from '../../svg/js/rankSVG';
import FlayAction from '../../util/FlayAction';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayRank.scss';

/**
 * Custom element of Rank
 */
export default class FlayRank extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    this.rankInputElementArray = [];

    const rankGroupElement = this.appendChild(document.createElement('div'));
    rankGroupElement.classList.add('rank-group');

    for (let i = -1; i <= 5; i++) {
      const rankInputElement = rankGroupElement.appendChild(document.createElement('input'));
      rankInputElement.setAttribute('type', 'radio');
      rankInputElement.setAttribute('name', 'rank');
      rankInputElement.setAttribute('value', i);
      rankInputElement.setAttribute('id', 'flay-rank' + i);
      rankInputElement.addEventListener('change', (e) => {
        console.log('rankChange', this.flay.opus, e.target.value);
        FlayAction.setRank(this.flay.opus, e.target.value);
      });

      const rankLabelElement = rankGroupElement.appendChild(document.createElement('label'));
      rankLabelElement.setAttribute('for', 'flay-rank' + i);
      rankLabelElement.setAttribute('title', 'rank ' + i);
      rankLabelElement.innerHTML = rankSVG[i + 1];

      this.rankInputElementArray.push(rankInputElement);
    }

    this.rankLabel = this.appendChild(document.createElement('label'));
    this.rankLabel.classList.add('rank-label');

    this.likeBtn = this.appendChild(document.createElement('button'));
    this.likeBtn.type = 'button';
    this.likeBtn.classList.add('like-btn');
    this.likeBtn.addEventListener('click', (e) => {
      console.log('likeClick', this.flay.opus);
      FlayAction.setLike(this.flay.opus);
    });

    this.playLabel = this.appendChild(document.createElement('label'));
    this.playLabel.classList.add('play-label');

    this.scoreLabel = this.appendChild(document.createElement('label'));
    this.scoreLabel.classList.add('score-label');
  }

  connectedCallback() {
    this.classList.add('flay-rank');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.classList.toggle('archive', this.flay.archive);
    this.setAttribute('data-opus', flay.opus);

    this.rankInputElementArray.forEach((input, index) => {
      input.removeAttribute('checked');
      if (index === flay.video.rank + 1) {
        input.checked = true;
      }
    });

    this.rankLabel.innerHTML = flay.video.rank + '<small>R</small>';

    let likeHistories = '';
    let likeCount = 0;
    if (flay.video.likes) {
      likeCount = flay.video.likes.length;
      likeHistories = flay.video.likes
        .reverse()
        .map((like) => like.substring(0, 16).replace(/T/, ' '))
        .join(`\n`);
    }

    this.likeBtn.innerHTML = '<span>Shot</span><i class="badge">' + likeCount + '</i>';
    this.likeBtn.classList.toggle('notyet', likeCount === 0);
    this.likeBtn.title = likeHistories;

    this.playLabel.innerHTML = '<span>Play</span><i class="badge play">' + flay.video.play + '</i>';
    this.playLabel.classList.toggle('notyet', flay.video.play === 0);
    fetch(`/info/history/find/${this.flay.opus}`)
      .then((res) => res.json())
      .then((histories) => {
        this.playLabel.title = Array.from(histories)
          .filter((history) => history.action === 'PLAY')
          .map((history) => history.date.substring(0, 16))
          .join(`\n`);
      });

    this.scoreLabel.innerHTML = '<span>Score</span><i class="badge score">' + flay.score + '</i>';
    this.scoreLabel.classList.toggle('notyet', flay.score === 0);
  }
}

defineCustomElements('flay-rank', FlayRank);
