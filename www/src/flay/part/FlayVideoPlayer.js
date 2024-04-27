import './FlayActress';
import './FlayOpus';
import './FlayRank';
import './FlayRelease';
import './FlayStudio';
import './FlayTag';
import './FlayTitle';
import './FlayVideoPlayer.scss';

export default class FlayVideoPlayer extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['controls', 'volume'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.debug('attributeChangedCallback', name, oldValue, newValue);
    switch (name) {
      case 'controls':
        this.video.controls = newValue === 'true';
        break;
      case 'volume':
        this.video.volume = parseFloat(newValue);
        break;
    }
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    this.wrapper = this.shadowRoot.appendChild(document.createElement('article'));
    this.wrapper.classList.add(this.tagName.toLowerCase());
    this.wrapper.innerHTML = `<video></video>
    <div class="info">
      <div class="header">
        <flay-title></flay-title>
      </div>
      <div class="footer">
        <flay-studio mode="card"></flay-studio>
        <flay-opus mode="card"></flay-opus>
        <flay-actress mode="card"></flay-actress>
        <flay-release mode="card"></flay-release>
        <flay-rank mode="card"></flay-rank>
        <flay-tag mode="card"></flay-tag>
      </div>
    </div>`;

    this.video = this.shadowRoot.querySelector('video');
    this.video.msZoom = true;

    this.video.addEventListener('error', (e) => console.error(e));
    this.video.addEventListener('canplay', (e) => console.log(e.type));
    this.video.addEventListener('canplaythrough', (e) => console.log(e.type));
    this.video.addEventListener('loadeddata', (e) => console.log(e.type));
    this.video.addEventListener('loadedmetadata', (e) => console.log(e.type));
    this.video.addEventListener('loadstart', (e) => console.log(e.type));
    this.video.addEventListener('pause', (e) => console.log(e.type));
    this.video.addEventListener('play', (e) => console.log(e.type));
    this.video.addEventListener('seeked', (e) => console.log(e.type));
    this.video.addEventListener('waiting', (e) => console.log(e.type));
  }

  set(opus, flay, actress) {
    this.video.poster = `/static/cover/${opus}`;
    this.video.src = `/stream/flay/movie/${opus}/0`;
    this.video.load();

    this.shadowRoot.querySelector('flay-studio').set(flay);
    this.shadowRoot.querySelector('flay-opus').set(flay);
    this.shadowRoot.querySelector('flay-title').set(flay);
    this.shadowRoot.querySelector('flay-actress').set(flay, actress);
    this.shadowRoot.querySelector('flay-release').set(flay);
    this.shadowRoot.querySelector('flay-rank').set(flay);
    this.shadowRoot.querySelector('flay-tag').set(flay);
    this.shadowRoot.querySelector('flay-tag').setCard();
  }

  async play(seekTime = 0) {
    await this.video.play();
    console.log('played', seekTime);
    if (seekTime > 0) {
      this.video.currentTime = seekTime;
      console.log('played', seekTime);
    }
    return this.video.duration;
  }

  pause() {
    this.video.pause();
    console.log('paused');
  }
}

customElements.define('flay-video-player', FlayVideoPlayer);
