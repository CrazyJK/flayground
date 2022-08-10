import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'bootstrap/dist/js/bootstrap';
import './lib/crazy.jquery';
import './lib/FlayMenu';
import './css/common.scss';
import './info.actress.scss';

import { reqParam, birthRegExp, bodyRegExp, heightRegExp, debutRegExp, Random, NumberUtils } from './lib/crazy.common.js';
import { Rest } from './lib/flay.rest.service.js';
import { Util, Search } from './lib/flay.utils.js';
import { loading } from './lib/flay.loading.js';
import { ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO } from './lib/flay.view.card.js';

import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5locales_ko_KR from '@amcharts/amcharts5/locales/ko_KR';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const name = reqParam.name;
let actress;

const $flayList = $('.flay-list');

$('#favorite').on('click', function () {
  actress.favorite = !actress.favorite;
  var $self = $(this);
  Rest.Actress.update(actress, function () {
    if (actress.favorite) {
      $self.switchClass('fa-heart-o', 'fa-heart favorite');
    } else {
      $self.switchClass('fa-heart favorite', 'fa-heart-o');
    }
  });
});

$('#birth').on('keyup', function () {
  var value = $(this).val().trim();
  $('.actress-age').html(Util.Actress.getAge({ birth: value }));
  $(this).val(value).toggleClass('input-invalid', !birthRegExp.test(value));
});

$('#body').on('keyup', function () {
  var value = $(this)
    .val()
    .trim()
    .replace(/^[A-Z]|\(|カップ\)/gi, '')
    .replace(/\/ [A-Z]/gi, '- ');
  $(this).val(value).toggleClass('input-invalid', !bodyRegExp.test(value));
});

$('#height').on('keyup', function () {
  var value = $(this).val().trim();
  $(this).val(value).toggleClass('input-invalid', !heightRegExp.test(value));
});

$('#debut').on('keyup', function () {
  var value = $(this).val().trim();
  $(this).val(value).toggleClass('input-invalid', !debutRegExp.test(value));
});

$('#search').on('click', function () {
  var keyword = actress.localName != '' ? actress.localName : actress.name;
  Search.actress(keyword);
});

$('input:radio[name="filter"]').on('change', (e) => {
  console.log('filter', $(e.target).val());
  const filterVal = $(e.target).val();
  switch (filterVal) {
    case 'u':
      $('.flay-list > .flay-card').hide();
      $('.flay-list > .flay-card.unrank').show();
      break;
    case 'i':
      $('.flay-list > .flay-card').hide();
      $('.flay-list > .flay-card.instance').show();
      break;
    case 'a':
      $('.flay-list > .flay-card').show();
      break;
  }
});

$('#save').on('click', function () {
  var originalName = actress.name;
  actress.localName = $('#localName').val().trim();
  actress.birth = $('#birth').val().trim();
  actress.body = $('#body').val().trim();
  actress.height = $('#height').val().trim();
  actress.debut = $('#debut').val().trim();
  actress.name = $('#name').val().trim();
  actress.comment = $('#comment').val().trim();

  if (originalName != actress.name) {
    Rest.Actress.rename(originalName, actress, function () {
      location.href = '?name=' + actress.name;
    });
  } else {
    Rest.Actress.update(actress, function () {
      const loadingIndex = loading.on('Updated');
      setTimeout(() => {
        loading.off(loadingIndex);
      }, 3 * 1000);
    });
  }
});

$('#delete').on('click', function () {
  if (confirm('confirm your order. delete this?')) {
    Rest.Actress.delete(actress, function () {
      self.close();
    });
  }
});

Rest.Actress.get(name, (_actress_) => {
  actress = _actress_;
  document.title = actress.name + ' - ' + document.title;

  $('#name').val(actress.name);
  $('#localName').val(actress.localName);
  $('#birth').val(actress.birth).trigger('keyup');
  $('#body').val(actress.body);
  $('#height').val(actress.height.ifNotZero());
  $('#debut').val(actress.debut.ifNotZero());
  $('#comment').val(actress.comment);
  if (!actress.favorite) {
    $('.fa-heart').removeClass('favorite fa-heart').addClass('fa-heart-o');
  }
  if (actress.coverSize > 0) {
    $('nav.navbar').hover(
      () => {
        $('.actress-cover-wrapper').css({
          background: 'rgba(0,0,0,0.75) url("/static/actress/' + actress.name + '/' + Random.getInteger(0, actress.coverSize - 1) + '") center top / contain no-repeat',
        });
      },
      () => {}
    );
  }

  Promise.all([
    new Promise((resolve) => {
      Rest.Flay.findByActress(actress, resolve);
    }),
    new Promise((resolve) => {
      Rest.Flay.findByActressInArchive(actress, resolve);
    }),
  ]).then(([instanceList, archiveList]) => {
    const flayAllList = [...instanceList, ...archiveList].sort((flay1, flay2) => {
      return $.trim(flay2.release).toLowerCase().localeCompare($.trim(flay1.release));
    });

    $('.filter-cnt-instance').html(instanceList.length);
    $('.filter-cnt-all-flay').html(flayAllList.length);

    const { avg, sd } = NumberUtils.calculateStandardDeviation(...flayAllList.map((flay) => flay.video.rank));
    $('#averageRank').html(avg.toFixed(1));
    $('#standardDeviation').html(sd.toFixed(1));
    $('.filter-cnt-unrank').html(instanceList.filter((flay) => flay.video.rank === 0).length);

    renderChart(flayAllList);

    displayFlayList(flayAllList).then(() => {
      console.log('completed load');
      $('#filter-i').click();
    });
  });
});

async function displayFlayList(flayList) {
  for (const flay of flayList) {
    $flayList.appendFlayCard(flay, {
      width: 330,
      exclude: [ACTRESS, MODIFIED, RANK, COMMENT, FILEINFO],
      fontSize: '80%',
      archive: flay.archive,
      class: flay.archive ? 'archive' : 'instance' + (flay.video.rank === 0 ? ' unrank' : ''),
    });

    await sleep(100);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderChart(flayList) {
  let root = am5.Root.new('chartdiv');
  root.setThemes([am5themes_Animated.new(root)]);
  root.locale = am5locales_ko_KR;

  let chart = root.container.children.push(am5xy.XYChart.new(root, {}));

  let xAxis = chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      baseInterval: {
        timeUnit: 'day',
        count: 1,
      },
      renderer: am5xy.AxisRendererX.new(root, { inside: false }),
    })
  );

  let xRenderer = xAxis.get('renderer');
  xRenderer.labels.template.setAll({
    fill: am5.color(0xffffff),
    fontSize: '12px',
  });

  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: -2,
      max: 6,
      renderer: am5xy.AxisRendererY.new(root, { inside: true, minGridDistance: 20 }),
    })
  );

  let yRenderer = yAxis.get('renderer');
  yRenderer.labels.template.setAll({ visible: false });

  let series = chart.series.push(
    am5xy.SmoothedXLineSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: 'value',
      valueXField: 'date',
    })
  );

  let rangeDataItem = yAxis.makeDataItem({
    value: 1000,
    endValue: 0,
  });

  let range = series.createAxisRange(rangeDataItem);

  series.strokes.template.setAll({ strokeWidth: 2 });
  range.strokes.template.setAll({ stroke: am5.color(0xff621f) });

  series.fills.template.setAll({ fillOpacity: 0.1, visible: true });
  range.fills.template.setAll({ fill: am5.color(0xff621f) });

  series.bullets.push(function () {
    return am5.Bullet.new(root, {
      sprite: am5.Circle.new(root, {
        radius: 3,
        fill: am5.color(0xffa500),
      }),
    });
  });

  series.data.processor = am5.DataProcessor.new(root, {
    dateFormat: 'yyyy.MM.dd',
    dateFields: ['date'],
  });

  series.data.setAll(
    flayList.map((flay) => {
      return {
        date: flay.release,
        value: flay.archive ? -1 : flay.video.rank,
      };
    })
  );

  chart.appear(1000, 100);
}
