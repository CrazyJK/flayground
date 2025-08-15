import ApiClient, { ApiClientOptions } from '@lib/ApiClient';
import { Actress, Studio, Video } from '@lib/FlayFetch';

// 콜백 함수 타입 정의
type SuccessCallback<T = unknown> = (data?: T) => void;
type ErrorCallback = (error?: { message: string; [key: string]: unknown }) => void;

export default {
  play: (opus: string, time = -1, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/flay/play/' + opus + '?seekTime=' + time, { method: 'PATCH' }, callback, failCallback);
  },
  editSubtitles: (opus: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/flay/edit/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  explore: (filepath: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/flay/open/folder', { method: 'PUT', body: filepath }, callback, failCallback);
  },
  setFavorite: (name: string, checked: boolean, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/actress/favorite/' + name + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  setRank: (opus: string, rank: number, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/video/rank/' + opus + '/' + rank, { method: 'PUT' }, callback, failCallback);
  },
  setLike: (opus: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/video/like/' + opus, { method: 'PUT' }, callback, failCallback);
  },
  toggleTag: (opus: string, tagId: number, checked: boolean, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/video/tag/' + opus + '/' + tagId + '/' + checked, { method: 'PUT' }, callback, failCallback);
  },
  newTag: (tagName: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  newTagOnOpus: (tagName: string, opus: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  updateTag: (tag: { id: number; name: string; description: string }, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  putTag: (id: number, group: string, name: string, desc: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action(
      '/info/tag',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, group: group, name: name, description: desc }),
      },
      callback,
      failCallback
    );
  },
  deleteTag: (id: number, name: string, desc: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  setComment: (opus: string, comment: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/video/comment/' + opus, { method: 'PUT', body: comment + ' ' }, callback, failCallback);
  },
  renameFlay: (studio: string, opus: string, title: string, actress: string, release: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  putActress: (actress: Partial<Actress>, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  putStudio: (studio: Partial<Studio>, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
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
  listOfStudio: (callback?: SuccessCallback<string[]>, failCallback?: ErrorCallback) => {
    return action<string[]>('/flay/list/studio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort: 'STUDIO' }) }, callback, failCallback);
  },
  putVideo: (video: Partial<Video>, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/video', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(video) }, callback, failCallback);
  },
  reload: (callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/batch/reload', { method: 'PUT' }, callback, failCallback);
  },
  batch: (operation: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/batch/start/' + operation, { method: 'PUT' }, callback, failCallback);
  },
  batchSetOption: (option: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/batch/option/' + option, { method: 'PUT' }, callback, failCallback);
  },
  batchGetOption: (type: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/batch/option/' + type, { method: 'GET' }, callback, failCallback);
  },
  acceptCandidates: (opus: string, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/flay/candidates/' + opus, { method: 'PATCH' }, callback, failCallback);
  },
  updateActress: (actress: Partial<Actress>, callback?: SuccessCallback, failCallback?: ErrorCallback) => {
    return action('/info/actress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actress) }, callback, failCallback);
  },
  subtitlesUrlIfFound: (opus: string, callback?: SuccessCallback<{ error: string; url: string }>, failCallback?: ErrorCallback) => {
    return action('/file/find/exists/subtitles?opus=' + opus, {}, callback, failCallback);
  },
};

/**
 * fetch action
 *
 * @param url - API 엔드포인트 URL
 * @param requestInit - fetch 요청 옵션
 * @param callback - 성공 시 콜백 함수
 * @param failCallback - 실패 시 콜백 함수
 */
async function action<T = unknown>(url: string, requestInit: ApiClientOptions, callback: SuccessCallback<T> = () => {}, failCallback: ErrorCallback = () => {}): Promise<void> {
  const response = await ApiClient.getResponse(url, requestInit);
  console.debug(url, response.ok, response.status, response);

  switch (response.status) {
    case 200:
      response
        .json()
        .then((data) => {
          callback(data);
        })
        .catch((error: unknown) => {
          console.error('Error parsing JSON:', error);
        });
      break;
    case 204:
      callback();
      break;
    case 400:
    case 404:
    case 500:
      response
        .json()
        .then((data) => {
          console.error(response.status, data.message);
          failCallback(data);
        })
        .catch((error: unknown) => {
          console.error('Error parsing JSON:', error);
        });
      break;
    default:
      throw new Error('정의 안된 status code');
  }

  const messageBar = document.body.appendChild(document.createElement('label'));
  messageBar.classList.add('message-bar');
  messageBar.style.cssText = `
    position: fixed;
    right: 0;
    bottom: 0;
    background-color: var(--color-bg);
    box-shadow: var(--box-shadow) inset;
    padding: 0.5rem 1rem;
    font-weight: 400;
    z-index: 999;
  `;
  messageBar.innerHTML = `[${requestInit.method ?? 'GET'}] ${url} - ${response.status}`;

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
