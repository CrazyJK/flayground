/**
 *
 */
export default class FlayRank extends HTMLElement {
  /**
   *
   * @param {Video} video
   */
  constructor(video, opus) {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-opus', opus);
    wrapper.classList.add('buttons');

    const rankGroupElement = wrapper.appendChild(document.createElement('div'));
    rankGroupElement.classList.add('rank-group');

    for (let i = -1; i <= 5; i++) {
      const rankInputElement = rankGroupElement.appendChild(document.createElement('input'));
      rankInputElement.setAttribute('type', 'radio');
      rankInputElement.setAttribute('name', 'rank');
      rankInputElement.setAttribute('id', 'rank' + i);
      if (i == video.rank) {
        rankInputElement.setAttribute('checked', i == video.rank);
      }

      const rankLabelElement = rankGroupElement.appendChild(document.createElement('label'));
      rankLabelElement.setAttribute('for', 'rank' + i);
      rankLabelElement.setAttribute('title', 'rank ' + i);

      const rankImgElement1 = rankLabelElement.appendChild(document.createElement('img'));
      rankImgElement1.setAttribute('src', './img/svg/rank/star-rank' + i + '.svg');
      rankImgElement1.classList.add('normal');
      const rankImgElement2 = rankLabelElement.appendChild(document.createElement('img'));
      rankImgElement2.setAttribute('src', './img/svg/rank/star-rank' + i + '-a.svg');
      rankImgElement2.classList.add('active');
    }

    const likeElement = wrapper.appendChild(document.createElement('button'));
    likeElement.setAttribute('title', 'Like');
    likeElement.textContent = 'Like';

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }
}

// Define the new element
customElements.define('flay-rank', FlayRank);
