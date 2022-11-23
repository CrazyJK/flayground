/**
 * flaygound websocket
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { LocalStorageItem } from './crazy.common.js';
import './flay.websocket.scss';

const ANNOUNCE_WRAPPER_ID = 'announceWrapper';

class FlayWebsocket {
  constructor() {
    this.STOMP_ENDPOINT = '/flayground-websocket';

    this.USER = '/user';
    this.TOPIC_MESSAGE = '/topic/message';
    this.TOPIC_SAY = '/topic/say';
    this.QUEUE_DATA = '/queue/data';

    this.MAX_RETRY_COUNT = 5;
    this.retryCount = 0;
    this.stompClient = null;
  }

  initiate() {
    // add event for switch
    const $websocketSwitch = $('#notification');
    if ($websocketSwitch.length > 0) {
      $websocketSwitch
        .on('change', (e) => {
          if ($(e.target).prop('checked')) {
            this.connect();
          } else {
            this.disconnect();
          }
        })
        .trigger('change');
    } else {
      console.debug('flayWebsocket', 'switch is not exist. will be connected automatically');
      this.connect();
    }

    // if wrapper not exist, insert
    if ($('#' + ANNOUNCE_WRAPPER_ID).length === 0) {
      $('body > footer').append(`<div id="${ANNOUNCE_WRAPPER_ID}" class="announce-container"></div>`);
    }
  }

  connect() {
    this.stompClient = Stomp.over(new SockJS(this.STOMP_ENDPOINT));
    this.stompClient.debug = (str) => {
      // console.debug('[stomp debug]', str);
    };
    this.stompClient.connect(
      {},
      (connect) => {
        console.debug('[FlayWebsocket] connected', connect);
        this.retryCount = 0;
        this.username = connect.headers['user-name'];
        showMessage(connect);
        this.subscribe();
      },
      (error) => {
        console.error('[FlayWebsocket] error', error);
        if (this.retryCount < this.MAX_RETRY_COUNT) {
          setTimeout(() => {
            this.retryCount++;
            this.connect();
          }, 1000 * 5);
        } else {
          showMessage({ command: 'ERROR', content: error });
        }
      }
    );
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect(() => {
        console.warn('[FlayWebsocket] disconnected');
        showMessage({ command: 'DISCONNECTED' });
      });
    }
  }

  subscribe() {
    this.stompClient.subscribe(this.TOPIC_MESSAGE, (message) => {
      console.debug('[FlayWebsocket] TOPIC_MESSAGE', message);
      message.ack();
      showMessage(message);
    });

    this.stompClient.subscribe(this.USER + this.TOPIC_MESSAGE, (message) => {
      console.debug('[FlayWebsocket] USER TOPIC_MESSAGE', message);
      message.ack();
      showMessage(message);
    });

    this.stompClient.subscribe(this.TOPIC_SAY, (message) => {
      console.debug('[FlayWebsocket] TOPIC_SAY', message);
      message.ack();
      showMessage(message);
    });

    this.stompClient.subscribe(this.USER + this.TOPIC_SAY, (message) => {
      console.debug('[FlayWebsocket] USER TOPIC_SAY', message);
      message.ack();
      showMessage(message);
    });

    this.stompClient.subscribe(this.QUEUE_DATA, (message) => {
      console.debug('[FlayWebsocket] QUEUE_DATA', message);
      // message.ack();
      queueDataCallback(message);
    });

    this.stompClient.subscribe(this.USER + this.QUEUE_DATA, (message) => {
      console.debug('[FlayWebsocket] USER QUEUE_DATA', message);
      // message.ack();
      queueDataCallback(message);
    });
  }

  /**
   * 대화 전달
   * @param {*} message
   * @param {*} to 생략시 모두에게
   */
  say(message, to) {
    to = to ? to : '';
    this.stompClient.send('/flayground/say', { from: this.username, to: to }, message);
    console.log(`[FlayWebsocket] send say: ${message} to ${to}`);
  }

  /**
   * 데이터 전달
   * @param {JSON} payLoad
   * @param {*} to 생략시 자기 자신
   */
  data(payLoad, to) {
    to = to ? to : this.username;
    this.stompClient.send('/flayground/data', { from: this.username, to: to }, JSON.stringify(payLoad));
    console.log(`[FlayWebsocket] send data: ${payLoad} to ${to}`);
  }
}

const QueueDataCallbackMethods = {
  bgtheme: () => {
    const bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'dark');
    document.getElementsByTagName('html')[0].setAttribute('data-theme', bgThemeValue);
  },
  bgcolor: () => {
    const bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');
    $('body').css({ backgroundColor: bgColor });
  },
  grap: ({ opus }) => {
    if (typeof grapFlay === 'function') {
      // eslint-disable-next-line no-undef
      grapFlay(opus);
    }
  },
  batch: ({ data }) => {
    if (typeof batchFeedback === 'function') {
      // eslint-disable-next-line no-undef
      batchFeedback(data);
      return;
    }
  },
};

const queueDataCallback = (message) => {
  const messageBody = JSON.parse(message.body);
  console.debug('messageBody', messageBody);

  let messageBodyContent = messageBody.content;
  if (typeof messageBodyContent === 'string') {
    messageBodyContent = JSON.parse(messageBody.content.replace(/&quot;/g, '"'));
  }
  console.debug('messageBodyContent', messageBodyContent);

  QueueDataCallbackMethods[messageBodyContent.mode](messageBodyContent);
};

const showMessage = (message) => {
  const notification = {
    command: message.command,
    id: '',
    type: '',
    from: '',
    to: '',
    title: '',
    content: '',
    time: new Date(),
  };

  switch (message.command) {
    case 'CONNECTED':
      notification.title = 'Connected';
      notification.content = 'signed in ' + message.headers['user-name'];
      break;
    case 'DISCONNECTED':
      notification.title = 'Disconnected';
      break;
    case 'ERROR':
      notification.title = '<span style="color: #dc3545">Error</span>';
      notification.content = message.content;
      break;
    case 'MESSAGE': {
      const body = JSON.parse(message.body);
      notification.id = message.headers['message-id'];
      notification.type = body.type;
      notification.from = body.from;
      notification.to = body.to;
      notification.title = body.subject;
      notification.content = body.content;
      notification.time.setTime(body.time);
      break;
    }
    default:
      throw new TypeError('unknown message command');
  }
  console.debug('notification', notification);

  const $noti = $(`
    <div id="${notification.id}" class="announce">
      <i class="fa fa-bell bell"></i>
      <i class="fa fa-times hover remove" onclick="this.parentElement.remove()"></i>
      <small class="time">${notification.time.format('a/p hh:mm')}</small>
      <div class="announce-body">
        <h6 class="announce-title">
    ${(() => {
      let html = '';
      if (notification.type === '/say') {
        html += '<span class="announce-from">From</span> ' + notification.from;
      } else {
        html += notification.title;
      }
      return html;
    })()}
        </h6>
        <div class="announce-desc">${notification.content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>
      </div>
    </div>`)
    .appendTo($('#' + ANNOUNCE_WRAPPER_ID))
    .show('blind', { direction: 'right' });

  setTimeout(() => {
    $noti.hide('slide', { direction: 'right' }, 400, () => {
      // nothing
      // $noti.remove();
    });
  }, 1000 * 5);
};

export let flayWebsocket = new FlayWebsocket();
flayWebsocket.initiate();

// setTimeout(() => {
//   flayWebsocket.say('blar~ blar~ blar');
//   flayWebsocket.say('blar~ blar~ blar', 'local');
// }, 1000 * 3);
