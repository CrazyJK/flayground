import './init/Popup';
import './popup.studio.scss';

import FlayCard from './flay/FlayCard';
import flayAction from './util/FlayAction';

class PopupStudio {
  constructor() {
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

    // sse 수신 이벤트
    window.emitStudio = (studio) => {
      if (this.name === studio.name) this.#fetchStudio();
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

  async #fetchFlay() {
    const instanceFlayList = await fetch('/flay/find/studio/' + this.name).then((res) => res.json());
    const archiveFlayList = await fetch('/archive/find/studio/' + this.name).then((res) => res.json());

    this.allFlayList = Array.from(instanceFlayList);
    archiveFlayList.forEach((archiveFlay) => {
      if (this.allFlayList.filter((flay) => flay.opus === archiveFlay.opus).length === 0) {
        this.allFlayList.push(archiveFlay);
      }
    });
    document.querySelector('#totalCount').value = this.allFlayList.length + ' F';

    const opusList = instanceFlayList
      .sort((f1, f2) => f2.release.localeCompare(f1.release))
      .filter((flay) => {
        if (this.startDate && this.endDate) {
          return this.startDate < flay.release && flay.release < this.endDate;
        } else {
          return true;
        }
      })
      .map((flay) => flay.opus);

    this.#renderFlayCardList(opusList)
      .then(() => this.#renderRankSelectOption())
      .then(() => this.flayRank.dispatchEvent(new Event('change')));
  }

  async #renderFlayCardList(opusList) {
    for (let opus of opusList) {
      let flayCard = document.querySelector('article').appendChild(new FlayCard({ excludes: ['FlayStudio'] }));
      this.flayCardMap.set(opus, flayCard);

      await flayCard.set(opus).then(() => {
        return new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }

  #flayCardList() {
    return Array.from(this.flayCardMap.values());
  }

  #renderRankSelectOption() {
    let flayCountMap = new Map();
    for (let i = -1; i <= 5; i++) {
      flayCountMap.set(i, { instance: 0, archive: 0 });
    }

    let [instanceTotal, archiveTotal] = [0, 0];
    let [sum, count] = [0, 0];
    this.allFlayList.forEach((flay) => {
      let rank = flay.video.rank;
      const countObj = flayCountMap.get(rank);
      if (flay.archive) {
        countObj.archive++;
        archiveTotal++;
      } else {
        countObj.instance++;
        instanceTotal++;
      }
      if (rank !== 0) {
        sum += rank;
        count++;
      }
    });
    flayCountMap.forEach((countObj, rank) => {
      document.querySelector(`#flayRank option[value="${rank}"]`).innerHTML = `Rank ${rank} : ${countObj.instance} ${countObj.archive > 0 ? ' 🆚 ' + countObj.archive : ''}`; // 🔺🔻⛔⭕🚫🆚
    });
    let avg = count > 0 ? (sum / count).toFixed(1) : 0;
    document.querySelector(`#flayRank option:first-child`).innerHTML = `Rank ${avg} : ${instanceTotal} 🆚 ${archiveTotal}`;
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
