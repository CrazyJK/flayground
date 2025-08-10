import './dependencies-viewer.scss';
import './inc/Popup';

void fetch('./dependencies-viewer.json')
  .then((res) => res.json())
  .then((json: { entry: string; svg: string }[]) => {
    const dependenciesMap = Array.from(json).reduce((map: Map<string, string>, obj: { entry: string; svg: string }) => {
      map.set(obj.entry, obj.svg);
      return map;
    }, new Map());

    dependenciesMap.forEach((_svg, entry) => {
      const option = document.querySelector('select')!.appendChild(document.createElement('option'));
      option.value = entry;
      option.innerHTML = entry;
    });

    document.querySelector('select')!.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      console.log('Event', target.tagName, e.type, target.value);
      //
      const entry = target.value;
      if (entry) {
        document.querySelector('main')!.innerHTML = dependenciesMap.get(entry);
        document.querySelector('main > svg > g > title')!.remove();

        // node에 id 재설정
        document.querySelectorAll('main svg g.node').forEach((node) => {
          const title = node.querySelector('title')!.textContent!;

          node.id = title.replace(/\//g, '_').replace(/\./g, '_');
          node.classList.add(title.substring(title.lastIndexOf('.') + 1));

          // nodeColor = #c6c5fe, noDependencyColor = #cfffac
          const color = node.querySelector('path')!.getAttribute('stroke');
          if (color === '#cfffac') {
            node.classList.add('noDependency');
          }

          node.querySelector('path')!.setAttribute('stroke', 'currentColor');
          node.querySelector('text')!.setAttribute('fill', 'currentColor');
        });

        document.querySelectorAll('main svg g.edge').forEach((edge) => {
          const svgEdge = edge as SVGGElement;
          // edge에 from, to 설정
          const edgeTitle = svgEdge.querySelector('title')!.textContent;
          const [from, to] = edgeTitle!.split('->');
          svgEdge.dataset.from = from!.replace(/\//g, '_').replace(/\./g, '_');
          svgEdge.dataset.to = to!.replace(/\//g, '_').replace(/\./g, '_');
          // path, polygon #757575
          svgEdge.querySelector('path')!.setAttribute('stroke', 'currentColor');
          svgEdge.querySelector('polygon')!.setAttribute('stroke', 'currentColor');
        });
      }
    });

    document.querySelector('main')!.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickedNode = target.closest('.node');
      if (clickedNode !== null) {
        // 선택 노드
        const id = clickedNode.id;
        const selected = clickedNode.classList.contains('active');
        console.info('node', id, selected);
        // 선택 여부
        // node
        clickedNode.classList.add('active');
        // edge
        document.querySelectorAll('main svg g.edge').forEach((edge) => {
          const svgEdge = edge as SVGGElement;
          if (svgEdge.dataset.from === id) {
            svgEdge.classList.add('from', 'active');
            console.info('edge to', svgEdge.dataset.to);
            document.querySelector(`#${svgEdge.dataset.to}`)!.classList.add('active');
          } else if (svgEdge.dataset.to === id) {
            svgEdge.classList.add('to', 'active');
            console.info('edge from', svgEdge.dataset.from);
            document.querySelector(`#${svgEdge.dataset.from}`)!.classList.add('active');
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
    document.querySelector('#onlyJS')!.addEventListener('click', () => {
      document.querySelectorAll('svg > g > g').forEach((g) => {
        const svgG = g as SVGGElement;
        let containsJS = null;
        if (svgG.classList.contains('node')) {
          containsJS = svgG.classList.contains('js'); // 노드
        } else if (svgG.classList.contains('edge')) {
          containsJS = svgG.dataset.from!.endsWith('js') && svgG.dataset.to!.endsWith('js'); // 화살표
        }
        if (containsJS !== null) svgG.classList.toggle('hide', !toggleJS && !containsJS);
      });
      toggleJS = !toggleJS;
    });
  });

class DragMove {
  isMoving = false;
  offsetX = 0;
  offsetY = 0;
  scale = 100;

  moveContainer: HTMLElement;
  movingObject: HTMLElement;
  zoomIndicator?: HTMLElement | null;

  constructor(containerSelector: string, objectSelector: string, zoomIndicatorSelector: string | null) {
    this.moveContainer = document.querySelector(containerSelector)!;
    this.movingObject = document.querySelector(objectSelector)!;
    if (zoomIndicatorSelector) this.zoomIndicator = document.querySelector(zoomIndicatorSelector);
    if (this.zoomIndicator) this.zoomIndicator.title = 'click for reset';
  }

  #moveStart(e: MouseEvent) {
    this.offsetX = e.clientX - this.movingObject.offsetLeft;
    this.offsetY = e.clientY - this.movingObject.offsetTop;
    this.isMoving = true;
  }

  #moveStop() {
    this.isMoving = false;
  }

  #moving(e: MouseEvent) {
    if (!this.isMoving) return;
    this.movingObject.style.left = e.clientX - this.offsetX + 'px';
    this.movingObject.style.top = e.clientY - this.offsetY + 'px';
  }

  #zoom(e: WheelEvent) {
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

  start() {
    this.movingObject.addEventListener('wheel', (e) => this.#zoom(e));
    this.movingObject.addEventListener('mousedown', (e) => this.#moveStart(e));
    this.moveContainer.addEventListener('mouseup', () => this.#moveStop());
    this.moveContainer.addEventListener('mousemove', (e) => this.#moving(e));
    if (this.zoomIndicator) this.zoomIndicator.addEventListener('click', () => this.#reset());
  }
}

new DragMove('body', 'main', '#zoomIndicator').start();
