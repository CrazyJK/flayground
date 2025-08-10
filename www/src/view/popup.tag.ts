import FlayCard from '@flay/domain/FlayCard';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Actress, Tag } from '@lib/FlayFetch';
import GridControl from '@ui/GridControl';
import './inc/Popup';
import './popup.tag.scss';

// Window 객체 확장
declare global {
  interface Window {
    tagList?: Tag[];
    actressMap?: Map<number, Actress>;
  }
}

window.tagList = [];
window.actressMap = new Map();

const urlParams = new URL(location.href).searchParams;
const param = urlParams.get('param');

const id = parseInt(param!);

const flayMap = new Map();

const tagId = document.querySelector('#tagId') as HTMLSpanElement;
const tagGroup = document.querySelector('#tagGroup') as HTMLInputElement;
const tagName = document.querySelector('#tagName') as HTMLInputElement;
const tagDesc = document.querySelector('#tagDesc') as HTMLInputElement;
const saveBtn = document.querySelector('#saveBtn') as HTMLButtonElement;
const delBtn = document.querySelector('#delBtn') as HTMLButtonElement;
const flayRank = document.querySelector('#flayRank') as HTMLSelectElement;

document.querySelector('body > footer')!.appendChild(new GridControl('body > article'));

function fetchTag() {
  void FlayFetch.getTag(id).then((tag) => {
    if (!tag) {
      console.warn(`Tag with ID ${id} not found`);
      return;
    }
    tagId.innerHTML = String(tag.id);
    tagGroup.value = tag.group;
    tagName.value = tag.name;
    tagDesc.value = tag.description;

    document.title = `${tag.group}: ${tag.name} tag`;
  });

  void FlayFetch.getFlayListByTagId(id).then((list) => {
    const opusList = Array.from(list).map((flay) => flay.opus);
    void renderFlayCardList(opusList).then(() => {
      countFlaySizeByRank();
    });
  });
}

fetchTag();

flayRank.addEventListener('change', (e) => {
  toggleByRank((e.target as HTMLSelectElement).value);
});

saveBtn.addEventListener('click', () => {
  void FlayAction.putTag(parseInt(tagId.textContent!), tagGroup.value, tagName.value, tagDesc.value);
});

delBtn.addEventListener('click', () => {
  if (confirm('A U sure?')) {
    void FlayAction.deleteTag(parseInt(tagId.textContent!), tagName.value, tagDesc.value);
  }
});

async function renderFlayCardList(opusList: string[]) {
  document.querySelector('article')!.textContent = null;
  flayMap.clear();
  for (const opus of opusList) {
    const flayCard = new FlayCard({ excludes: [] });
    flayMap.set(opus, flayCard);
    document.querySelector('article')!.appendChild(flayCard);
    await flayCard.set(opus);

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function toggleByRank(selectedRank: string) {
  document.querySelectorAll('.flay-card').forEach((element) => {
    const flayCard = element as FlayCard;

    if (selectedRank === '') {
      flayCard.style.display = 'block';
    } else {
      const rank = flayCard.getAttribute('rank');
      if (rank === selectedRank) {
        flayCard.style.display = 'block';
      } else {
        flayCard.style.display = 'none';
      }
    }
  });
}

function countFlaySizeByRank() {
  const flaySizeByRank = [0, 0, 0, 0, 0, 0];
  let sumRank = 0;
  let totalFlay = 0;
  document.querySelectorAll('.flay-card').forEach((element) => {
    const flayCard = element as FlayCard;
    const rank = parseInt(flayCard.getAttribute('rank')!);
    flaySizeByRank[rank]! += 1;
    if (rank !== 0) {
      sumRank += rank;
      totalFlay++;
    }
    flaySizeByRank.forEach((flaySize, r) => {
      document.querySelector(`#flayRank option[value="${r}"]`)!.innerHTML = `Rank ${r} : ${flaySize}`;
    });
    document.querySelector(`#flayRank option:first-child`)!.innerHTML = `Rank ${(sumRank / totalFlay).toFixed(1)} : ${totalFlay} F`;
  });
}

// sse 수신 이벤트
window.emitTag = (tag) => {
  if (id === tag.id) fetchTag();
};
