import dependencies from './dependencies-viewer.json';
import './dependencies-viewer.scss';
import './lib/ThemeListener';
import { appendStyle } from './util/componentCssLoader';

appendStyle();

const dependenciesMap = Array.from(dependencies).reduce((map, obj) => {
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

    // node에 id 재설정
    document.querySelectorAll('main svg g.node').forEach((node) => {
      node.id = node.querySelector('title').textContent.replace(/\//g, '_').replace(/\./g, '_');

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
