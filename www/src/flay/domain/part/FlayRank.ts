import FlayAction from '@lib/FlayAction';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import rankSVG from '@svg/ranks';
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

    this.querySelectorAll('.rank-group input').forEach((rankRadio) =>
      rankRadio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        FlayAction.setRank(this.flay.opus, parseInt(target.value));
      })
    );
    this.querySelector('.like-btn').addEventListener('click', () => FlayAction.setLike(this.flay.opus));
  }

  connectedCallback() {
    this.classList.add('flay-rank');
  }

  /**
   *
   * @param flay
   */
  set(flay: Flay): void {
    this.setFlay(flay);

    const flayRank = this.querySelector('#flay-rank' + flay.video.rank) as HTMLInputElement;
    const playLabel = this.querySelector('.play-label') as HTMLLabelElement;
    const rankLabel = this.querySelector('.rank-label') as HTMLLabelElement;
    const scoreLabel = this.querySelector('.score-label') as HTMLLabelElement;
    const likeBtn = this.querySelector('.like-btn') as HTMLButtonElement;
    const likeCount = flay.video.likes?.length || 0;

    flayRank.checked = true;

    rankLabel.classList.toggle('notyet', flay.video.rank < 1);
    rankLabel.querySelector('.rank').innerHTML = String(flay.video.rank);

    likeBtn.querySelector('.shot').innerHTML = String(likeCount);
    likeBtn.classList.toggle('notyet', likeCount === 0);
    likeBtn.title =
      flay.video.likes
        ?.reverse()
        .map((like) => like.substring(0, 16).replace(/T/, ' '))
        .join(`\n`) || '';

    playLabel.querySelector('.play').innerHTML = String(flay.video.play);
    playLabel.classList.toggle('notyet', flay.video.play === 0);
    FlayFetch.getHistories(this.flay.opus).then((histories) => {
      playLabel.title = Array.from(histories)
        .filter((history) => history.action === 'PLAY')
        .map((history) => history.date.substring(0, 16))
        .join(`\n`);
    });

    !flay.archive &&
      FlayFetch.getScore(flay.opus).then((score) => {
        scoreLabel.querySelector('.score').innerHTML = String(score);
        scoreLabel.classList.toggle('notyet', score === 0);
      });
  }
}

defineCustomElements('flay-rank', FlayRank);
