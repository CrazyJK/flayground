import './SseConnector.scss';

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
  emitFlay(flay);
  if (typeof window.emitFlay === 'function') window.emitFlay(flay);
});

sse.addEventListener('STUDIO', (e) => {
  console.debug(e.type, e.data);
  const studio = JSON.parse(e.data);
  emitStudio(studio);
  if (typeof window.emitStudio === 'function') window.emitStudio(studio);
});

sse.addEventListener('VIDEO', (e) => {
  console.debug(e.type, e.data);
  const video = JSON.parse(e.data);
  emitVideo(video);
  if (typeof window.emitVideo === 'function') window.emitVideo(video);
});

sse.addEventListener('ACTRESS', (e) => {
  console.debug(e.type, e.data);
  const actress = JSON.parse(e.data);
  emitActress(actress);
  if (typeof window.emitActress === 'function') window.emitActress(actress);
});

sse.addEventListener('TAG', (e) => {
  console.debug(e.type, e.data);
  const tag = JSON.parse(e.data);
  emitTag(tag);
  if (typeof window.emitTag === 'function') window.emitTag(tag);
});

sse.addEventListener('MESSAGE', (e) => {
  console.debug(e.type, e.data);
  const data = JSON.parse(e.data);
  switch (data.type) {
    case 'Batch':
      if (typeof window.emitBatch === 'function') window.emitBatch(data);
      break;
    case 'Notice':
      if (typeof window.emitNotice === 'function') window.emitNotice(data);
      break;
    default:
      if (typeof window.emitMessage === 'function') window.emitMessage(data);
      break;
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
  let messages = '';
  for (let data of datas) {
    messages += JSON.stringify(data) + '<br>';
  }

  let messageWrapper = document.querySelector('#message-wrapper');
  if (messageWrapper === null) {
    messageWrapper = document.querySelector('body').appendChild(document.createElement('div'));
    messageWrapper.id = 'message-wrapper';
    messageWrapper.appendChild(document.createElement('div')).id = 'message';
    messageWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.classList.remove('show');
      e.target.querySelector('#message').textContent = null;
    });
  }
  messageWrapper.querySelector('#message').innerHTML += `<label>${messages}</label>`;
  messageWrapper.classList.add('show');
};

function emitFlay(flay) {
  document.querySelectorAll('flay-page, flay-card').forEach((flayElement) => {
    if (flayElement.opus === flay.opus) flayElement.reload();
  });
}

function emitVideo(video) {
  document.querySelectorAll('flay-page, flay-card').forEach((flayElement) => {
    if (flayElement.opus === video.opus) flayElement.reload();
  });
}

function emitStudio(studio) {
  document.querySelectorAll('flay-page, flay-card').forEach((flayElement) => {
    if (flayElement.flay.studio === studio.name) flayElement.reload();
  });
}

function emitActress(actress) {
  document.querySelectorAll('flay-page, flay-card').forEach((flayElement) => {
    if (flayElement.flay.actressList.includes(actress.name)) flayElement.reload();
  });
}

function emitTag(tag) {
  document.querySelectorAll('flay-page, flay-card').forEach((flayElement) => {
    flayElement.reload();
  });
}
