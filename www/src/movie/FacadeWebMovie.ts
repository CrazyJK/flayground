export class FacadeWebMovie extends HTMLVideoElement {
  constructor() {
    super();
    this.style.clipPath = 'circle(50% at 50% 50%)';
    this.style.width = '30rem';
    this.style.maxWidth = '50%';
    this.autoplay = true;
    this.loop = false;
    this.volume = 0.5;
    this.addEventListener('ended', () => {
      this.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' }).onfinish = () => {
        this.remove();
      };
    });
  }
  connectedCallback() {
    this.src = '/res/Cocks_not_standing.webm';
  }
}
customElements.define('facade-web-movie', FacadeWebMovie, { extends: 'video' });
