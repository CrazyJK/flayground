/**
 *
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
 * Event name:
 *   CONNECT, FLAY, STUDIO, VIDEO, ACTRESS, TAG, MESSAGE
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
  const message = JSON.parse(e.data);
  if (typeof window.emitMessage === 'function') {
    window.emitMessage(message);
  }
});
