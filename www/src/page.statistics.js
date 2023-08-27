import './page.statistics.scss';
import './util/theme.listener';

fetch('/flay')
  .then((res) => res.json())
  .then((list) => {
    console.log(list);
  });
