/**
 * flay.all.js
 */

import $ from 'jquery';
import { Random } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { View } from './lib/flay.utils.js';
import './css/common.scss';
import './flay.all.scss';

async function fetchAndDecode(url) {
  try {
    let response = await fetch(url);
    let content;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      var contentType = response.headers.get('content-type');
      console.log('fetchAndDecode', url, contentType);
      if (contentType) {
        if (contentType.includes('application/json')) {
          return response.json();
        } else if (contentType.includes('image')) {
          content = await response.blob();
        } else if (contentType.includes('text')) {
          content = await response.text();
        } else {
          throw new TypeError("Oops, we haven't got JSON!");
        }
      }
    }
    return content;
  } catch (e) {
    console.log(e);
  }
}

function showCover() {
  const itemLength = $('.flay-item').length;
  const itemIndexArray = [...Array(itemLength).keys()];
  const intervalId = setInterval(() => {
    const selectItemIndexArray = itemIndexArray.splice(Random.getInteger(0, itemIndexArray.length - 1), 10);
    console.log('showCover', selectItemIndexArray);
    if (selectItemIndexArray) {
      for (const index of selectItemIndexArray) {
        const $flayItem = $('.flay-item:nth-child(' + (index + 1) + ')');
        const flay = $flayItem.data('flay');
        $flayItem
          .css({
            backgroundImage: 'url(/static/cover/' + flay.opus + ')',
          })
          .addClass(['opened']);
      }
    }

    if (itemIndexArray.length === 0) {
      clearInterval(intervalId);
    }
  }, 200);

  /*
	const funcArray = [];
	for (let i = 0; i < itemLength; i++) {
		funcArray.push(
			new Promise((resolve) => {
				console.log('func', i);
				const $flayItem = $('.flay-item:nth-child(' + (i + 1) + ')');
				const flay = $flayItem.data('flay');
				fetchAndDecode('/static/cover/' + flay.opus)
					.then((imageBlob) => {
						let objectURL = URL.createObjectURL(imageBlob);
						$flayItem
							.css({
								backgroundImage: `url(${objectURL})`,
							})
							.addClass(['opened']);
						resolve(true);
					})
					.catch((e) => console.error);

				// $flayItem
				// 	.css({
				// 		backgroundImage: 'url(/static/cover/' + flay.opus + ')',
				// 	})
				// 	.addClass(['opened']);
				// resolve(true);
			}),
		);
	}
	Promise.all(funcArray).then(([]) => {
		console.log('func finished');
	});
	*/
}

fetchAndDecode('/flay/list')
  .then((flayList) => {
    const list = [...flayList];
    const listLength = list.length;
    const $flayAllContainer = $('#flayAllContainer');
    for (let i = 0; i < listLength; i++) {
      const flay = list.splice(Random.getInteger(0, list.length - 1), 1)[0];
      $flayAllContainer.append($('<div class="flay-item">').data('flay', flay));
    }

    // show cover
    // showCover();

    // event
    $flayAllContainer.on('mousedown', '.flay-item', (e) => {
      const $flayItem = $(e.target);
      const flay = $flayItem.data('flay');
      const isOpened = $flayItem.hasClass('opened');
      if (e.which === 1) {
        if (isOpened) {
          View.flay(flay.opus);
        } else {
          $flayItem
            .css({
              backgroundImage: 'url(/static/cover/' + flay.opus + ')',
            })
            .addClass(['opened']);
        }
      } else if (e.which === 2) {
        if (isOpened) {
          Rest.Flay.play(
            flay,
            (data, target) => {
              console.log('play callback', data, target);
              $('.played').removeClass('played');
              $(target).addClass('played');
            },
            e.target
          );
        }
      }
    });

    // window resize
    $(window)
      .on('resize', () => {
        const itemWidth = $('.flay-item').width() + 1;
        const columnCount = Math.floor(window.innerWidth / itemWidth);
        const offsetSize = (window.innerWidth - columnCount * itemWidth) / 2;

        $flayAllContainer.css({
          padding: `4px ${offsetSize}px`,
        });
      })
      .trigger('resize');
  })
  .catch((e) => console.error);

fetchAndDecode('./img/svg/flayground1.svg')
  .then((imageBlob) => {
    let objectURL = URL.createObjectURL(imageBlob);
    $('body').css({
      backgroundImage: `url(${objectURL})`,
    });
  })
  .catch((e) => console.error);
