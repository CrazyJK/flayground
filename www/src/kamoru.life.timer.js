import $ from 'jquery';

import './lib/kamoru.life.timer';

import './kamoru.life.timer.scss';
import './styles/common.scss';

$('#lifeTimerWrap').lifeTimer({
  classes: 'text-center text-light',
  mode: 'remain',
  pattern: 'dayD hh:mm:ss',
  progress: true,
});

$('#starting').html('1976');
$('#deadline').html('2031');
