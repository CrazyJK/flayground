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

var consoleDebug = console.debug;
// consoleDebug = () => {};

const ANNOUNCE_WRAPPER_ID = 'announceWrapper';

class FlayWebsocket {
  constructor() {
    this.STOMP_ENDPOINT = '/flayground-websocket';

    this.TOPIC_ANNOUNCE = '/topic/announce';
    this.TOPIC_ANNOUNCE_TO = '/user/topic/announce';
    this.TOPIC_SAY = '/topic/say';
    this.TOPIC_SAY_TO = '/user/topic/say';
    this.QUEUE_INFO = '/user/queue/info';

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
      consoleDebug('flayWebsocket', 'switch is not exist. will be connected automatically');
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
      consoleDebug('stomp debug', str);
    };
    this.stompClient.connect(
      {},
      (connect) => {
        consoleDebug('[FlayWebsocket] connected', connect);
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
        consoleDebug('[FlayWebsocket] disconnected');
        showMessage({ command: 'DISCONNECTED' });
      });
    }
  }

  subscribe() {
    const announceSubscription = this.stompClient.subscribe(this.TOPIC_ANNOUNCE, (message) => {
      consoleDebug('[FlayWebsocket] announce', message);
      message.ack();
      showMessage(message, 'ANNOUNCE');
    });
    consoleDebug('[FlayWebsocket] subscription announce', announceSubscription);

    const announceToSubscription = this.stompClient.subscribe(this.TOPIC_ANNOUNCE_TO, (message) => {
      consoleDebug('[FlayWebsocket] announce to', message);
      message.ack();
      showMessage(message, 'ANNOUNCE');
    });
    consoleDebug('[FlayWebsocket] subscription announce to', announceToSubscription);

    const saySubscription = this.stompClient.subscribe(this.TOPIC_SAY, (message) => {
      consoleDebug('[FlayWebsocket] say', message);
      message.ack();
      showMessage(message, 'SAY');
    });
    consoleDebug('[FlayWebsocket] subscription say', saySubscription);

    const sayToSubscription = this.stompClient.subscribe(this.TOPIC_SAY_TO, (message) => {
      consoleDebug('[FlayWebsocket] say to', message);
      message.ack();
      showMessage(message, 'SAY');
    });
    consoleDebug('[FlayWebsocket] subscription say to', sayToSubscription);

    const queueInfoSubscription = this.stompClient.subscribe(this.QUEUE_INFO, (message) => {
      consoleDebug('[FlayWebsocket] queue', message);
      // message.ack();
      infoCallback(message);
    });
    consoleDebug('[FlayWebsocket] subscription queueInfo', queueInfoSubscription);
  }

  say(message, to) {
    this.stompClient.send('/flayground/say' + (to ? 'To' : ''), { to: to }, JSON.stringify({ name: this.username, content: message }));
    consoleDebug(`[FlayWebsocket] send say ${message} to ${to}`);
  }

  info(payLoad) {
    this.stompClient.send('/flayground/info', { to: this.username }, JSON.stringify(payLoad));
    consoleDebug(`[FlayWebsocket] send info ${payLoad}`);
  }
}

const InfoCallMethods = {
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
  batch: (notification) => {
    if (typeof batchFeedback === 'function') {
      // eslint-disable-next-line no-undef
      batchFeedback(notification);
      return;
    }
  },
};

const infoCallback = (message) => {
  const messageBody = JSON.parse(message.body);
  const messageBodyContent = JSON.parse(messageBody.content.replace(/&quot;/g, '"'));
  consoleDebug('messageBodyContent', messageBodyContent);

  InfoCallMethods[messageBodyContent.mode](messageBodyContent);
};

const showMessage = (message, type) => {
  const notification = {
    type: message.command,
    id: '',
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
      notification.title = body.title;
      notification.content = body.content;
      notification.time.setTime(body.time);
      break;
    }
    default:
      throw new TypeError('unknown message command');
  }

  consoleDebug('notification', notification);
  if (notification.type === 'MESSAGE' && (notification.title === 'Batch' || notification.title === 'Backup')) {
    if (typeof batchFeedback === 'function') {
      // eslint-disable-next-line no-undef
      batchFeedback(notification);
      return;
    }
  }

  const $noti = $(`
    <div id="${notification.id}" class="announce">
      <i class="fa fa-bell bell"></i>
      <i class="fa fa-times hover remove" onclick="this.parentElement.remove()"></i>
      <small class="time">${notification.time.format('a/p hh:mm')}</small>
      <div class="announce-body">
        <h6 class="announce-title">
          ${type === 'SAY' ? '<span class="announce-from">From</span>' : ''}
          ${notification.title}
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
