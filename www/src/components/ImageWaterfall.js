/**
 * Image Waterfall
 */

class ImageWaterfall extends HTMLElement {
  constructor() {
    super();

    const COLUMN_WIDTH = 350;

    this.INTERVAL = 1000 * 3;
    this.timer = -1;

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'css/ImageWaterfall.css');
    shadow.appendChild(linkElem);

    this.wrap = document.createElement('div');
    this.wrap.setAttribute('class', 'waterfall');
    shadow.appendChild(this.wrap);

    // dark layer
    this.layer = document.createElement('div');
    this.layer.setAttribute('class', 'layer');
    shadow.appendChild(this.layer);

    window.addEventListener('resize', () => {
      let calcuratedColCount = Math.floor(window.innerWidth / COLUMN_WIDTH);
      let currColumnCount = this.wrap.childElementCount;
      console.debug('colCount', calcuratedColCount, currColumnCount);

      if (calcuratedColCount < currColumnCount) {
        // remove col
        for (let i = 0; i < currColumnCount - calcuratedColCount; i++) {
          this.wrap.removeChild(this.wrap.lastChild);
        }
      } else if (calcuratedColCount > currColumnCount) {
        // add col
        for (let i = 0; i < calcuratedColCount - currColumnCount; i++) {
          const column = document.createElement('div');
          column.setAttribute('class', 'col');
          this.wrap.appendChild(column);
        }
      }
    });
    window.dispatchEvent(new Event('resize'));

    window.addEventListener('keyup', (e) => {
      console.log('keyup', e.key);
      if (e.key === 'f') {
        if (this.timer > -1) {
          this.stop();
        } else {
          this.run();
        }
      }
    });
  }

  start() {
    this.run().then(() => console.log('start'));
  }

  async run() {
    console.debug('run', this.wrap.childElementCount, this.wrap.childNodes);

    this.layer.classList.add('show');

    const imageSize = await fetch('/image/size').then((res) => res.json());
    console.debug('imageSize', imageSize);

    const seenIndex = [];

    this.timer = setInterval(() => {
      let colCount = this.wrap.childElementCount;
      let colNodes = this.wrap.children;
      let selectedIndex = Math.floor(Math.random() * colCount) % colCount;
      let selectedCol = colNodes[selectedIndex];
      console.debug('selected', selectedIndex, selectedCol);

      const img = new Image();
      img.onload = () => {
        let nw = img.naturalWidth;
        let nh = img.naturalHeight;
        let iw = (window.innerWidth - 16 * 4) / colCount;
        let ih = (iw * nh) / nw;
        console.debug('image', nw, nh, iw, ih);

        img.animate([{ height: '0px' }, { height: ih + 'px' }], {
          duration: 400,
          iterations: 1,
        });

        selectedCol.prepend(img);
      };
      img.addEventListener('click', (e) => {
        console.debug('img click', e.target);
        const imgNo = e.target.src.split('/').pop();
        window.open('image.alone.html?no=' + imgNo, 'img-' + imgNo, `width=${img.naturalWidth}, height=${img.naturalHeight}`);
      });

      let randomIndex = -1;
      do {
        if (seenIndex.length === imageSize) {
          seenIndex.length = 0;
          console.log('Array seenIndex set empty');
        }
        randomIndex = Math.floor(Math.random() * imageSize) % imageSize;
      } while (seenIndex.includes(randomIndex));
      seenIndex.push(randomIndex);
      img.src = '/static/image/' + randomIndex;

      // remove overflow image
      for (let col of colNodes) {
        const imageLength = col.children.length;
        if (imageLength > 9) {
          col.lastChild.remove();
        }
        console.debug('image length', col.children.length);
      }
    }, this.INTERVAL);

    console.debug('timer', this.timer);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    console.debug('clear timer');
  }

  empty() {
    for (let col of this.wrap.children) {
      col.innerHTML = '';
    }
  }

  /**
   * layer를 가려서 앞으로 보내기
   */
  front() {
    this.layer.classList.remove('show');
  }

  /**
   * layer를 보여서 백그라운드로 가기
   */
  behind() {
    this.layer.classList.add('show');
  }
}

// Define the new element
customElements.define('image-waterfall', ImageWaterfall);

export const imageWaterfall = new ImageWaterfall();
document.body.prepend(imageWaterfall);
