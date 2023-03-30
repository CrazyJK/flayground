/**
 *
 */
export default class FlayRank extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('rank');

    this.rankInputElementArray = [];

    const rankGroupElement = this.wrapper.appendChild(document.createElement('div'));
    rankGroupElement.classList.add('rank-group');

    for (let i = -1; i <= 5; i++) {
      const rankInputElement = rankGroupElement.appendChild(document.createElement('input'));
      rankInputElement.setAttribute('type', 'radio');
      rankInputElement.setAttribute('name', 'rank');
      rankInputElement.setAttribute('id', 'rank' + i);

      const rankLabelElement = rankGroupElement.appendChild(document.createElement('label'));
      rankLabelElement.setAttribute('for', 'rank' + i);
      rankLabelElement.setAttribute('title', 'rank ' + i);

      const rankImgElement1 = rankLabelElement.appendChild(document.createElement('img'));
      rankImgElement1.setAttribute('src', './img/svg/rank/star-rank' + i + '.svg');
      rankImgElement1.classList.add('normal');
      const rankImgElement2 = rankLabelElement.appendChild(document.createElement('img'));
      rankImgElement2.setAttribute('src', './img/svg/rank/star-rank' + i + '-a.svg');
      rankImgElement2.classList.add('active');

      this.rankInputElementArray.push(rankInputElement);
    }

    this.likeElement = this.wrapper.appendChild(document.createElement('button'));

    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', './css/components.css');

    this.shadowRoot.append(style, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다
  }

  /**
   *
   * @param {Video} video
   * @param {String} opus
   */
  set(video, opus) {
    this.wrapper.setAttribute('data-opus', opus);

    this.rankInputElementArray.forEach((input, index) => {
      input.removeAttribute('checked');
      if (index === video.rank + 1) {
        input.click();
      }
    });

    let likeCount = video.likes ? video.likes.length : '';

    this.likeElement.setAttribute('title', 'Like' + likeCount);
    this.likeElement.textContent = 'Like' + likeCount;
  }
}

// Define the new element
customElements.define('flay-rank', FlayRank);
