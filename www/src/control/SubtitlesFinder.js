import FlayAction from '../util/FlayAction';

export default class SubtitlesFinder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }); // 'this.shadowRoot'을 설정하고 반환합니다
    const LINK = document.createElement('link');
    LINK.setAttribute('rel', 'stylesheet');
    LINK.setAttribute('href', './css/4.components.css');
    const STYLE = document.createElement('style');
    STYLE.innerHTML = CSS;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('subtitles-finder');
    this.wrapper.innerHTML = HTML;
    this.shadowRoot.append(LINK, STYLE, this.wrapper); // 생성된 요소들을 shadow DOM에 부착합니다

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
        const subtitles = this.shadowRoot.querySelector('#opus_' + opus + ' > .flay-subtitles');
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
        const scrollable = this.parentElement.closest('.scrollable');
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

const CSS = `
.header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem;
}

#flayList {
  overflow: auto;
}

.flay-item {
  display: flex;
  gap: 8px;
  font-family: D2Coding;
  font-size: 80%;
  font-weight: 700;
  padding: 0 1rem;
  height: 28px;
}
.flay-item label {
  font-size: var(--font-small);
  font-weight: 400;
}
.flay-item:hover {
  color: orange;
}
.flay-item.found-subtitles {
  color: green;
  text-shadow: 0 0 1px #9f9292;

}
.flay-item.found-subtitles.active-subtitles {
  text-shadow: var(--text-shadow);
}
.flay-item.hide {
  display: none;
}
.flay-item .flay-count {
  flex: 0 0 50px;
  text-align: right;
}
.flay-item .flay-studio {
  flex: 0 0 90px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.flay-item .flay-opus {
  flex: 0 0 90px;
}
.flay-item .flay-title {
  flex: 1 0 300px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.flay-item .flay-actressList {
  flex: 0 0 140px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.flay-item .flay-release {
  flex: 0 0 80px;
}
.flay-item .flay-rank {
  flex: 0 0 30px;
  text-align: center;
}
.flay-item .flay-tag {
  flex: 0 0 70px;
  font-size: var(--font-smallest);
}
.flay-item .flay-subtitles {
  flex: 1 0 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.flay-item .flay-subtitles a {
  font-size: inherit;
}
`;

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
