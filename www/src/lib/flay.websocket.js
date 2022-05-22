/**
 * flaygound websocket
 * ref. http://jmesnil.net/stomp-websocket/doc/
 */

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { LocalStorageItem } from './crazy.common.js';
import './flay.websocket.scss';

class FlayWebsocket {
  constructor() {
    this.STOMP_ENDPOINT = 'https://flay.kamoru.jk/flayground-websocket';

    this.TOPIC_ANNOUNCE = '/topic/announce';
    this.TOPIC_ANNOUNCE_TO = '/user/topic/announce';
    this.TOPIC_SAY = '/topic/say';
    this.TOPIC_SAY_TO = '/user/topic/say';
    this.QUEUE_INFO = '/user/queue/info';

    this.ANNOUNCE_WRAPPER = 'announceWrapper';

    this.MAX_RETRY_COUNT = 5;
    this.retryCount = 0;
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
      console.log('flayWebsocket', 'switch is not exist. will be connected automatically');
      this.connect();
    }

    // if wrapper not exist, insert
    if ($('#' + this.ANNOUNCE_WRAPPER).length === 0) {
      $('body > footer').append(`<div id="${this.ANNOUNCE_WRAPPER}" class="announce-container"></div>`);
    }
  }

  connect() {
    this.stompClient = Stomp.over(new SockJS(this.STOMP_ENDPOINT));

    // client.connect(headers, connectCallback, errorCallback);
    this.stompClient.connect(
      {},
      (connect) => {
        console.log('[FlayWebsocket] connected', connect);
        this.retryCount = 0;
        this.username = connect.headers['user-name'];
        this.showMessage(connect);
        this.subscribe();
      },
      (error) => {
        console.error('[FlayWebsocket] error', error);
        this.showMessage({
          command: 'ERROR',
          content: error,
        });

        if (this.retryCount < this.MAX_RETRY_COUNT) {
          setTimeout(() => {
            this.retryCount++;
            this.connect();
          }, 1000 * 5);
        }
      }
    );

    this.stompClient.debug = (str) => {
      console.debug('stomp debug', str);
    };
  }

  disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect(() => {
        console.log('[FlayWebsocket] disconnected');
        this.showMessage({
          command: 'DISCONNECTED',
        });
      });
    }
  }

  subscribe() {
    const announceSubscription = this.stompClient.subscribe(this.TOPIC_ANNOUNCE, (message) => {
      console.debug('[FlayWebsocket] announce', message);
      message.ack();
      this.showMessage(message, 'ANNOUNCE');
    });
    console.debug('[FlayWebsocket] subscription announce', announceSubscription);

    const announceToSubscription = this.stompClient.subscribe(this.TOPIC_ANNOUNCE_TO, (message) => {
      console.debug('[FlayWebsocket] announce to', message);
      message.ack();
      this.showMessage(message, 'ANNOUNCE');
    });
    console.debug('[FlayWebsocket] subscription announce to', announceToSubscription);

    const saySubscription = this.stompClient.subscribe(this.TOPIC_SAY, (message) => {
      console.debug('[FlayWebsocket] say', message);
      message.ack();
      this.showMessage(message, 'SAY');
    });
    console.debug('[FlayWebsocket] subscription say', saySubscription);

    const sayToSubscription = this.stompClient.subscribe(this.TOPIC_SAY_TO, (message) => {
      console.debug('[FlayWebsocket] say to', message);
      message.ack();
      this.showMessage(message, 'SAY');
    });
    console.debug('[FlayWebsocket] subscription say to', sayToSubscription);

    const queueInfoSubscription = this.stompClient.subscribe(this.QUEUE_INFO, (message) => {
      console.debug('[FlayWebsocket] queue', message);
      message.ack();
      this.infoCallback(message);
    });
    console.debug('[FlayWebsocket] subscription queueInfo', queueInfoSubscription);
  }

  say(message, to) {
    this.stompClient.send(
      '/flayground/say' + (to ? 'To' : ''),
      {
        to: to,
      },
      JSON.stringify({
        name: this.username,
        content: message,
      })
    );
  }

  info(payLoad) {
    this.stompClient.send(
      '/flayground/info',
      {},
      JSON.stringify({
        name: this.username,
        content: payLoad,
      })
    );
  }

  showMessage(message, type) {
    const notification = {
      id: '',
      title: '',
      content: '',
      time: new Date(),
    };

    switch (message.command) {
      case 'CONNECTED':
        notification.title = 'Connected';
        notification.content = 'signed in ' + this.username;
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

    const $noti = $(`
			<div id="${notification.id}" class="announce">
				<i class="fa fa-bell bell"></i>
				<i class="fa fa-times hover remove" onclick="$(this).parent().remove()"></i>
				<small class="time">${notification.time.format('a/p hh:mm')}</small>
				<div class="announce-body">
					<h6 class="announce-title">
						${type === 'SAY' ? '<span class="announce-from">From</span>' : ''}
						${notification.title}
					</h6>
					<div class="announce-desc">${notification.content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>
				</div>
			</div>`)
      .appendTo($('#' + this.ANNOUNCE_WRAPPER))
      .show('blind', { direction: 'right' });

    setTimeout(() => {
      $noti.hide('slide', { direction: 'right' }, 400, () => {
        // nothing
        // $noti.remove();
      });
    }, 1000 * 5);
  }

  infoCallback(message) {
    const messageBody = JSON.parse(message.body);

    console.log('infoCallback', messageBody);

    if (messageBody.content === 'bgtheme') {
      const bgThemeValue = LocalStorageItem.get('flay.bgtheme', 'dark');
      document.getElementsByTagName('html')[0].setAttribute('data-theme', bgThemeValue);
    } else if (messageBody.content === 'bgcolor') {
      const bgColor = LocalStorageItem.get('flay.bgcolor', '#000000');
      $('body').css({ backgroundColor: bgColor });
    } else {
      const content = JSON.parse(messageBody.content.replace(/&quot;/g, '"'));
      console.log('content', content);

      if (content.mode === 'grap') {
        if (typeof grapFlay === 'function') {
          // eslint-disable-next-line no-undef
          grapFlay(content.opus);
        }
      } else {
        alert('unknown content mode');
      }
    }
  }
}

const flayWebsocket = new FlayWebsocket();
flayWebsocket.initiate();

export default flayWebsocket;
