import FlayMarker from '@flay/domain/FlayMarker';
import FlayFetch from '@lib/FlayFetch';
import GridControl from '@ui/GridControl';
import './inc/Page';
import './page.flay-tag.scss';

const tagContainer = document.querySelector('body > header > div')!;
const markerContainer = document.querySelector('body > main')!;
const gridContainer = document.querySelector('body > footer')!;

gridContainer.appendChild(new GridControl('body > main'));

tagContainer.addEventListener('change', () => {
  const selectedTags = Array.from(tagContainer.querySelectorAll('input[type="checkbox"]:checked'));
  // 선택된 태그에 따라 메인 콘텐츠 업데이트
  Promise.all(
    selectedTags.map((checkbox) => {
      const tagId = parseInt((checkbox as HTMLInputElement).value);
      return FlayFetch.getFlayListByTagId(tagId);
    })
  )
    .then((results) => {
      const flays = results.flat(); // 다수의 결과를 하나로 합침
      // flays 중복 제거
      const uniqueFlays = Array.from(new Set(flays.map((flay) => flay.opus))).map((opus) => flays.find((flay) => flay.opus === opus)!);

      document.querySelector('#flayCount')!.innerHTML = uniqueFlays.length.toString();

      markerContainer.innerHTML = ''; // 기존 콘텐츠 제거
      markerContainer.append(...uniqueFlays.map((flay) => new FlayMarker(flay, { cover: true })));
    })
    .catch((error) => {
      console.error(error);
    });
});

FlayFetch.getTags()
  .then((tags) => {
    const excludeTagGroup = ['grade', 'screen', 'etc'];

    const fragment = document.createDocumentFragment();
    tags
      .filter((tag) => tag.group && !excludeTagGroup.includes(tag.group))
      .sort((t1, t2) => t1.group.localeCompare(t2.group))
      .forEach((tag) => {
        const checkbox = document.createElement('input');
        checkbox.id = `tag-${tag.id}`;
        checkbox.type = 'checkbox';
        checkbox.value = tag.id.toString();

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = tag.name;

        fragment.append(checkbox, label);
      });

    tagContainer.appendChild(fragment);
  })
  .catch((error) => {
    console.error(error);
  });
