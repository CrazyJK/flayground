import FlayComponent1 from './develop/FlayComponent1';
import FlayComponent2 from './develop/FlayComponent2';
import './test-extendsElement.scss';

for (let i = 0; i < 10; i++) {
  const flayComponent1 = document.querySelector('main').appendChild(new FlayComponent1());
  flayComponent1.set('flayComponent1');

  const flayComponent2 = document.querySelector('main').appendChild(new FlayComponent2());
  flayComponent2.set('flayComponent2');
}
