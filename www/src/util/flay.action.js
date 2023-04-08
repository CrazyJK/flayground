export default {
  play: (opus, callback, failCallback) => {
    action('/flay/play/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  editSubtitles: (opus, callback, failCallback) => {
    action('/flay/edit/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  explore: (filepath, callback, failCallback) => {
    action('/flay/open/folder', { method: 'PUT', body: filepath }, callback, failCallback);
  },
  setFavorite: (name, checked, callback, failCallback) => {
    action('/info/actress/favorite/' + name + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  setRank: (opus, rank, callback, failCallback) => {
    action('/info/video/rank/' + opus + '/' + rank, { method: 'PUT' }, callback, failCallback);
  },
  setLike: (opus, callback, failCallback) => {
    action('/info/video/like/' + opus, { method: 'PUT' }, callback, failCallback);
  },
  toggleTag: (opus, tagId, checked, callback, failCallback) => {
    action('/info/video/tag/' + opus + '/' + tagId + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  newTag: (tagName, callback, failCallback) => {
    action(
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
  setComment: (opus, comment, callback, failCallback) => {
    action('/info/video/comment/' + opus, { method: 'PUT', body: comment + ' ' }, callback, failCallback);
  },
  renameFlay: (studio, opus, title, actress, release, callback, failCallback) => {
    action(
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
    action(
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
  listOfStudio: (callback, failCallback) => {
    action('/flay/list/studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort: 'STUDIO' }) }, callback, failCallback);
  },
};

async function action(url, requestInit, callback, failCallback) {
  const response = await fetch(url, requestInit);
  console.debug(url, response.ok, response.status);

  switch (response.status) {
    case 200:
      response.json().then((data) => {
        if (callback) callback(data);
      });
      break;
    case 204:
      if (callback) callback();
      break;
    case 400:
    case 404:
    case 500:
      response.json().then((data) => {
        console.error(response.status, data.message);
        if (failCallback) failCallback(data);
      });
      break;
    default:
      throw new Error('정의 안된 status code');
  }
}
