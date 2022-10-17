import bb, { bubble, zoom } from 'billboard.js';
import './flay.lastPlayed.scss';
import { DateUtils } from './lib/crazy.common';
import { Rest } from './lib/flay.rest.service';

Rest.Flay.list((list) => {
  const playedMap = new Map();

  Array.from(list).forEach((f) => {
    let lastPlayDate = DateUtils.format('yyyy-MM-dd', f.video.lastPlay);
    // console.log(lastPlayDate);

    if (!playedMap.has(lastPlayDate)) {
      playedMap.set(lastPlayDate, [0, 0, 0, 0, 0, 0]);
    }

    playedMap.get(lastPlayDate)[f.video.rank] += 1;
  });

  const playedDate = ['x'];
  const rank0 = ['rank0'];
  const rank1 = ['rank1'];
  const rank2 = ['rank2'];
  const rank3 = ['rank3'];
  const rank4 = ['rank4'];
  const rank5 = ['rank5'];

  playedMap.forEach((v, k) => {
    // console.log(k, v);
    playedDate.push(k);
    rank0.push([0, v[0]]);
    rank1.push([10, v[1]]);
    rank2.push([20, v[2]]);
    rank3.push([30, v[3]]);
    rank4.push([40, v[4]]);
    rank5.push([50, v[5]]);
  });

  var chart = bb.generate({
    data: {
      x: 'x',
      columns: [playedDate, rank1, rank2, rank3, rank4, rank5],
      type: bubble(), // for ESM specify as: line()
      groups: [['rank1', 'rank2', 'rank3', 'rank4', 'rank5']],
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d',
        },
      },
      y: {
        show: false,
        min: 0,
        max: 50,
        tick: {
          show: false,
          text: {
            show: false,
          },
        },
      },
    },
    zoom: {
      enabled: zoom(), // for ESM specify as: zoom()
      // type: 'drag',
    },
    bindto: '#lastPlayedChart',
  });
});
