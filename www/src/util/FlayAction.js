export default {
  play: (opus, callback, failCallback) => {
    return action('/flay/play/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  editSubtitles: (opus, callback, failCallback) => {
    return action('/flay/edit/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  explore: (filepath, callback, failCallback) => {
    return action('/flay/open/folder', { method: 'PUT', body: filepath }, callback, failCallback);
  },
  setFavorite: (name, checked, callback, failCallback) => {
    return action('/info/actress/favorite/' + name + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  setRank: (opus, rank, callback, failCallback) => {
    return action('/info/video/rank/' + opus + '/' + rank, { method: 'PUT' }, callback, failCallback);
  },
  setLike: (opus, callback, failCallback) => {
    return action('/info/video/like/' + opus, { method: 'PUT' }, callback, failCallback);
  },
  toggleTag: (opus, tagId, checked, callback, failCallback) => {
    return action('/info/video/tag/' + opus + '/' + tagId + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  newTag: (tagName, callback, failCallback) => {
    return action(
      '/info/tag',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: -1, name: tagName, description: '' }),
      },
      callback,
      failCallback
    );
  },
  newTagOnOpus: (tagName, opus, callback, failCallback) => {
    return action(
      '/info/tag/' + opus,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: -1, name: tagName, description: '' }),
      },
      callback,
      failCallback
    );
  },
  updateTag: (tag, callback, failCallback) => {
    return action(
      '/info/tag',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      },
      callback,
      failCallback
    );
  },
  putTag: (id, name, desc, callback, failCallback) => {
    return action(
      '/info/tag',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: name, description: desc }),
      },
      callback,
      failCallback
    );
  },
  deleteTag: (id, name, desc, callback, failCallback) => {
    return action(
      '/info/tag',
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: name, description: desc }),
      },
      callback,
      failCallback
    );
  },
  setComment: (opus, comment, callback, failCallback) => {
    return action('/info/video/comment/' + opus, { method: 'PUT', body: comment + ' ' }, callback, failCallback);
  },
  renameFlay: (studio, opus, title, actress, release, callback, failCallback) => {
    return action(
      '/flay/rename/' + opus,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studio: studio, opus: opus, title: title, actressList: actress.split(','), release: release }),
      },
      callback,
      failCallback
    );
  },
  putActress: (actress, callback, failCallback) => {
    return action(
      '/info/actress',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actress),
      },
      callback,
      failCallback
    );
  },
  putStudio: (studio, callback, failCallback) => {
    return action(
      '/info/studio',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studio),
      },
      callback,
      failCallback
    );
  },
  listOfStudio: (callback, failCallback) => {
    return action('/flay/list/studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort: 'STUDIO' }) }, callback, failCallback);
  },
  putVideo: (video, callback, failCallback) => {
    return action('/info/video', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(video) }, callback, failCallback);
  },
  reload: (callback, failCallback) => {
    return action('/batch/reload', { method: 'PUT' }, callback, failCallback);
  },
  batch: (operation, callback, failCallback) => {
    return action('/batch/start/' + operation, { method: 'PUT' }, callback, failCallback);
  },
  batchSetOption: (option, callback, failCallback) => {
    return action('/batch/option/' + option, { method: 'PUT' }, callback, failCallback);
  },
  batchGetOption: (type, callback, failCallback) => {
    return action('/batch/option/' + type, { method: 'GET' }, callback, failCallback);
  },
  acceptCandidates: (opus, callback, failCallback) => {
    return action('/flay/candidates/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  updateActress: (actress, callback, failCallback) => {
    return action('/info/actress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actress) }, callback, failCallback);
  },
  subtitlesUrlIfFound: (opus, callback, failCallback) => {
    return action('/file/find/exists/subtitles?opus=' + opus, {}, callback, failCallback);
  },
};

/**
 * fetch action
 *
 * @param {string} url
 * @param {object} requestInit
 * @param {function} callback
 * @param {function} failCallback
 */
async function action(url, requestInit, callback = () => {}, failCallback = () => {}) {
  const response = await fetch(url, requestInit);
  console.debug(url, response.ok, response.status, response);

  switch (response.status) {
    case 200:
      response.json().then((data) => {
        callback(data);
      });
      break;
    case 204:
      callback();
      break;
    case 400:
    case 404:
    case 500:
      response.json().then((data) => {
        console.error(response.status, data.message);
        failCallback(data);
      });
      break;
    default:
      throw new Error('정의 안된 status code');
  }

  const messageBar = document.querySelector('body').appendChild(document.createElement('label'));
  messageBar.classList.add('message-bar');
  messageBar.style.position = 'fixed';
  messageBar.style.right = 0;
  messageBar.style.bottom = 0;
  messageBar.style.backgroundColor = 'var(--color-bg)';
  messageBar.style.padding = '0.5rem 1rem';
  messageBar.style.fontWeight = 400;
  messageBar.style.boxShadow = 'var(--box-shadow) inset';
  messageBar.style.zIndex = 999;
  messageBar.innerHTML = `[${requestInit.method ? requestInit.method : 'GET'}] ${url} - ${response.status}`;

  if ([200, 204].includes(response.status)) {
    // show success message
  } else {
    // show fail message
    messageBar.classList.add('error');
  }
  setTimeout(() => {
    messageBar.remove();
  }, 1000 * 2);
}
