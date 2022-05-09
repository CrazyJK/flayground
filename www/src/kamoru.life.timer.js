import $ from 'jquery';
import './lib/kamoru.life.timer';
import './css/common.scss';
import './kamoru.life.timer.scss';

$('#lifeTimerWrap').lifeTimer({
  classes: 'text-center text-light',
  mode: 'remain',
  pattern: 'dayD hh:mm:ss',
  progress: true,
});

$('#starting').html('1976');
$('#deadline').html('2031');
