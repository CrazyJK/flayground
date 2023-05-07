/**
 * subtitles js
 */
import './find.subtitles.scss';
import FlayAction from './util/flay.action';
import './util/theme.listener';

let noSubtitlesOpusList = [];
let intervalFindSubtitles = -1;
let foundSubtitlesCount = 0;
let currentFindingIndex = 0;
let flayList = [];

const processStart = () => {
  const findSubtitles = () => {
    ++currentFindingIndex;
    const opus = noSubtitlesOpusList.shift();
    const flayItem = document.querySelector('#opus_' + opus + '');
    const subtitles = document.querySelector('#opus_' + opus + ' > .flay-subtitles');
    subtitles.innerHTML = 'finding...';

    // const $sub = $('#' + opus + ' > .flay-subtitles').html('finding...'); // mark current active
    FlayAction.subtitlesUrlIfFound(opus, (result) => {
      if (result.error === '') {
        if (result.url.length > 0) {
          // counting found subtitles
          foundSubtitlesCount++;
          document.querySelector('#foundSubtitlesCount').innerHTML = foundSubtitlesCount; // mark found count

          subtitles.textContent = null;
          flayItem.classList.add('found-subtitles');
          // add found link
          for (const url of result.url) {
            let a = subtitles.appendChild(document.createElement('a'));
            a.href = url;
            a.innerHTML = 'Found';
            a.addEventListener('click', (e) => {
              e.target.remove();
            });
          }
        } else {
          // not found
          subtitles.innerHTML = `<span class="disable">not found</span>`;
        }
      } else {
        // error
        subtitles.innerHTML = `<span class="error">${result.error}</span>`;
      }
    });
    // scroll move
    const itemPerPage = Math.round(window.innerHeight / 28);
    if (currentFindingIndex > itemPerPage && currentFindingIndex % itemPerPage === 1) {
      let offsetTop = flayItem.offsetTop;
      // $('#flayList').animate({ scrollTop: offsetTop - 60 }, 500);
      document.querySelector('html').scrollTop = offsetTop - 60;
      console.log('itemPerPage', itemPerPage, 'currentFindingIndex', currentFindingIndex, `${opus} offsetTop`, offsetTop);
    }
  };

  // initiate
  document.querySelector('#btnStopFinding').style.display = 'block';
  document.querySelector('#btnFindSubtitles').style.display = 'none';
  document.querySelector('#btnFilterFound').style.display = 'none';
  document.querySelector('#foundSubtitlesCount').innerHTML = '0';
  intervalFindSubtitles = -1;
  foundSubtitlesCount = 0;

  // first call
  // findSubtitles();

  // interval call
  intervalFindSubtitles = setInterval(() => {
    findSubtitles();
    if (noSubtitlesOpusList.length === 0) {
      processStop();
    }
  }, 500);
};

const processStop = () => {
  clearInterval(intervalFindSubtitles);
  if (noSubtitlesOpusList.length === 0) {
    document.querySelector('#btnFindSubtitles').style.display = 'none';
    document.querySelector('#btnStopFinding').style.display = 'none';
  } else {
    document.querySelector('#btnFindSubtitles').innerHTML = 'Resume';
  }
  document.querySelector('#btnStopFinding').style.display = 'none';
  document.querySelector('#btnFindSubtitles').style.display = 'block';
  document.querySelector('#btnFilterFound').style.display = 'block';
};

const displayList = (e) => {
  // filter rank
  const selectedRank = [];
  document.querySelectorAll("input[name='rank']:checked").forEach((rank) => {
    selectedRank.push(Number(rank.value));
  });

  // initiate
  document.querySelector('#btnFindSubtitles').style.display = 'block';
  document.querySelector('#btnFindSubtitles').innerHTML = 'Find';
  document.querySelector('#btnStopFinding').style.display = 'none';
  document.querySelector('#btnFilterFound').style.display = 'none';
  document.querySelector('#flayList').textContent = null;
  noSubtitlesOpusList = [];
  currentFindingIndex = 0;

  // sorting by release
  flayList
    .filter((flay) => {
      return flay.files.subtitles.length === 0 && selectedRank.includes(flay.video.rank);
    })
    .sort((a, b) => {
      const c1 = b.video.rank - a.video.rank;
      return c1 === 0 ? b.release.localeCompare(a.release) : c1;
    })
    .forEach((flay, count) => {
      noSubtitlesOpusList.push(flay.opus);

      let flayItem = document.querySelector('#flayList').appendChild(document.createElement('div'));
      flayItem.id = 'opus_' + flay.opus;
      flayItem.setAttribute('rank', flay.video.rank);
      flayItem.classList.add('flay-item');
      flayItem.innerHTML = `
          <label class="flay-count">${++count}</label>
          <label class="flay-studio">${flay.studio}</label>
          <label class="flay-opus">${flay.opus}</label>
          <label class="flay-title hover">${flay.title}</label>
          <label class="flay-actressList">${flay.actressList}</label>
          <label class="flay-release">${flay.release}</label>
          <label class="flay-rank">${flay.video.rank > 0 ? flay.video.rank : ''}</label>
          <label class="flay-tag">${ifTag(flay, 90)}</label>
          <label class="flay-subtitles"></label>
        `;
      flayItem.addEventListener('click', (e) => {
        if (e.target.classList.contains('flay-title')) {
          // view flay card
          window.open('card.flay.html?opus=' + flay.opus, flay.opus, 'width=800px,height=536px');
        } else if (e.target.tagName === 'A') {
          // click subtiles link
          flayItem.classList.add('active-subtitles');
        }
      });
    });

  document.querySelector('#flayCount').innerHTML = noSubtitlesOpusList.length; // mark total count
};

const ifTag = (flay, tagId) => {
  if (flay.video.tags.length > 0) {
    for (const tag of flay.video.tags) {
      if (tag.id === tagId) {
        return tag.name;
      }
    }
  }
  return '';
};

// start find
document.querySelector('#btnFindSubtitles').addEventListener('click', processStart);

// stop find
document.querySelector('#btnStopFinding').addEventListener('click', processStop);

// filter found subtitles
document.querySelector('#btnFilterFound').addEventListener('click', () => {
  document.querySelectorAll('.flay-item:not(.found-subtitles)').forEach((item) => {
    item.classList.toggle('hide');
  });
});

document.querySelectorAll("input[name='rank']").forEach((rank) => rank.addEventListener('change', displayList));

fetch('/flay/list')
  .then((res) => res.json())
  .then((list) => {
    flayList = list;
  })
  .then(displayList);
