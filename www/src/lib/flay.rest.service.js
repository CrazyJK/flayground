/**
 * Rest Service
 */

import $ from 'jquery';
import { PATH } from './crazy.common.js';
import { loading } from './flay.loading.js';

export const restCall = (url, args, callback, failCallback, callbackData) => {
  let isCompleted = false;
  let loadingTimeout = -1;
  let loadingIndex = -1;
  const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
  const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
  const DEFAULTS = {
    method: 'GET',
    data: {},
    mimeType: 'application/json',
    contentType: 'application/json',
    async: true,
    cache: false,
    title: '',
    loadingDelay: 300,
    beforeSend(xhr, settings) {
      // if (loading === null) {
      //   loading = new Loading();
      // }
      if (this.method !== 'GET') {
        let csrfHeaderValue = null;
        for (const cookie of document.cookie.split(';')) {
          if (cookie.substring(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '') === CSRF_COOKIE_NAME) {
            csrfHeaderValue = unescape(cookie.substr(cookie.indexOf('=') + 1));
            break;
          }
        }
        xhr.setRequestHeader(CSRF_HEADER_NAME, csrfHeaderValue);
      }
      loadingTimeout = setTimeout(() => {
        if (!isCompleted) {
          loadingIndex = loading.on(`<span class="d2code">[${settings.method.toUpperCase()}] ${url}</span> ${settings.title}`);
        }
      }, settings.loadingDelay);
    },
  };
  let settings = $.extend({}, DEFAULTS, args);
  if (settings.method !== 'GET' && typeof settings.data === 'object') {
    settings.data = JSON.stringify(settings.data);
  }
  // console.debug('restCall', url, settings);

  $.ajax(PATH + url, settings)
    .done((data) => {
      isCompleted = true;
      clearTimeout(loadingTimeout);
      loading.off(loadingIndex);

      callback && callback(data, callbackData);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error('restCall fail', url, '\n jqXHR=', jqXHR, '\n textStatus=', textStatus, '\n errorThrown=', errorThrown);
      isCompleted = true;

      if (failCallback) {
        clearTimeout(loadingTimeout);
        loading.off(loadingIndex);
        failCallback(jqXHR, textStatus, errorThrown);
      } else {
        let errMsg = '';
        if (jqXHR.getResponseHeader('error')) {
          errMsg = `fail: Message: ${jqXHR.getResponseHeader('error.message')} <br>Cause: ${jqXHR.getResponseHeader('error.cause')}`;
        } else if (jqXHR.responseJSON) {
          errMsg = `fail: ${jqXHR.responseJSON.error} <br>Message: ${jqXHR.responseJSON.message} <br>Status: ${jqXHR.responseJSON.status} <br>Path: ${jqXHR.responseJSON.path}`;
        } else {
          errMsg = `fail: ${textStatus} <br>${errorThrown}`;
        }
        console.log('rest', 'loadingIndex', loadingIndex);
        if (loadingIndex > 0) {
          loading.append(loadingIndex, `<span style="color: #f00;">${errMsg}</span>`);
        } else {
          loading.on(`<span style="color: #f00;">${errMsg}</span>`);
        }
      }
    })
    .always((data_jqXHR, textStatus, jqXHR_errorThrown) => {
      // console.debug('ajax always', data_jqXHR, textStatus, jqXHR_errorThrown);
    });
};

export const Rest = {
  Flay: {
    get(opus, callback, failCallback) {
      restCall('/flay/' + opus, {}, callback, failCallback);
    },
    getSync(opus, callback, failCallback) {
      restCall('/flay/' + opus, { async: false }, callback, failCallback);
    },
    getFully(opus, callback, failCallback) {
      restCall(
        '/flay/' + opus + '/fully',
        {},
        (objects) => {
          objects.flay.actressList = objects.actress;
          callback(objects.flay);
        },
        failCallback
      );
    },
    getFullyAsync(opus) {
      let flay;
      restCall('/flay/' + opus + '/fully', { async: false }, (f) => (flay = f));
      return flay;
    },
    getScore(opus, callback) {
      restCall('/flay/' + opus + '/score', {}, callback);
    },
    getScoreSync(opus) {
      let score = 0;
      restCall('/flay/' + opus + '/score', { async: false }, (s) => (score = s));
      return score;
    },
    page(page, size, keyword, callback) {
      restCall('/flay/page', { data: { page: page, size: size, keyword: keyword } }, callback);
    },
    list(callback, failCallback) {
      restCall('/flay/list', {}, callback, failCallback);
    },
    listOfFlay(condition, callback, failCallback) {
      restCall('/flay/list/flay', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOfStudio(condition, callback, failCallback) {
      restCall('/flay/list/studio', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOfOpus(condition, callback, failCallback) {
      restCall('/flay/list/opus', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOfTitle(condition, callback, failCallback) {
      restCall('/flay/list/title', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOfActress(condition, callback, failCallback) {
      restCall('/flay/list/actress', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOfRelease(condition, callback, failCallback) {
      restCall('/flay/list/release', { data: condition, method: 'POST' }, callback, failCallback);
    },
    listOrderbyScoreDesc(callback) {
      restCall('/flay/list/orderbyScoreDesc', {}, callback);
    },
    listOfLowScore(callback) {
      restCall('/flay/list/lowScore', {}, callback);
    },
    search(search, callback) {
      restCall('/flay/find', { data: search }, callback);
    },
    find(query, callback) {
      restCall('/flay/find/' + query, {}, callback);
    },
    findAll(query, callback) {
      restCall('/flay/find/all/' + query, {}, callback);
    },
    findSync(query, callback) {
      restCall('/flay/find/' + query, { async: false }, callback);
    },
    findByTag(tag, callback) {
      restCall('/flay/find/tag/' + tag.id, {}, callback);
    },
    findByTagLike(tag, callback) {
      restCall('/flay/find/tag/' + tag.id + '/like', {}, callback);
    },
    findByActress(actress, callback) {
      let keyword = typeof actress === 'object' ? actress.name : actress;
      restCall('/flay/find/actress/' + keyword, {}, callback);
    },
    findByActressInArchive(actress, callback) {
      let keyword = typeof actress === 'object' ? actress.name : actress;
      restCall('/archive/find/actress/' + keyword, {}, callback);
    },
    findByActressAll(actress, callback) {
      Promise.all([
        new Promise((resolve) => {
          Rest.Flay.findByActress(actress, resolve);
        }),
        new Promise((resolve) => {
          Rest.Flay.findByActressInArchive(actress, resolve);
        }),
      ]).then(([instanceList, archiveList]) => {
        const flayAllList = [...instanceList, ...archiveList];
        callback(flayAllList);
      });
    },
    findCandidates(callback) {
      restCall('/flay/candidates', { title: 'Find candidates' }, callback);
    },
    acceptCandidates(flay, callback) {
      restCall('/flay/candidates/' + flay.opus, { method: 'PATCH' }, callback);
    },
    play(flay, callback, callbackData) {
      flay.video.play++;
      restCall('/flay/play/' + flay.opus, { method: 'PATCH' }, callback, null, callbackData);
    },
    subtitles(flay) {
      restCall('/flay/edit/' + flay.opus, { method: 'PATCH' });
    },
    rename(opus, flay, callback) {
      restCall('/flay/rename/' + opus, { data: flay, method: 'PUT' }, callback);
    },
    openFolder(folder) {
      restCall('/flay/open/folder', { method: 'PUT', data: folder });
    },
    deleteFile(file, callback) {
      restCall('/flay/delete/file', { method: 'PUT', data: file }, callback);
    },
    deleteFileOnFlay(opus, file, callback) {
      restCall('/flay/delete/file/' + opus, { method: 'PUT', data: file }, callback);
    },
  },
  Cover: {
    base64(opus, callback) {
      restCall('/static/cover/' + opus + '/base64', { async: false, mimeType: 'text/plain' }, callback);
    },
  },
  Archive: {
    get(opus, callback) {
      restCall('/archive/' + opus, {}, callback);
    },
    page(page, size, keyword, callback) {
      restCall('/archive/page', { data: { page: page, size: size, keyword: keyword } }, callback);
    },
    list(callback, failCallback) {
      restCall('/archive/list', {}, callback, failCallback);
    },
    toInstance(opus, callback) {
      restCall('/archive/toInstance/' + opus, { method: 'PATCH' }, callback);
    },
  },
  History: {
    list(callback) {
      restCall('/info/history/list', {}, callback);
    },
    find(query, callback) {
      restCall('/info/history/find/' + query, {}, callback);
    },
    findAction(action, callback) {
      restCall('/info/history/find/action/' + action, {}, callback);
    },
  },
  Video: {
    update(video, callback, callbackData) {
      restCall('/info/video', { data: video, method: 'PATCH' }, callback, null, callbackData);
    },
    save(video, callback) {
      restCall('/info/video', { data: video, method: 'POST' }, callback);
    },
    list(callback) {
      restCall('/info/video/list', {}, callback);
    },
    get(opus, callback, failCallback) {
      restCall('/info/video/' + opus, {}, callback, failCallback);
    },
    find(keyword, callback) {
      restCall('/info/video/find/' + keyword, {}, callback);
    },
  },
  Studio: {
    findOneByOpus(opus, callback) {
      restCall('/info/studio/findOneByOpus/' + opus, {}, callback);
    },
    get(name, callback, failCallback) {
      restCall('/info/studio/' + name, {}, callback, failCallback);
    },
    update(studio, callback) {
      restCall('/info/studio', { data: studio, method: 'PATCH' }, callback);
    },
  },
  Actress: {
    get(name, callback) {
      if (name != '') {
        restCall('/info/actress/' + name, {}, callback);
      } else {
        console.error('Rest.Actress.get: no name!');
      }
    },
    getSync(name) {
      if (name != '') {
        let ret = null;
        restCall('/info/actress/' + name, { async: false }, (actress) => (ret = actress));
        return ret;
      } else {
        console.error('Rest.Actress.get: no name!');
      }
    },
    list(callback, failCallback) {
      restCall('/info/actress/list', {}, callback, failCallback);
    },
    listSync(callback, failCallback) {
      restCall('/info/actress/list', { async: false }, callback, failCallback);
    },
    update(actress, callback) {
      restCall('/info/actress', { data: actress, method: 'PATCH' }, callback);
    },
    persist(actress, callback) {
      restCall('/info/actress', { data: actress, method: 'PUT' }, callback);
    },
    rename(originalName, actress, callback) {
      restCall('/info/actress/' + originalName, { data: actress, method: 'PUT' }, callback);
    },
    findByLocalname(name, callback) {
      restCall('/info/actress/find/byLocalname/' + name, {}, callback);
    },
    nameCheck(limit, callback) {
      restCall('/info/actress/func/nameCheck/' + limit, { title: 'Name checking...' }, callback);
    },
    delete(actress, callback) {
      restCall('/info/actress', { data: actress, method: 'DELETE' }, callback);
    },
  },
  Tag: {
    get(tagId, callback) {
      restCall('/info/tag/' + tagId, {}, callback);
    },
    list(callback) {
      restCall('/info/tag/list', {}, callback);
    },
    create(tag, callback) {
      restCall('/info/tag', { data: tag, method: 'POST' }, callback);
    },
    update(tag, callback) {
      restCall('/info/tag', { data: tag, method: 'PATCH' }, callback);
    },
    delete(tag, callback) {
      restCall('/info/tag', { data: tag, method: 'DELETE' }, callback);
    },
  },
  Image: {
    size(callback) {
      if (callback) {
        restCall('/image/size', { async: false }, callback);
      } else {
        var total = 0;
        restCall('/image/size', { async: false }, (max) => (total = max));
        return total;
      }
    },
    list(callback) {
      restCall('/image/list', {}, callback);
    },
    download(data, callback) {
      restCall('/image/pageImageDownload', { data: data, title: 'Download images' }, callback);
    },
    get(idx, callback) {
      restCall('/image/' + idx, {}, callback);
    },
    delete(idx, callback) {
      restCall('/image/' + idx, { method: 'DELETE' }, callback);
    },
    paint(idx) {
      restCall('/image/paint/' + idx, { method: 'PATCH' });
    },
    blobUrl(url, thenFunc) {
      new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(window.URL.createObjectURL(xhr.response));
          } else {
            reject(Error("Image didn't load successfully; error code:" + xhr.statusText));
          }
        };
        xhr.onerror = () => {
          reject(Error('There was a network error.'));
        };
        xhr.send();
      }).then(thenFunc);
    },
  },
  Html: {
    get(url, callback) {
      restCall(url, { contentType: 'text/plain', mimeType: 'text/plain' }, callback);
    },
  },
  Batch: {
    start(type, title, callback) {
      restCall('/batch/start/' + type, { method: 'PUT', title: title }, callback);
    },
    check(type, title, callback) {
      restCall('/batch/check/' + type, { title: title }, callback);
    },
    setOption(type, callback) {
      restCall('/batch/option/' + type, { method: 'PUT' }, callback);
    },
    getOption(type, callback) {
      restCall('/batch/option/' + type, {}, callback);
    },
    reload(callback) {
      restCall('/batch/reload', { method: 'PUT', title: 'Source reload' }, callback);
    },
  },
  Security: {
    whoami(callback) {
      restCall('/security/whoami', { async: false }, callback);
    },
    isAutomaticallyCertificated() {
      let result = false;
      restCall('/security/isAutomaticallyCertificated', { async: false }, (isAuto) => (result = Boolean(isAuto)));
      return result;
    },
    login(username, password, callback, failCallback) {
      $.ajax({
        url: '/html/login.html',
        method: 'POST',
        dataType: 'json',
        data: {
          username: username,
          password: password,
        },
        success(response) {
          console.info(response);
          if (response.result) {
            if (callback) callback(response);
          } else {
            if (failCallback) failCallback(response);
          }
        },
      });
    },
  },
  Todayis: {
    list(callback) {
      restCall('/todayis/list', {}, callback);
    },
    play(todayis, callback) {
      restCall('/todayis/play', { data: todayis, method: 'PATCH' }, callback);
    },
    delete(todayis, callback) {
      restCall('/todayis', { data: todayis, method: 'DELETE' }, callback);
    },
    openFolder(folder) {
      restCall('/flay/open/folder', { method: 'PUT', data: folder });
    },
  },
};
