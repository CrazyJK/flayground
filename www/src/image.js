import $ from 'jquery';
import { LocalStorageItem, reqParam, PATH, Random, browser, system, LINUX, WINDOWS, CHROME, FIREFOX, MSIE, EDGE, File } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service';
import './css/common.scss';
import './image.scss';

let $glass;
const glass = {
  size: 0,
  zoom: 0,
  radius: 0,
};
const image = {
  width: 0,
  height: 0,
  left: 0,
  top: 0,
};

const sIZe = document.getElementById('sIZe');
const zOOm = document.getElementById('zOOm');

sIZe.value = LocalStorageItem.get('image.magnifier.size', 200);
zOOm.value = LocalStorageItem.get('image.magnifier.zoom', 2);

$('#sIZe, #zOOm')
  .on('change', function () {
    LocalStorageItem.set('image.magnifier.size', sIZe.value);
    LocalStorageItem.set('image.magnifier.zoom', zOOm.value);

    glass.size = parseInt(sIZe.value);
    glass.zoom = parseInt(zOOm.value);
    glass.radius = glass.size / 2;

    $glass = $('#glass').css({
      backgroundSize: image.width * glass.zoom + 'px ' + image.height * glass.zoom + 'px',
      width: glass.size,
      height: glass.size,
      left: -glass.size,
      top: -glass.size,
    });
  })
  .trigger('change');

app();

function app() {
  // parameter
  const paramNo = reqParam.no;
  const paramSrc = reqParam.src;
  const imgSrc = paramNo ? PATH + '/static/image/' + paramNo : paramSrc;

  // get image
  const img = new Image();
  img.onload = function () {
    // popup resize
    const browserMargin = getBrowserMargin();
    const fullMode = screen.width === window.innerWidth;

    if (!fullMode) {
      window.resizeTo(this.naturalWidth + browserMargin.width, this.naturalHeight + browserMargin.height);
    }

    if (fullMode) {
      image.width = Math.round(this.naturalWidth * (window.innerHeight / this.naturalHeight));
      image.height = window.innerHeight;

      if (image.width > window.innerWidth) {
        image.width = window.innerWidth;
        image.height = this.naturalHeight * (window.innerWidth / this.naturalWidth);
      }
    } else {
      image.width = this.naturalWidth;
      image.height = this.naturalHeight;
    }

    $('#image')
      .attr({
        src: this.src,
      })
      .css({
        width: image.width,
        height: image.height,
      });

    $glass = $('#glass').css({
      backgroundImage: "url('" + this.src + "')",
      backgroundSize: image.width * glass.zoom + 'px ' + image.height * glass.zoom + 'px',
      width: glass.size,
      height: glass.size,
    });

    // show default info
    $('#imageSize').html(this.naturalWidth + ' x ' + this.naturalHeight);

    // magnifier glass toggle
    let onOff = 0;
    $('#glassToggle').on('click', function () {
      if (onOff++ % 2 === 0) {
        image.left = $('#image').position().left;
        image.top = $('#image').position().top;
        image.width = $('#image').width();
        image.height = $('#image').height();

        $('#image, #glass').on('mousemove', function (e) {
          moveMagnifier(e);
        });
        $glass.show();
      } else {
        $('#image, #glass').off('mousemove');
        $glass.hide();
      }
    });
  };
  img.src = imgSrc;

  // show default info
  const lastUrlName = imgSrc.split('/').pop();
  document.title = lastUrlName;
  $('#imageName').html(lastUrlName);

  $('#imageUrl').on('click', function () {
    $('#urlInput').toggle(100);
  });
  $('#urlInput > input').on('keyup', function (e) {
    if (e.keyCode === 13 && $.trim($(this).val()).length > 0) {
      location.href = '?src=' + $(this).val();
    }
  });

  // set additional image information
  if (paramNo && paramNo >= 0) {
    Rest.Image.get(paramNo, function (imageInfo) {
      const parentFolder = imageInfo.path.replace(/\\/gi, '/').split('/').pop();
      document.title = parentFolder + ' : ' + imageInfo.name;

      $('#paint')
        .show()
        .on('click', function () {
          Rest.Image.paint(paramNo);
        });
      $('#imagePath')
        .html(parentFolder)
        .on('click', function () {
          Rest.Flay.openFolder(imageInfo.path);
        });
      $('#imageName').html(imageInfo.name);
      $('#imageLength').html(File.formatSize(imageInfo.length));
      $('#imageLastModified').html(new Date(imageInfo.modified).format('yyyy-MM-dd'));
      $('#imageMoveOut')
        .show()
        .on('click', function () {
          if (confirm('move this file to Root Directory?')) Rest.Image.delete(paramNo);
        });
    });

    $('#imageIndex')
      .show()
      .children()
      .val(paramNo)
      .on('keyup change', function (e) {
        e.stopPropagation();
        if (e.type === 'change' || (e.type === 'keyup' && e.keyCode === 13)) {
          location.href = '?no=' + $(this).val();
        }
      });

    const imageLastIndex = Rest.Image.size() - 1;

    $(document).on('wheel keyup', function (e) {
      e.stopPropagation();
      let nextImageIndex = -1;
      const eventCode = e.keyCode || e.originalEvent.wheelDelta;
      switch (eventCode) {
        case 32: // space -> random
          nextImageIndex = Random.getInteger(0, imageLastIndex);
          break;
        case 37: // left key -> previous
        case 120: // wheel up
          nextImageIndex = Math.max(parseInt(paramNo) - 1, 0);
          break;
        case 39: // right key -> next
        case -120: // wheel down
          nextImageIndex = Math.min(parseInt(paramNo) + 1, imageLastIndex);
          break;
        default:
          break;
      }
      if (nextImageIndex > -1) {
        location.href = '?no=' + nextImageIndex;
      }
    });
  }

  function getBrowserMargin() {
    const margin = { width: 0, height: 0 };
    if (system === LINUX) {
      if (browser === CHROME) {
        margin.width = 8;
        margin.height = 28;
      } else if (browser === FIREFOX) {
        margin.width = 0;
        margin.height = 37;
      }
    } else if (system === WINDOWS) {
      if (browser === MSIE) {
        alert('Microsoft IE not support');
      } else if (browser === CHROME) {
        margin.width = 16;
        margin.height = 67;
      } else if (browser === FIREFOX) {
        margin.width = 16;
        margin.height = 76;
      } else if (browser === EDGE) {
        margin.width = 0;
        margin.height = 45;
      }
    }
    return margin;
  }

  function moveMagnifier(e) {
    function getCursorPos(e) {
      let rect,
        x = 0,
        y = 0;
      e = e || window.event;
      /* get the x and y positions of the image */
      rect = img.getBoundingClientRect();
      /* calculate the cursor's x and y coordinates, relative to the image */
      x = e.pageX - rect.left;
      y = e.pageY - rect.top;
      /* consider any page scrolling */
      x = x - window.pageXOffset;
      y = y - window.pageYOffset;
      // console.log('getCursorPos', e.pageX, a.left, window.pageXOffset, x);
      return { x: x, y: y, l: rect.left, t: rect.top };
    }

    // prevent any other actions that may occur when moving over the image
    e.preventDefault();

    /*get the cursor's x and y positions:*/
    const cursor = getCursorPos(e);

    // prevent the magnifier glass from being positioned outside the image
    cursor.x = Math.min(cursor.x, image.width + image.left);
    cursor.x = Math.max(cursor.x, image.left);
    cursor.y = Math.min(cursor.y, image.height + image.top);
    cursor.y = Math.max(cursor.y, image.top);

    /* set the position of the magnifier glass: */
    $glass.css({
      backgroundPosition: (image.left - cursor.x) * glass.zoom + glass.radius + 'px ' + ((image.top - cursor.y) * glass.zoom + glass.radius) + 'px',
      left: cursor.x + cursor.l - glass.radius,
      top: cursor.y + cursor.t - glass.radius,
    });
  }
}
