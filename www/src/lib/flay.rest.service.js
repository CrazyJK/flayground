/**
 * Rest Service
 */

import $ from 'jquery';
import { loading } from './flay.loading.js';
import { PATH } from './crazy.common.js';

export const restCall = function (url, args, callback, failCallback, callbackData) {
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
    beforeSend: function (xhr, settings) {
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
      loadingTimeout = setTimeout(function () {
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
  console.debug('restCall', url, settings);

  $.ajax(PATH + url, settings)
    .done(function (data) {
      isCompleted = true;
      clearTimeout(loadingTimeout);
      loading.off(loadingIndex);

      callback && callback(data, callbackData);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
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
    .always(function (data_jqXHR, textStatus, jqXHR_errorThrown) {
      console.debug('ajax always', data_jqXHR, textStatus, jqXHR_errorThrown);
    });
};

export const Rest = {
  Flay: {
    get: function (opus, callback, failCallback) {
      restCall('/flay/' + opus, {}, callback, failCallback);
    },
    getSync: function (opus, callback, failCallback) {
      restCall('/flay/' + opus, { async: false }, callback, failCallback);
    },
    getScore: function (opus, callback) {
      restCall('/flay/' + opus + '/score', {}, callback);
    },
    getScoreSync: function (opus) {
      let score = 0;
      restCall('/flay/' + opus + '/score', { async: false }, function (s) {
        score = s;
      });
      return score;
    },
    list: function (callback, failCallback) {
      restCall('/flay/list', {}, callback, failCallback);
    },
    listOrderbyScoreDesc: function (callback) {
      restCall('/flay/list/orderbyScoreDesc', {}, callback);
    },
    listOfLowScore: function (callback) {
      restCall('/flay/list/lowScore', {}, callback);
    },
    search: function (search, callback) {
      restCall('/flay/find', { data: search }, callback);
    },
    find: function (query, callback) {
      restCall('/flay/find/' + query, {}, callback);
    },
    findSync: function (query, callback) {
      restCall('/flay/find/' + query, { async: false }, callback);
    },
    findByTag: function (tag, callback) {
      restCall('/flay/find/tag/' + tag.id, {}, callback);
    },
    findByTagLike: function (tag, callback) {
      restCall('/flay/find/tag/' + tag.id + '/like', {}, callback);
    },
    findByActress: function (actress, callback) {
      let keyword = typeof actress === 'object' ? actress.name : actress;
      restCall('/flay/find/actress/' + keyword, {}, callback);
    },
    findByActressInArchive: function (actress, callback) {
      let keyword = typeof actress === 'object' ? actress.name : actress;
      restCall('/archive/find/actress/' + keyword, {}, callback);
    },
    findByActressAll: (actress, callback) => {
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
    findCandidates: function (callback) {
      restCall('/flay/candidates', { title: 'Find candidates' }, callback);
    },
    acceptCandidates: function (flay, callback) {
      restCall('/flay/candidates/' + flay.opus, { method: 'PATCH' }, callback);
    },
    play: function (flay, callback, callbackData) {
      flay.video.play++;
      restCall('/flay/play/' + flay.opus, { method: 'PATCH' }, callback, null, callbackData);
    },
    subtitles: function (flay) {
      restCall('/flay/edit/' + flay.opus, { method: 'PATCH' });
    },
    rename: function (opus, flay, callback) {
      restCall('/flay/rename/' + opus, { data: flay, method: 'PUT' }, callback);
    },
    openFolder: function (folder) {
      restCall('/flay/open/folder', { method: 'PUT', data: folder });
    },
    deleteFile: function (file, callback) {
      restCall('/flay/delete/file', { method: 'PUT', data: file }, callback);
    },
    deleteFileOnFlay: function (opus, file, callback) {
      restCall('/flay/delete/file/' + opus, { method: 'PUT', data: file }, callback);
    },
  },
  Cover: {
    base64: function (opus, callback) {
      restCall('/static/cover/' + opus + '/base64', { async: false, mimeType: 'text/plain' }, callback);
    },
  },
  Archive: {
    get: function (opus, callback) {
      restCall('/archive/' + opus, {}, callback);
    },
    page: function (page, size, keyword, callback) {
      restCall('/archive/page', { data: { page: page, size: size, keyword: keyword } }, callback);
    },
    list: function (callback, failCallback) {
      restCall('/archive/list', {}, callback, failCallback);
    },
    toInstance: function (opus, callback) {
      restCall('/archive/toInstance/' + opus, { method: 'PATCH' }, callback);
    },
  },
  History: {
    list: function (callback) {
      restCall('/info/history/list', {}, callback);
    },
    find: function (query, callback) {
      restCall('/info/history/find/' + query, {}, callback);
    },
    findAction: function (action, callback) {
      restCall('/info/history/find/action/' + action, {}, callback);
    },
  },
  Video: {
    update: function (video, callback, callbackData) {
      restCall('/info/video', { data: video, method: 'PATCH' }, callback, null, callbackData);
    },
    save: function (video, callback) {
      restCall('/info/video', { data: video, method: 'POST' }, callback);
    },
    list: function (callback) {
      restCall('/info/video/list', {}, callback);
    },
    get: function (opus, callback, failCallback) {
      restCall('/info/video/' + opus, {}, callback, failCallback);
    },
    find: function (keyword, callback) {
      restCall('/info/video/find/' + keyword, {}, callback);
    },
  },
  Studio: {
    findOneByOpus: function (opus, callback) {
      restCall('/info/studio/findOneByOpus/' + opus, {}, callback);
    },
    get: function (name, callback, failCallback) {
      restCall('/info/studio/' + name, {}, callback, failCallback);
    },
    update: function (studio, callback) {
      restCall('/info/studio', { data: studio, method: 'PATCH' }, callback);
    },
  },
  Actress: {
    get: function (name, callback) {
      if (name != '') {
        restCall('/info/actress/' + name, {}, callback);
      } else {
        console.error('Rest.Actress.get: no name!');
      }
    },
    getSync: function (name) {
      if (name != '') {
        let ret = null;
        restCall('/info/actress/' + name, { async: false }, function (actress) {
          ret = actress;
        });
        return ret;
      } else {
        console.error('Rest.Actress.get: no name!');
      }
    },
    list: function (callback, failCallback) {
      restCall('/info/actress/list', {}, callback, failCallback);
    },
    listSync: function (callback, failCallback) {
      restCall('/info/actress/list', { async: false }, callback, failCallback);
    },
    update: function (actress, callback) {
      restCall('/info/actress', { data: actress, method: 'PATCH' }, callback);
    },
    persist: function (actress, callback) {
      restCall('/info/actress', { data: actress, method: 'PUT' }, callback);
    },
    rename: function (originalName, actress, callback) {
      restCall('/info/actress/' + originalName, { data: actress, method: 'PUT' }, callback);
    },
    findByLocalname: function (name, callback) {
      restCall('/info/actress/find/byLocalname/' + name, {}, callback);
    },
    nameCheck: function (limit, callback) {
      restCall('/info/actress/func/nameCheck/' + limit, { title: 'Name checking...' }, callback);
    },
    delete: function (actress, callback) {
      restCall('/info/actress', { data: actress, method: 'DELETE' }, callback);
    },
  },
  Tag: {
    get: function (tagId, callback) {
      restCall('/info/tag/' + tagId, {}, callback);
    },
    list: function (callback) {
      restCall('/info/tag/list', {}, callback);
    },
    create: function (tag, callback) {
      restCall('/info/tag', { data: tag, method: 'POST' }, callback);
    },
    update: function (tag, callback) {
      restCall('/info/tag', { data: tag, method: 'PATCH' }, callback);
    },
    delete: function (tag, callback) {
      restCall('/info/tag', { data: tag, method: 'DELETE' }, callback);
    },
  },
  Image: {
    size: function (callback) {
      if (callback) {
        restCall('/image/size', { async: false }, callback);
      } else {
        var total = 0;
        restCall('/image/size', { async: false }, function (max) {
          total = max;
        });
        return total;
      }
    },
    list: function (callback) {
      restCall('/image/list', {}, callback);
    },
    download: function (data, callback) {
      restCall('/image/pageImageDownload', { data: data, title: 'Download images' }, callback);
    },
    get: function (idx, callback) {
      restCall('/image/' + idx, {}, callback);
    },
    delete: function (idx, callback) {
      restCall('/image/' + idx, { method: 'DELETE' }, callback);
    },
    paint: function (idx) {
      restCall('/image/paint/' + idx, { method: 'PATCH' });
    },
    blobUrl: function (url, thenFunc) {
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
    get: function (url, callback) {
      restCall(url, { contentType: 'text/plain', mimeType: 'text/plain' }, callback);
    },
  },
  Batch: {
    start: function (type, title, callback) {
      restCall('/batch/start/' + type, { method: 'PUT', title: title }, callback);
    },
    check: function (type, title, callback) {
      restCall('/batch/check/' + type, { title: title }, callback);
    },
    setOption: function (type, callback) {
      restCall('/batch/option/' + type, { method: 'PUT' }, callback);
    },
    getOption: function (type, callback) {
      restCall('/batch/option/' + type, {}, callback);
    },
    reload: function (callback) {
      restCall('/batch/reload', { method: 'PUT', title: 'Source reload' }, callback);
    },
  },
  Security: {
    whoami: function (callback) {
      restCall('/security/whoami', { async: false }, callback);
    },
    isAutomaticallyCertificated: function () {
      var result;
      restCall('/security/isAutomaticallyCertificated', { async: false }, function (isAuto) {
        result = Boolean(isAuto);
      });
      return result;
    },
    login: function (username, password, callback, failCallback) {
      $.ajax({
        url: '/html/login.html',
        method: 'POST',
        dataType: 'json',
        data: {
          username: username,
          password: password,
        },
        success: function (response) {
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
    list: function (callback) {
      restCall('/todayis/list', {}, callback);
    },
    play: function (todayis, callback) {
      restCall('/todayis/play', { data: todayis, method: 'PATCH' }, callback);
    },
    delete: function (todayis, callback) {
      restCall('/todayis', { data: todayis, method: 'DELETE' }, callback);
    },
    openFolder: function (folder) {
      restCall('/flay/open/folder', { method: 'PUT', data: folder });
    },
  },
};
