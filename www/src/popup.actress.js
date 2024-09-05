import './init/Popup';
import './popup.actress.scss';

import FlayCard from './flay/FlayCard';
import favoriteSVG from './svg/favorite.svg';
import FlayAction from './util/FlayAction';
import FlaySearch from './util/FlaySearch';

class PopupActress {
  constructor() {
    this.flayCardMap = new Map();

    // get Parameter
    const urlParams = new URL(location.href).searchParams;
    this.name = urlParams.get('name');
    this.startDate = urlParams.get('s');
    this.endDate = urlParams.get('e');

    // 주요 엘리먼트
    this.favorite = document.querySelector('#favorite');
    this.favLabel = document.querySelector('#favorite + label');
    this.actressName = document.querySelector('#name');
    this.localName = document.querySelector('#localName');
    this.flayRank = document.querySelector('#flayRank');
    this.birth = document.querySelector('#birth');
    this.age = document.querySelector('#age');
    this.body = document.querySelector('#body');
    this.height = document.querySelector('#height');
    this.debut = document.querySelector('#debut');
    this.comment = document.querySelector('#comment');
    this.saveBtn = document.querySelector('#saveBtn');
    this.studioList = document.querySelector('.studio-list');
    this.tagList = document.querySelector('.tag-list');
    this.toggleArchive = document.querySelector('#toggleArchive');

    this.searchAvdbsBtn = document.querySelector('#searchAvdbsBtn');
    this.searchNextjavBtn = document.querySelector('#searchNextjavBtn');
    this.searchMinnanoBtn = document.querySelector('#searchMinnanoBtn');

    this.favLabel.innerHTML = favoriteSVG;
    document.title = this.name;

    // 조건에 맞는 카드 토글 이벤트
    this.flayRank.addEventListener('change', () => {
      this.#resetStudioList();
      this.#resetTagList();
      this.#toggleFlayCard();
      this.#renderStudioList();
      this.#renderTagList();
    });
    this.studioList.addEventListener('change', () => {
      this.#resetTagList();
      this.#toggleFlayCard();
      this.#renderTagList();
    });
    this.tagList.addEventListener('change', () => {
      this.#toggleFlayCard();
    });
    // 검색 이벤트
    this.searchAvdbsBtn.addEventListener('click', (e) => FlaySearch.Avdbs(this.localName.value));
    this.searchNextjavBtn.addEventListener('click', (e) => FlaySearch.actress.Nextjav(this.actressName.value));
    this.searchMinnanoBtn.addEventListener('click', (e) => FlaySearch.actress.Minnano(this.localName.value));
    // 저장 이벤트
    this.saveBtn.addEventListener('click', () => {
      FlayAction.updateActress({
        favorite: this.favorite.checked,
        name: this.actressName.value.trim(),
        localName: this.localName.value.trim(),
        debut: this.debut.value.trim(),
        birth: this.birth.value.trim(),
        body: this.body.value.trim(),
        height: this.height.value.trim(),
        comment: this.comment.value.trim(),
      });
    });
    this.toggleArchive.addEventListener('click', () => {
      Array.from(document.querySelectorAll('flay-card'))
        .filter((flayCard) => flayCard.hasAttribute('archive'))
        .filter((flayCard) => flayCard.dataset.show === 'true')
        .forEach((flayCard) => {
          flayCard.style.display = flayCard.style.display === 'none' ? 'block' : 'none';
        });
    });

    // sse 수신 이벤트
    window.emitActress = (actress) => {
      if (this.name === actress.name) this.#fetchActress();
    };
  }

  start() {
    this.#fetchActress();
    this.#fetchFlay();
  }

  #fetchActress() {
    fetch('/info/actress/' + this.name)
      .then((res) => res.json())
      .then((actress) => {
        console.log(actress);
        this.favorite.checked = actress.favorite;
        this.actressName.value = actress.name;
        this.localName.value = actress.localName;
        this.birth.value = actress.birth;
        this.age.value = calcAge(actress.birth) + 'y';
        this.body.value = actress.body;
        this.height.value = actress.height;
        this.debut.value = actress.debut;
        this.comment.value = actress.comment;
      });
  }

  async #fetchFlay() {
    const instanceFlayList = await fetch('/flay/find/actress/' + this.name).then((res) => res.json());
    const archiveFlayList = await fetch('/archive/find/actress/' + this.name).then((res) => res.json());

    this.allFlayList = Array.from(instanceFlayList);
    archiveFlayList.forEach((archiveFlay) => {
      if (this.allFlayList.filter((flay) => flay.opus === archiveFlay.opus).length === 0) {
        this.allFlayList.push(archiveFlay);
      }
    });

    const opusList = this.allFlayList
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
      let flayCard = document.querySelector('article').appendChild(new FlayCard({ excludes: ['FlayActress'] }));
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

  #resetStudioList() {
    document.querySelector('.studio-list').textContent = null;
  }

  #resetTagList() {
    document.querySelector('.tag-list').textContent = null;
  }

  #renderStudioList() {
    const list = [];
    this.#flayCardList().forEach((flayCard) => {
      if (flayCard.style.display === 'none') {
        return;
      }
      const studio = flayCard.flay.studio;
      if (!list.includes(studio)) {
        list.push(studio);
      }
    });
    document.querySelector('.studio-list').innerHTML = list
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
   * 선택된 rank, 선택된 studio, 선택된 tag로 flayCard toggle 이벤트
   */
  #toggleFlayCard() {
    let rank = parseInt(this.flayRank.value);
    let studios = Array.from(this.studioList.querySelectorAll('input:checked')).map((input) => input.value);
    let tags = Array.from(this.tagList.querySelectorAll('input:checked')).map((input) => parseInt(input.value));

    // console.log(`
    //   rank: ${rank}
    //   studios: ${studios.join(', ')}
    //   tags: ${tags.join(', ')}
    // `);

    let archiveCount = 0;
    this.#flayCardList().forEach((flayCard) => {
      let show = true;
      // 조건에 맞쳐 숨길 카드 선택
      // rank로 filter
      if (!isNaN(rank) && rank !== flayCard.flay.video.rank) {
        // 다른 rank면 숨기기
        show = false;
      }
      // 선택된 studio로 filter
      if (studios.length > 0) {
        //
        if (!studios.includes(flayCard.flay.studio)) {
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

      flayCard.dataset.show = show;
      flayCard.style.display = show ? 'block' : 'none';
      if (show) {
        flayCard.hasAttribute('archive') && archiveCount++;
      }
    });

    this.toggleArchive.innerHTML = archiveCount + ' F';
  }
}

function calcAge(birth) {
  if (birth === null || birth.trim().length === 0) {
    return '';
  }
  let birthYear = parseInt(birth.substring(0, 4));
  let todayYear = new Date().getFullYear();
  return todayYear - birthYear + 1;
}

const popupActress = new PopupActress();
popupActress.start();
