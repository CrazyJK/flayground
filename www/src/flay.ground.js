/**
 * flay ground
 */

import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import './components/FlayMenu';
import './css/common.scss';
import './flay.ground.scss';

import { StringUtils } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service.js';

document.querySelector('#query').addEventListener('change', (e) => {
  let keyword = StringUtils.trim(e.target.value);
  if (keyword.length > 2) {
    Rest.Flay.find(keyword, (list) => {
      const regExp = new RegExp(keyword, 'i');
      const $container = $('.result').empty();
      Array.from(list).forEach((flay) => {
        $container.append(
          ` <div class="flay">
              <img src="/static/cover/${flay.opus}" />
              <div>
                <label>${flay.title}</label>
                <div>
                  <label>${flay.studio}</label>
                  <label>${flay.opus}</label>
                  <label>${flay.release}</label>
                  <label>${flay.actressList}</label>
                </div>
                <div>
                  ${StringUtils.isBlank(flay.video.comment) ? '' : '<label>[' + flay.video.comment + ']</label>'}
                  ${flay.video.tags
                    .map((tag) => {
                      return '<label>' + tag.name + '</label>';
                    })
                    .join('')}
                </div>
              </div>
            </div>
          `.replace(regExp, (match) => {
            return '<span class="keyword">' + match + '</span>';
          })
        );
      });
      $('.search-result').html(list.length + ' f');
      $('main').toggleClass('exists', list.length > 0);
    });
  }
});
