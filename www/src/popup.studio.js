import FlayCard from './flay/FlayCard';
import './lib/SseConnector';
import './lib/ThemeListener';
import './popup.studio.scss';
import flayAction from './util/FlayAction';
import { appendStyle } from './util/componentCssLoader';
import { addResizeLazyEventListener } from './util/resizeListener';

class PopupStudio {
  constructor() {
    appendStyle();

    this.flayCardMap = new Map();

    // get Parameter
    const urlParams = new URL(location.href).searchParams;
    this.name = urlParams.get('name');
    this.startDate = urlParams.get('s');
    this.endDate = urlParams.get('e');

    // 주요 엘리먼트
    this.studioName = document.querySelector('#studioName');
    this.studioCompany = document.querySelector('#studioCompany');
    this.studioHomepage = document.querySelector('#studioHomepage');
    this.flayRank = document.querySelector('#flayRank');
    this.saveBtn = document.querySelector('#saveBtn');
    this.actressList = document.querySelector('.actress-list');
    this.tagList = document.querySelector('.tag-list');

    document.title = this.name;

    // 조건에 맞는 카드 토글 이벤트
    this.flayRank.addEventListener('change', () => {
      this.#resetActressList();
      this.#resetTagList();
      this.#toggleFlayCard();
      this.#renderActressList();
      this.#renderTagList();
    });
    this.actressList.addEventListener('change', () => {
      this.#resetTagList();
      this.#toggleFlayCard();
      this.#renderTagList();
    });
    this.tagList.addEventListener('change', () => {
      this.#toggleFlayCard();
    });
    // 저장 이벤트
    this.saveBtn.addEventListener('click', () => {
      flayAction.putStudio(this.studioName.value, this.studioCompany.value, this.studioHomepage.value);
    });
    // 리사이즈 이벤트
    addResizeLazyEventListener(() => {
      this.flayCardMap.forEach((flayCard) => {
        flayCard.resize();
      });
    });
    // sse 수신 이벤트
    window.emitFlay = (flay) => {
      let flayCard = this.flayCardMap.get(flay.opus);
      if (flayCard) flayCard.reload();
    };
    window.emitStudio = (studio) => {
      if (name === studio.name) this.#fetchStudio();
    };
    window.emitVideo = (video) => {
      let flayCard = this.flayCardMap.get(video.opus);
      if (flayCard) flayCard.reload();
    };
    window.emitActress = (actress) => {
      this.flayCardMap.forEach((flayCard) => {
        if (flayCard.flay.actressList.includes(actress.name)) flayCard.reload();
      });
    };
  }

  start() {
    this.#fetchStudio();
    this.#fetchFlay();
  }

  #fetchStudio() {
    fetch('/info/studio/' + name)
      .then((res) => res.json())
      .then((studio) => {
        this.studioName.value = studio.name;
        this.studioCompany.value = studio.company;
        this.studioHomepage.value = studio.homepage;
      });
  }

  #fetchFlay() {
    fetch('/flay/find/studio/' + this.name)
      .then((res) => res.json())
      .then((list) => {
        const opusList = Array.from(list)
          .filter((flay) => {
            if (this.startDate && this.endDate) {
              return this.startDate < flay.release && flay.release < this.endDate;
            } else {
              return true;
            }
          })
          .map((flay) => flay.opus);

        this.#renderFlayCardList(opusList)
          .then(() => this.#randerRankSelectOption())
          .then(() => this.flayRank.dispatchEvent(new Event('change')));
      });
  }

  async #renderFlayCardList(opusList) {
    for (let opus of opusList) {
      let flayCard = document.querySelector('article').appendChild(new FlayCard({ excludes: ['FlayStudio'] }));
      this.flayCardMap.set(opus, flayCard);

      await flayCard.set(opus).then(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });
    }
  }

  #flayCardList() {
    return Array.from(this.flayCardMap.values());
  }

  #randerRankSelectOption() {
    let flaySizeByRank = [0, 0, 0, 0, 0, 0];
    let sumRank = 0;
    let totalFlay = 0;
    this.#flayCardList().forEach((flayCard, key, parent) => {
      let rank = parseInt(flayCard.getAttribute('rank'));
      flaySizeByRank[rank] += 1;
      if (rank !== 0) {
        sumRank += rank;
        totalFlay++;
      }
    });
    flaySizeByRank.forEach((flaySize, rank) => {
      document.querySelector(`#flayRank option[value="${rank}"]`).innerHTML = `Rank ${rank} : ${flaySize}`;
    });
    let avg = totalFlay > 0 ? (sumRank / totalFlay).toFixed(1) : 0;
    let tot = this.#flayCardList().length;
    document.querySelector(`#flayRank option:first-child`).innerHTML = `Rank ${avg} : ${tot} F`;
  }

  #resetActressList() {
    document.querySelector('.actress-list').textContent = null;
  }

  #resetTagList() {
    document.querySelector('.tag-list').textContent = null;
  }

  #renderActressList() {
    const list = [];
    this.#flayCardList().forEach((flayCard) => {
      if (flayCard.style.display === 'none') {
        return;
      }
      flayCard.flay.actressList.forEach((actress) => {
        if (!list.includes(actress)) {
          list.push(actress);
        }
      });
    });
    document.querySelector('.actress-list').innerHTML = list
      .sort((n1, n2) => n1.localeCompare(n2))
      .map((name) => `<input type="checkbox" id="${name}" value="${name}"><label for="${name}">${name}</label>`)
      .join('');
  }

  #renderTagList() {
    const tagMap = new Map();
    this.#flayCardList().forEach((flayCard) => {
      if (flayCard.style.display === 'none') {
        return;
      }
      flayCard.flay.video.tags.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    document.querySelector('.tag-list').innerHTML = Array.from(tagMap.values())
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .map((tag) => `<input type="checkbox" id="tagId_${tag.id}" value="${tag.id}"><label for="tagId_${tag.id}" title=${tag.description}>${tag.name}</label>`)
      .join('');
  }

  /**
   * 선택된 rank, 선택된 actress, 선택된 tag로 flayCard toggle 이벤트
   */
  #toggleFlayCard() {
    let rank = parseInt(this.flayRank.value);
    let actressList = Array.from(this.actressList.querySelectorAll('input:checked')).map((input) => input.value);
    let tags = Array.from(this.tagList.querySelectorAll('input:checked')).map((input) => parseInt(input.value));

    console.log(`
      rank: ${rank}
      actress: ${actressList.join(', ')}
      tags: ${tags.join(', ')}
    `);

    this.#flayCardList().forEach((flayCard) => {
      let show = true;
      // 조건에 맞쳐 숨길 카드 선택
      // rank로 filter
      if (!isNaN(rank) && rank !== flayCard.flay.video.rank) {
        // 다른 rank면 숨기기
        show = false;
      }
      // 선택된 actress로 filter
      if (actressList.length > 0) {
        let foundActress = false;
        flayCard.flay.actressList.forEach((name) => {
          if (actressList.includes(name)) {
            foundActress = true;
          }
        });
        if (!foundActress) {
          show = false;
        }
      }
      // 선택된 tag로 filter
      if (tags.length > 0) {
        let foundTag = false;
        flayCard.flay.video.tags
          .map((tag) => tag.id)
          .forEach((tagId) => {
            if (tags.includes(tagId)) {
              foundTag = true;
            }
          });
        if (!foundTag) {
          show = false;
        }
      }

      flayCard.style.display = show ? 'block' : 'none';
    });
  }
}

const popupStudio = new PopupStudio();
popupStudio.start();
