import FlayDiv from '@const/FlayDiv';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Flay } from '@lib/FlayFetch';
import { popupFlayCard } from '@lib/FlaySearch';
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

export default class SubtitlesFinder extends FlayDiv {
  constructor() {
    super();

    this.innerHTML = HTML;
  }

  connectedCallback() {
    let noSubtitlesOpusList: string[] = [];
    let intervalFindSubtitles: ReturnType<typeof setInterval>;
    let foundSubtitlesCount = 0;
    let currentFindingIndex = 0;
    let flayList: Flay[] = [];

    const processStart = () => {
      const findSubtitles = () => {
        ++currentFindingIndex;
        const opus = noSubtitlesOpusList.shift();
        const flayItem = this.querySelector('#opus_' + opus + '') as HTMLElement;
        const subtitles = this.querySelector('#opus_' + opus + ' > .subtitles')!;
        subtitles.innerHTML = 'finding...';

        void FlayAction.subtitlesUrlIfFound(
          opus!,
          (result) => {
            if (result && result['error'] === '') {
              if (result['url'].length > 0) {
                // counting found subtitles
                foundSubtitlesCount++;
                (this.querySelector('#foundSubtitlesCount') as HTMLElement).innerHTML = String(foundSubtitlesCount); // mark found count

                subtitles.textContent = null;
                flayItem.classList.add('found-subtitles');
                // add found link
                for (const url of result['url']) {
                  const a = subtitles.appendChild(document.createElement('a'));
                  a.href = url;
                  a.innerHTML = 'Found';
                  a.addEventListener('click', (e) => {
                    (e.target as HTMLElement).remove();
                  });
                }
              } else {
                // not found
                subtitles.innerHTML = `<span class="disable">not found</span>`;
              }
            } else if (result) {
              // error
              subtitles.innerHTML = `<span class="error">${result['error']}</span>`;
            } else {
              // result is undefined
              subtitles.innerHTML = `<span class="error">No response</span>`;
            }
          },
          (error) => {
            console.log('error', error);
            const errorMessage = error?.message ? error.message.replace(/"/g, "'") : 'Unknown error';
            subtitles.innerHTML = `<span class="error" title="${errorMessage}">Error</span>`;
          }
        );
        // scroll move
        // const scrollable = this.parentElement.closest('.scrollable');
        const scrollable = this.querySelector('#flayList')!.parentElement!;
        const itemPerPage = Math.round(scrollable.clientHeight / 28);
        // console.log('scrollable.clientHeight', scrollable.clientHeight, 'currentFindingIndex', currentFindingIndex, 'currentFindingIndex % itemPerPage', currentFindingIndex % itemPerPage);
        if (currentFindingIndex > itemPerPage && currentFindingIndex % itemPerPage === 1) {
          const offsetTop = flayItem.offsetTop;
          console.log('itemPerPage', itemPerPage, 'currentFindingIndex', currentFindingIndex, `${opus} offsetTop`, offsetTop, scrollable);
          // this.querySelector('html').scrollTop = offsetTop - 60;
          scrollable.scrollTop = offsetTop - 60;
        }
      };

      // initiate
      (this.querySelector('#btnStopFinding') as HTMLElement).style.display = 'block';
      (this.querySelector('#btnFindSubtitles') as HTMLElement).style.display = 'none';
      (this.querySelector('#btnFilterFound') as HTMLElement).style.display = 'none';
      (this.querySelector('#foundSubtitlesCount') as HTMLElement).innerHTML = '0';
      intervalFindSubtitles;
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
        (this.querySelector('#btnFindSubtitles') as HTMLElement).style.display = 'none';
        (this.querySelector('#btnStopFinding') as HTMLElement).style.display = 'none';
      } else {
        this.querySelector('#btnFindSubtitles')!.innerHTML = 'Resume';
      }
      (this.querySelector('#btnStopFinding') as HTMLElement).style.display = 'none';
      (this.querySelector('#btnFindSubtitles') as HTMLElement).style.display = 'block';
      (this.querySelector('#btnFilterFound') as HTMLElement).style.display = 'block';
    };

    const displayList = () => {
      // filter rank
      const selectedRank: number[] = [];
      this.querySelectorAll("input[name='rank']:checked").forEach((rank) => {
        selectedRank.push(Number((rank as HTMLInputElement).value));
      });

      // initiate
      (this.querySelector('#btnFindSubtitles') as HTMLElement).style.display = 'block';
      (this.querySelector('#btnFindSubtitles') as HTMLElement).innerHTML = 'Find';
      (this.querySelector('#btnStopFinding') as HTMLElement).style.display = 'none';
      (this.querySelector('#btnFilterFound') as HTMLElement).style.display = 'none';
      (this.querySelector('#flayList') as HTMLElement).textContent = null;
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

          const flayItem = this.querySelector('#flayList')!.appendChild(document.createElement('div'));
          flayItem.id = 'opus_' + flay.opus;
          flayItem.setAttribute('rank', String(flay.video.rank));
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
            if ((e.target as HTMLElement).classList.contains('title')) {
              // view flay card
              popupFlayCard(flay.opus);
            } else if ((e.target as HTMLElement).tagName === 'A') {
              // click subtitles link
              flayItem.classList.add('active-subtitles');
            }
          });
        });

      (this.querySelector('#flayCount') as HTMLElement).innerHTML = String(noSubtitlesOpusList.length); // mark total count
    };

    const ifTag = (flay: Flay, tagId: number) => {
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
    this.querySelector('#btnFindSubtitles')!.addEventListener('click', processStart);

    // stop find
    this.querySelector('#btnStopFinding')!.addEventListener('click', processStop);

    // filter found subtitles
    this.querySelector('#btnFilterFound')!.addEventListener('click', () => {
      this.querySelectorAll('.flay-item:not(.found-subtitles)').forEach((item) => {
        item.classList.toggle('hide');
      });
    });

    this.querySelectorAll("input[name='rank']").forEach((rank) => rank.addEventListener('change', displayList));

    void FlayFetch.getFlayAll()
      .then((list) => (flayList = list))
      .then(displayList);
  }
}

// Define the new element
customElements.define('subtitles-finder', SubtitlesFinder);
