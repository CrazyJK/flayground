import FlayCache from '../../lib/FlayCache';
import rankSVG from '../../svg/js/rankSVG';
import FlayAction from '../../util/FlayAction';
import FlayHTMLElement, { defineCustomElements } from './FlayHTMLElement';
import './FlayRank.scss';

/**
 * Custom element of Rank
 */
export default class FlayRank extends FlayHTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <div class="rank-group">
        ${Array.from({ length: 7 })
          .map((v, i) => i - 1)
          .map((rank, i) => `<input type="radio" name="rank" value="${rank}" id="flay-rank${rank}"><label for="flay-rank${rank}" title="rank ${rank}">${rankSVG[i]}</label>`)
          .join('')}
      </div>
      <label class="rank-label notyet"><span class="rank">0</span><small>R</small></label>
      <button type="button" class="like-btn notyet" title=""><span>Shot</span><i class="badge shot">0</i></button>
      <label class="play-label notyet" title=""><span>Play</span><i class="badge play">0</i></label>
      <label class="score-label notyet"><span>Score</span><i class="badge score">0</i></label>
    `;

    this.querySelectorAll('.rank-group input').forEach((rankRadio) => rankRadio.addEventListener('change', (e) => FlayAction.setRank(this.flay.opus, e.target.value)));
    this.querySelector('.like-btn').addEventListener('click', (e) => FlayAction.setLike(this.flay.opus));
  }

  connectedCallback() {
    this.classList.add('flay-rank');
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.setFlay(flay);

    this.querySelector('#flay-rank' + flay.video.rank).checked = true;
    this.querySelector('.rank-label').classList.toggle('notyet', flay.video.rank < 1);
    this.querySelector('.rank').innerHTML = flay.video.rank;

    const likeCount = flay.video.likes?.length || 0;
    const likeHistories =
      flay.video.likes
        ?.reverse()
        .map((like) => like.substring(0, 16).replace(/T/, ' '))
        .join(`\n`) || '';

    this.querySelector('.shot').innerHTML = likeCount;
    this.querySelector('.like-btn').classList.toggle('notyet', likeCount === 0);
    this.querySelector('.like-btn').title = likeHistories;

    this.querySelector('.play').innerHTML = flay.video.play;
    this.querySelector('.play-label').classList.toggle('notyet', flay.video.play === 0);
    FlayCache.getHistories(this.flay.opus).then((histories) => {
      this.querySelector('.play-label').title = Array.from(histories)
        .filter((history) => history.action === 'PLAY')
        .map((history) => history.date.substring(0, 16))
        .join(`\n`);
    });

    FlayCache.getScore(flay.opus).then((score) => {
      this.querySelector('.score').innerHTML = score;
      this.querySelector('.score-label').classList.toggle('notyet', score === 0);
    });
  }
}

defineCustomElements('flay-rank', FlayRank);
