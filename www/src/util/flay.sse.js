import './flay.sse.scss';

/*
 * ref. https://developer.mozilla.org/ko/docs/Web/API/Server-sent_events
 */

const sse = new EventSource('/sse');

sse.onopen = (e) => {
  console.debug('<< onopen', e);
};

sse.onerror = (e) => {
  console.debug('<< onerror', e);
};

sse.onmessage = (e) => {
  console.debug('<< onmessage', e);
};

/*
 * Event name: CONNECT, FLAY, STUDIO, VIDEO, ACTRESS, TAG, MESSAGE
 */

sse.addEventListener('CONNECT', (e) => {
  const { data: receivedConnectData } = e;
  console.debug('<< connected', receivedConnectData);
});

sse.addEventListener('FLAY', (e) => {
  console.debug(e.type, e.data);
  const flay = JSON.parse(e.data);
  if (typeof window.emitFlay === 'function') {
    window.emitFlay(flay);
  }
});

sse.addEventListener('STUDIO', (e) => {
  console.debug(e.type, e.data);
  const studio = JSON.parse(e.data);
  if (typeof window.emitStudio === 'function') {
    window.emitStudio(studio);
  }
});

sse.addEventListener('VIDEO', (e) => {
  console.debug(e.type, e.data);
  const video = JSON.parse(e.data);
  if (typeof window.emitVideo === 'function') {
    window.emitVideo(video);
  }
});

sse.addEventListener('ACTRESS', (e) => {
  console.debug(e.type, e.data);
  const actress = JSON.parse(e.data);
  if (typeof window.emitActress === 'function') {
    window.emitActress(actress);
  }
});

sse.addEventListener('TAG', (e) => {
  console.debug(e.type, e.data);
  const tag = JSON.parse(e.data);
  if (typeof window.emitTag === 'function') {
    window.emitTag(tag);
  }
});

sse.addEventListener('MESSAGE', (e) => {
  console.debug(e.type, e.data);
  const data = JSON.parse(e.data);
  if (data.type === 'Batch') {
    if (typeof window.emitBatch === 'function') {
      window.emitBatch(data);
    }
  } else if (data.type === 'Notice') {
    if (typeof window.emitNotice === 'function') {
      window.emitNotice(data);
    }
  } else {
    if (typeof window.emitMessage === 'function') {
      window.emitMessage(data);
    }
  }
});

window.emitNotice = (data) => {
  console.log('emitNotice', data);
  let noticeWrapper = document.querySelector('#notice-wrapper');
  if (noticeWrapper === null) {
    noticeWrapper = document.querySelector('body').appendChild(document.createElement('div'));
    noticeWrapper.id = 'notice-wrapper';
  }
  let notice = noticeWrapper.appendChild(document.createElement('div'));
  notice.innerHTML = `
    <label>${data.message}</label>
  `;

  setTimeout(() => {
    notice.remove();
  }, 1000 * 3);
};

window.emitMessage = (...datas) => {
  let message = '';
  for (let data of datas) {
    message += JSON.stringify(data) + '\n';
  }
  alert(message);
};
