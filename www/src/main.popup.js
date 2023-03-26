import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import './components/FlayMenu';
import { reqParam } from './lib/crazy.common.js';
import { loading } from './lib/flay.loading.js';
import { Rest } from './lib/flay.rest.service.js';
import './styles/common.scss';

const targetUrl = reqParam.target;
console.log('targetUrl', targetUrl);

Rest.Html.get(reqParam.target, (html) => {
  // load page
  $('#wrap_body').html(html);
  // set title
  document.title = targetUrl.split('/').pop();
});

window.onerror = (e) => {
  if (e.toString() === 'ResizeObserver loop limit exceeded') {
    return;
  } else {
    loading.error('Error: ' + e);
  }
  console.error('Error name[' + e.name + '] message[' + e.message + '] toString[' + e.toString() + ']', e);
};
