import FlayHTMLElement from './FlayHTMLElement';
import './FlayStudio.scss';

/**
 * Custom element of Studio
 */
export default class FlayStudio extends FlayHTMLElement {
  flay;

  constructor() {
    super();

    this.init();
  }

  init() {
    const label = this.wrapper.appendChild(document.createElement('label'));
    this.studio = label.appendChild(document.createElement('a'));
    this.studio.innerHTML = 'Studio';
    this.studio.addEventListener('click', () => {
      console.log('studioClick', this.flay.studio);
      // window.open('/info/studio/' + this.flay.studio, this.flay.studio, 'width=640px,height=800px');
      window.open('popup.studio.html?name=' + this.flay.studio, this.flay.studio, 'width=960px,height=1200px');
    });
  }

  /**
   *
   * @param {Flay} flay
   */
  set(flay) {
    this.flay = flay;
    this.wrapper.setAttribute('data-opus', flay.opus);
    this.wrapper.classList.toggle('archive', this.flay.archive);

    this.studio.textContent = flay.studio;
  }
}

// Define the new element
customElements.define('flay-studio', FlayStudio);
