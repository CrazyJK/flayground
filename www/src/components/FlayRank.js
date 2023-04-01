import FlayAction from '../util/flay.action';

/**
 *
 */
export default class FlayRank extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('rank');

    this.flay = null;
    this.rankInputElementArray = [];

    const rankGroupElement = this.wrapper.appendChild(document.createElement('div'));
    rankGroupElement.classList.add('rank-group');

    const SVG_prefix = '<svg version="1.1" x="0px" y="0px" viewBox="-30 -30 460 440" width="1.75rem"><g>';
    const SVG_suffic = '</g></svg>';

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

      if (i === -1) {
        rankLabelElement.innerHTML = `${SVG_prefix}<line stroke="currentColor" stroke-width="20%" x1="360" y1="360" x2="40" y2="40" stroke-linecap="round" /><line stroke="currentColor" stroke-width="20%" x1="40" y1="360" x2="360" y2="40" stroke-linecap="round" />${SVG_suffic}`;
      } else if (i === 0) {
        rankLabelElement.innerHTML = `${SVG_prefix}<circle fill="currentColor" stroke="currentColor" stroke-width="10%" cx="200" cy="200" r="180" />${SVG_suffic}`;
      } else if (i === 1) {
        rankLabelElement.innerHTML = `${SVG_prefix}<polygon fill="#00000000" stroke="currentColor" stroke-width="10%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 76,380 100,242 0,145 138,125 200,0" /><polygon fill="currentColor" stroke="currentColor" stroke-width="5%" stroke-linejoin="round" points="200,0 262,125 200,210 138,125" />${SVG_suffic}`;
      } else if (i === 2) {
        rankLabelElement.innerHTML = `${SVG_prefix}<polygon fill="#00000000" stroke="currentColor" stroke-width="10%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 76,380 100,242 0,145 138,125 200,0" /><polygon fill="currentColor" stroke="currentColor" stroke-width="5%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 200,210 138,125" />${SVG_suffic}`;
      } else if (i === 3) {
        rankLabelElement.innerHTML = `${SVG_prefix}<polygon fill="#00000000" stroke="currentColor" stroke-width="10%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 76,380 100,242 0,145 138,125 200,0" /><polygon fill="currentColor" stroke="currentColor" stroke-width="5%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 200,210 138,125" />${SVG_suffic}`;
      } else if (i === 4) {
        rankLabelElement.innerHTML = `${SVG_prefix}<polygon fill="#00000000" stroke="currentColor" stroke-width="10%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 76,380 100,242 0,145 138,125 200,0" /><polygon fill="currentColor" stroke="currentColor" stroke-width="5%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315  76,380 100,242 200,210 138,125" />${SVG_suffic}`;
      } else if (i === 5) {
        rankLabelElement.innerHTML = `${SVG_prefix}<polygon fill="currentColor" stroke="currentColor" stroke-width="10%" stroke-linejoin="round" points="200,0 262,125 400,145 300,242 323,380 200,315 76,380 100,242 0,145 138,125 200,0" />${SVG_suffic}`;
      }

      this.rankInputElementArray.push(rankInputElement);
    }

    this.likeElement = this.wrapper.appendChild(document.createElement('button'));
    this.likeElement.addEventListener('click', (e) => {
      console.log('likeClick', this.flay.opus);
      FlayAction.setLike(this.flay.opus);
    });

    this.scoreLabel = this.wrapper.appendChild(document.createElement('label'));

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
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

    let likeCount = flay.video.likes ? (flay.video.likes.length > 0 ? flay.video.likes.length : '') : '';

    this.likeElement.setAttribute('title', 'Like' + likeCount);
    this.likeElement.innerHTML = 'Like<i class="badge">' + likeCount + '</i>';

    this.scoreLabel.innerHTML = 'Score<i class="badge">' + flay.score + '</i>';
  }
}

// Define the new element
customElements.define('flay-rank', FlayRank);
