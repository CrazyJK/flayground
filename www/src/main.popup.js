import $ from 'jquery';
import { Security } from './lib/flay.utils.js';
import { reqParam } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { loading } from './lib/flay.loading.js';
import 'bootstrap/dist/js/bootstrap';
import './css/common.scss';
import './lib/FlayMenu';

const isAdmin = Security.hasRole('ADMIN');
const username = Security.getName();
console.info(`User is ${username} ${isAdmin ? 'has ADMIN Role' : ''}`);

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
