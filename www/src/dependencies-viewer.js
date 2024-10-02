import './dependencies-viewer.scss';
import './init/Popup';

fetch('./dependencies-viewer.json')
  .then((res) => res.json())
  .then((json) => {
    const dependenciesMap = Array.from(json).reduce((map, obj) => {
      map.set(obj.entry, obj.svg);
      return map;
    }, new Map());

    dependenciesMap.forEach((svg, entry) => {
      let option = document.querySelector('select').appendChild(document.createElement('option'));
      option.value = entry;
      option.innerHTML = entry;
    });

    document.querySelector('select').addEventListener('change', (e) => {
      console.log('Event', e.target.tagName, e.type, e.target.value);
      //
      let entry = e.target.value;
      if (entry) {
        document.querySelector('main').innerHTML = dependenciesMap.get(e.target.value);
        document.querySelector('main > svg > g > title').remove();

        // node에 id 재설정
        document.querySelectorAll('main svg g.node').forEach((node) => {
          const title = node.querySelector('title').textContent;

          node.id = title.replace(/\//g, '_').replace(/\./g, '_');
          node.classList.add(title.substring(title.lastIndexOf('.') + 1));

          // nodeColor = #c6c5fe, noDependencyColor = #cfffac
          let color = node.querySelector('path').getAttribute('stroke');
          if (color === '#cfffac') {
            node.classList.add('noDependency');
          }

          node.querySelector('path').setAttribute('stroke', 'currentColor');
          node.querySelector('text').setAttribute('fill', 'currentColor');
        });

        document.querySelectorAll('main svg g.edge').forEach((edge) => {
          // edge에 from, to 설정
          let edgeTitle = edge.querySelector('title').textContent;
          const [from, to] = edgeTitle.split('->');
          edge.dataset.from = from.replace(/\//g, '_').replace(/\./g, '_');
          edge.dataset.to = to.replace(/\//g, '_').replace(/\./g, '_');
          // path, polygon #757575
          edge.querySelector('path').setAttribute('stroke', 'currentColor');
          edge.querySelector('polygon').setAttribute('stroke', 'currentColor');
        });
      }
    });

    document.querySelector('main').addEventListener('click', (e) => {
      let clickedNode = e.target.closest('.node');
      if (clickedNode !== null) {
        // 선택 노드
        let id = clickedNode.id;
        let selected = clickedNode.classList.contains('active');
        console.info('node', id, selected);
        // 선택 여부
        // node
        clickedNode.classList.add('active');
        // edge
        document.querySelectorAll('main svg g.edge').forEach((edge) => {
          if (edge.dataset.from === id) {
            edge.classList.add('from', 'active');
            console.info('edge to', edge.dataset.to);
            document.querySelector(`#${edge.dataset.to}`).classList.add('active');
          } else if (edge.dataset.to === id) {
            edge.classList.add('to', 'active');
            console.info('edge from', edge.dataset.from);
            document.querySelector(`#${edge.dataset.from}`).classList.add('active');
          }
        });
      } else {
        // 배경 선택 => 노드 선택 해제
        document.querySelectorAll('main svg g.node').forEach((node) => {
          node.classList.remove('active');
        });
        document.querySelectorAll('main svg g.edge').forEach((edge) => {
          edge.classList.remove('from', 'to', 'active');
        });
      }
    });

    // js만 보기 토글
    let toggleJS = false;
    document.querySelector('#onlyJS').addEventListener('click', () => {
      document.querySelectorAll('svg > g > g').forEach((g) => {
        let containsJS = null;
        if (g.classList.contains('node')) {
          containsJS = g.classList.contains('js'); // 노드
        } else if (g.classList.contains('edge')) {
          containsJS = g.dataset.from.endsWith('js') && g.dataset.to.endsWith('js'); // 화살표
        }
        if (containsJS !== null) g.classList.toggle('hide', !toggleJS && !containsJS);
      });
      toggleJS = !toggleJS;
    });
  });

class DragMove {
  isMoving = false;
  offsetX = 0;
  offsetY = 0;
  scale = 100;

  constructor(containerSelector, objectSelector, zoomIndicatorSelector) {
    this.moveContainer = document.querySelector(containerSelector);
    this.movingObject = document.querySelector(objectSelector);
    if (zoomIndicatorSelector) this.zoomIndicator = document.querySelector(zoomIndicatorSelector);
    if (this.zoomIndicator) this.zoomIndicator.title = 'click for reset';
  }

  #moveStart(e) {
    this.offsetX = e.clientX - this.movingObject.offsetLeft;
    this.offsetY = e.clientY - this.movingObject.offsetTop;
    this.isMoving = true;
  }

  #moveStop() {
    this.isMoving = false;
  }

  #moving(e) {
    if (!this.isMoving) return;
    this.movingObject.style.left = e.clientX - this.offsetX + 'px';
    this.movingObject.style.top = e.clientY - this.offsetY + 'px';
  }

  #zoom(e) {
    this.scale = this.scale + (e.deltaY > 0 ? 10 : -10);
    this.scale = Math.max(this.scale, 50);
    this.scale = Math.min(this.scale, 200);

    this.movingObject.style.transform = `scale(${this.scale / 100})`;
    if (this.zoomIndicator) this.zoomIndicator.innerHTML = this.scale + '%';
  }

  #reset() {
    this.scale = 100;
    this.movingObject.style.left = '0px';
    this.movingObject.style.top = '0px';
    this.movingObject.style.transform = `scale(${this.scale / 100})`;
    if (this.zoomIndicator) this.zoomIndicator.innerHTML = this.scale + '%';
  }

  async start() {
    this.movingObject.addEventListener('wheel', (e) => this.#zoom(e));
    this.movingObject.addEventListener('mousedown', (e) => this.#moveStart(e));
    this.moveContainer.addEventListener('mouseup', (e) => this.#moveStop(e));
    this.moveContainer.addEventListener('mousemove', (e) => this.#moving(e));
    if (this.zoomIndicator) this.zoomIndicator.addEventListener('click', (e) => this.#reset(e));
  }
}

new DragMove('body', 'main', '#zoomIndicator').start();
