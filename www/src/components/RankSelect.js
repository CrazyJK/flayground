import './RankSelect.scss';

const RANK_SELECT_STYLE = `
  div {
    display: inline-flex;
    width: initial;
    vertical-align: middle;
    gap: 2px;
    margin: 0;
    padding: 4px;
    transition: box-shadow 0.2s;
  }
  label {
    cursor: pointer;
    display: inline-block;
    vertical-align: middle;
    margin: 0;
  }
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
  span {
    background-color: var(--color-bg-check);
    border: 1px solid transparent;
    border-radius: 0.25rem;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 700;
    text-shadow: 1px 1px 2px var(--color-text-shadow);
    padding: 0.125rem 0.25rem;
    transition: background-color 0.3s, color 0.3s, text-shadow 0.3s;
  }
  div input:checked ~ span {
    color: var(--color-input-checked);
    text-shadow: 1px 1px 0 black;
  }
  div:hover span {
    text-shadow: 1px 1px 1px var(--color-input-checked);
  }
`;

/**
    <rank-select id="rankRadio"></rank-select>
    <rank-select id="rankRadio-1" minus></rank-select>
    <rank-select id="tankCheckbox" multiple></rank-select>
    <rank-select id="tankCheckbox-1" multiple minus></rank-select>
 */
class RankSelect extends HTMLElement {
  constructor() {
    super();

    const multiple = this.hasAttribute('multiple');
    const type = multiple ? 'checkbox' : 'radio';
    const startRank = this.hasAttribute('minus') ? -1 : 0;
    const endRank = 5;

    let rankValues = [];

    const shadow = this.attachShadow({ mode: 'open' });

    // style
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'css/font-awesome.css');
    shadow.appendChild(linkElem);

    const style = document.createElement('style');
    style.textContent = RANK_SELECT_STYLE;
    shadow.appendChild(style);

    const rankSelect = document.createElement('div');
    rankSelect.setAttribute('class', 'rank-select');
    shadow.appendChild(rankSelect);

    // rank loop
    for (let i = startRank; i <= endRank; i++) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      const span = document.createElement('span');

      input.setAttribute('type', type);
      input.setAttribute('id', 'rank' + i);
      input.setAttribute('name', 'rank');
      input.setAttribute('value', i);
      input.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const rankValue = Number(e.target.value);

        if (multiple) {
          if (checked) {
            rankValues.push(rankValue);
          } else {
            rankValues = rankValues.filter((rank) => rank !== rankValue);
          }
          rankValues.sort((r1, r2) => r1 - r2);
        } else {
          rankValues = [rankValue];
        }

        this.dispatchEvent(new CustomEvent('change', { detail: { rank: rankValues, checked: checked, value: rankValue }, cancelable: true, composed: false, bubbles: false }));
        this.setAttribute('data-value', rankValues.toString());
      });

      switch (i) {
        case -1:
          span.setAttribute('class', 'fa fa-thumbs-down');
          break;
        case 0:
          span.setAttribute('class', 'fa fa-circle');
          break;
        default:
          span.setAttribute('class', 'fa fa-star');
          break;
      }

      label.appendChild(input);
      label.appendChild(span);

      rankSelect.appendChild(label);
    }

    // event listener
    this.addEventListener('rank-select', (e) => {
      rankSelect.querySelector('#rank' + e.detail.rank).click();
    });
  }

  connectedCallback() {
    console.log('RankSelect connected');
  }
}

customElements.define('rank-select', RankSelect);
