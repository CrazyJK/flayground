import { popupFlay } from '../util/FlaySearch';
import './FlayMarker.scss';

export default class FlayMarker extends HTMLLabelElement {
  constructor(flay) {
    super();

    this.title = `${flay.studio}
${flay.opus}
${flay.title}
${flay.actressList.join(', ')}
${flay.release}`;
    this.classList.add('flay-marker');
    this.classList.toggle('shot', flay.video.likes?.length > 0);
    this.classList.toggle('archive', flay.archive);
    this.addEventListener('click', () => {
      popupFlay(flay.opus);
      this.classList.add('active');
    });
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
