import FlayAction from '../util/FlayAction';
import './SubtitlesFinder.scss';

const HTML = `
<div class="header">
  <div class="check-group">
    <input type="checkbox" name="rank" id="rank0" value="0" />
    <label for="rank0">0</label>
    <input type="checkbox" name="rank" id="rank1" value="1" />
    <label for="rank1">1</label>
    <input type="checkbox" name="rank" id="rank2" value="2" />
    <label for="rank2">2</label>
    <input type="checkbox" name="rank" id="rank3" value="3" />
    <label for="rank3">3</label>
    <input type="checkbox" name="rank" id="rank4" value="4" />
    <label for="rank4">4</label>
    <input type="checkbox" name="rank" id="rank5" value="5" />
    <label for="rank5">5</label>
  </div>
  <label><em id="foundSubtitlesCount">0</em> / <em id="flayCount">0</em> Flay</label>
  <button id="btnFindSubtitles">Find</button>
  <button id="btnStopFinding" style="display: none">Pause</button>
  <button id="btnFilterFound" style="display: none">toggle Found</button>
</div>
<div id="flayList"></div>
`;

export default class SubtitlesFinder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다

    const link = this.shadowRoot.appendChild(document.createElement('link'));
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'style.css';

    const wrapper = this.shadowRoot.appendChild(document.createElement('div'));
    wrapper.classList.add(this.tagName.toLowerCase());
    wrapper.innerHTML = HTML;
  }

  connectedCallback() {
    let noSubtitlesOpusList = [];
    let intervalFindSubtitles = -1;
    let foundSubtitlesCount = 0;
    let currentFindingIndex = 0;
    let flayList = [];

    const processStart = () => {
      const findSubtitles = () => {
        ++currentFindingIndex;
        const opus = noSubtitlesOpusList.shift();
        const flayItem = this.shadowRoot.querySelector('#opus_' + opus + '');
        const subtitles = this.shadowRoot.querySelector('#opus_' + opus + ' > .subtitles');
        subtitles.innerHTML = 'finding...';

        // const $sub = $('#' + opus + ' > .flay-subtitles').html('finding...'); // mark current active
        FlayAction.subtitlesUrlIfFound(
          opus,
          (result) => {
            if (result.error === '') {
              if (result.url.length > 0) {
                // counting found subtitles
                foundSubtitlesCount++;
                this.shadowRoot.querySelector('#foundSubtitlesCount').innerHTML = foundSubtitlesCount; // mark found count

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
          },
          (error) => {
            console.log('error', error);
            subtitles.innerHTML = `<span class="error" title="${error.message.replace(/"/g, "'")}">Error</span>`;
          }
        );
        // scroll move
        // const scrollable = this.parentElement.closest('.scrollable');
        const scrollable = this.shadowRoot.querySelector('#flayList').parentElement;
        const itemPerPage = Math.round(scrollable.clientHeight / 28);
        // console.log('scrollable.clientHeight', scrollable.clientHeight, 'currentFindingIndex', currentFindingIndex, 'currentFindingIndex % itemPerPage', currentFindingIndex % itemPerPage);
        if (currentFindingIndex > itemPerPage && currentFindingIndex % itemPerPage === 1) {
          let offsetTop = flayItem.offsetTop;
          console.log('itemPerPage', itemPerPage, 'currentFindingIndex', currentFindingIndex, `${opus} offsetTop`, offsetTop, scrollable);
          // this.shadowRoot.querySelector('html').scrollTop = offsetTop - 60;
          scrollable.scrollTop = offsetTop - 60;
        }
      };

      // initiate
      this.shadowRoot.querySelector('#btnStopFinding').style.display = 'block';
      this.shadowRoot.querySelector('#btnFindSubtitles').style.display = 'none';
      this.shadowRoot.querySelector('#btnFilterFound').style.display = 'none';
      this.shadowRoot.querySelector('#foundSubtitlesCount').innerHTML = '0';
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
        this.shadowRoot.querySelector('#btnFindSubtitles').style.display = 'none';
        this.shadowRoot.querySelector('#btnStopFinding').style.display = 'none';
      } else {
        this.shadowRoot.querySelector('#btnFindSubtitles').innerHTML = 'Resume';
      }
      this.shadowRoot.querySelector('#btnStopFinding').style.display = 'none';
      this.shadowRoot.querySelector('#btnFindSubtitles').style.display = 'block';
      this.shadowRoot.querySelector('#btnFilterFound').style.display = 'block';
    };

    const displayList = (e) => {
      // filter rank
      const selectedRank = [];
      this.shadowRoot.querySelectorAll("input[name='rank']:checked").forEach((rank) => {
        selectedRank.push(Number(rank.value));
      });

      // initiate
      this.shadowRoot.querySelector('#btnFindSubtitles').style.display = 'block';
      this.shadowRoot.querySelector('#btnFindSubtitles').innerHTML = 'Find';
      this.shadowRoot.querySelector('#btnStopFinding').style.display = 'none';
      this.shadowRoot.querySelector('#btnFilterFound').style.display = 'none';
      this.shadowRoot.querySelector('#flayList').textContent = null;
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

          let flayItem = this.shadowRoot.querySelector('#flayList').appendChild(document.createElement('div'));
          flayItem.id = 'opus_' + flay.opus;
          flayItem.setAttribute('rank', flay.video.rank);
          flayItem.classList.add('flay-item');
          flayItem.innerHTML = `
            <label class="count">${++count}</label>
            <label class="studio">${flay.studio}</label>
            <label class="opus">${flay.opus}</label>
            <label class="title">${flay.title}</label>
            <label class="actressList">${flay.actressList}</label>
            <label class="release">${flay.release}</label>
            <label class="rank">${flay.video.rank > 0 ? flay.video.rank : ''}</label>
            <label class="tag">${ifTag(flay, 90)}</label>
            <label class="subtitles"></label>
          `;
          flayItem.addEventListener('click', (e) => {
            if (e.target.classList.contains('title')) {
              // view flay card
              window.open('popup.flay-card.html?opus=' + flay.opus, flay.opus, 'width=800px,height=536px');
            } else if (e.target.tagName === 'A') {
              // click subtiles link
              flayItem.classList.add('active-subtitles');
            }
          });
        });

      this.shadowRoot.querySelector('#flayCount').innerHTML = noSubtitlesOpusList.length; // mark total count
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
    this.shadowRoot.querySelector('#btnFindSubtitles').addEventListener('click', processStart);

    // stop find
    this.shadowRoot.querySelector('#btnStopFinding').addEventListener('click', processStop);

    // filter found subtitles
    this.shadowRoot.querySelector('#btnFilterFound').addEventListener('click', () => {
      this.shadowRoot.querySelectorAll('.flay-item:not(.found-subtitles)').forEach((item) => {
        item.classList.toggle('hide');
      });
    });

    this.shadowRoot.querySelectorAll("input[name='rank']").forEach((rank) => rank.addEventListener('change', displayList));

    fetch('/flay')
      .then((res) => res.json())
      .then((list) => {
        flayList = list;
      })
      .then(displayList);
  }
}

// Define the new element
customElements.define('subtitles-finder', SubtitlesFinder);
