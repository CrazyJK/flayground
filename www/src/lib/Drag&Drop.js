import './Drag&Drop.scss';

let dragged;

/**
 * 엘리먼트를 움직이게
 * @param {Element} element
 */
export const setMoveable = (element) => {
  element.draggable = true;

  let clientX = 0;
  let clientY = 0;
  let zoneRect;
  let absoluteLeft = 0;
  let absoluteTop = 0;

  element.addEventListener('dragstart', (e) => {
    // console.log(e.type, e.clientX, e.clientY, ' | ', e.layerX, e.layerY, ' | ', e.offsetX, e.offsetY, ' | ', e.pageX, e.pageY, ' | ', e.screenX, e.screenY);
    element.classList.add('dragging');

    dragged = element;

    clientX = e.clientX;
    clientY = e.clientY;

    zoneRect = element.closest('.movezone')?.getBoundingClientRect();
    let position = 'absolute';
    if (!zoneRect) {
      zoneRect = { left: 0, top: 0 };
      position = 'fixed';
    }

    const thisRect = element.getBoundingClientRect();

    absoluteLeft = window.scrollX + thisRect.left - zoneRect.left;
    absoluteTop = window.scrollY + thisRect.top - zoneRect.top;

    element.style.position = position;
    element.style.left = absoluteLeft + 'px';
    element.style.top = absoluteTop + 'px';
  });
  element.addEventListener('drag', (e) => {
    //
  });
  element.addEventListener('dragend', (e) => {
    element.classList.remove('dragging');

    const movedX = e.clientX - parseFloat(clientX);
    const movedY = e.clientY - parseFloat(clientY);

    let left = parseFloat(absoluteLeft) + movedX;
    let top = parseFloat(absoluteTop) + movedY;

    left = Math.max(0, left);
    top = Math.max(0, top);

    left = Math.min(left, zoneRect.width - parseFloat(element.offsetWidth));
    top = Math.min(top, zoneRect.height - parseFloat(element.offsetHeight));

    element.style.left = left + 'px';
    element.style.top = top + 'px';
  });
};

/**
 * 드래그중인 엘리먼트를 드랍 받을수 있게
 * @param {Element} dropzone
 */
export const setDropzone = (dropzone) => {
  dropzone.addEventListener(
    'dragover',
    (event) => {
      // prevent default to allow drop
      event.preventDefault();
    },
    false
  );

  dropzone.addEventListener('dragenter', (e) => {
    // highlight potential drop target when the draggable element enters it
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.add('dragover');
    }
  });

  dropzone.addEventListener('dragleave', (e) => {
    // reset background of potential drop target when the draggable element leaves it
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.remove('dragover');
    }
  });

  dropzone.addEventListener('drop', (e) => {
    // prevent default action (open as link for some elements)
    e.preventDefault();
    // move dragged element to the selected drop target
    if (e.target.classList.contains('dropzone')) {
      e.target.classList.remove('dragover');
      e.target.insertBefore(dragged, null);
      dragged.dispatchEvent(new Event('drop'));
    }
  });
};
