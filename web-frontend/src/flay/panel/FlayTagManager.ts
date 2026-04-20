import * as DragDrop from '@lib/Drag&Drop';
import FlayAction from '@lib/FlayAction';
import FlayFetch, { Tag } from '@lib/FlayFetch';
import { popupTag } from '@lib/FlaySearch';
import { addResizeListener } from '@lib/windowAddEventListener';
import tagSVG from '@svg/tag';
import './FlayTagManager.scss';

/**
 * 태그 정보 표시용 커스텀 엘리먼트.
 * 태그 이름, 설명, 사용 횟수를 표시하며 드래그 앤 드롭을 지원한다.
 */
class FlayTagInfo extends HTMLElement {
  tag!: Tag;

  constructor(tag: Tag) {
    super();
    this.tag = tag;
    this.draggable = true;
    this.dataset.id = String(this.tag.id);
    this.dataset.flayCount = String(this.tag['count']);
    this.classList.add('flay-tag-info');
    this.innerHTML = `
      <dt>
        <label class="icon" title="${this.tag.id}">${tagSVG}</label>
        <label class="name">${this.tag.name}</label>
        <label class="count ${this.tag['count'] === 0 ? 'zero' : ''}">${this.tag['count']}</label>
      </dt>
      <dd>
        <label class="desc">${this.tag.description}</label>
      </dd>
    `;

    this.querySelector('.name')!.addEventListener('click', () => popupTag(this.tag.id));
  }
}

customElements.define('flay-tag-info', FlayTagInfo);

/**
 * 태그 관리 페이지 커스텀 엘리먼트.
 * 태그 CRUD, 그룹 간 드래그 앤 드롭 이동, 해상도별 폰트 크기 조정을 지원한다.
 */
export class FlayTagManager extends HTMLElement {
  private tagIdInput!: HTMLInputElement;
  private tagGroupInput!: HTMLInputElement;
  private tagNameInput!: HTMLInputElement;
  private tagDescInput!: HTMLInputElement;
  private mainEl!: HTMLElement;
  private removeResizeListener: (() => void) | null = null;

  constructor() {
    super();
    this.innerHTML = `
      <header class="sticky">
        <div>
          <input type="text" class="tag-id" placeholder="ID" readonly />
          <input type="text" class="tag-group" placeholder="group" readonly />
          <input type="text" class="tag-name" placeholder="Tag name" />
          <input type="text" class="tag-desc" placeholder="Description..." />
          <button type="button" class="apply-btn">Apply</button>
          <button type="button" class="delete-btn">Del</button>
        </div>
      </header>
      <main></main>
    `;

    this.tagIdInput = this.querySelector('.tag-id') as HTMLInputElement;
    this.tagGroupInput = this.querySelector('.tag-group') as HTMLInputElement;
    this.tagNameInput = this.querySelector('.tag-name') as HTMLInputElement;
    this.tagDescInput = this.querySelector('.tag-desc') as HTMLInputElement;
    this.mainEl = this.querySelector('main') as HTMLElement;

    // ID 클릭 시 입력 필드 초기화
    this.tagIdInput.addEventListener('click', () => {
      this.tagIdInput.value = '';
      this.tagNameInput.value = '';
      this.tagDescInput.value = '';
    });

    // Apply 버튼: 태그 생성/수정
    this.querySelector('.apply-btn')!.addEventListener('click', () => {
      const [id, group, name, desc] = [this.tagIdInput.value, this.tagGroupInput.value, this.tagNameInput.value, this.tagDescInput.value];
      if (name !== '') void FlayAction.putTag(id === '' ? -1 : parseInt(id), group, name, desc, () => this.renderTagList());
    });

    // Delete 버튼: 태그 삭제
    this.querySelector('.delete-btn')!.addEventListener('click', () => {
      const [id, name, desc] = [this.tagIdInput.value, this.tagNameInput.value, this.tagDescInput.value];
      if (id !== '') if (confirm('A U sure?')) void FlayAction.deleteTag(parseInt(id), name, desc, () => this.renderTagList());
    });
  }

  async connectedCallback() {
    await this.renderTagList();

    // FHD 해상도 면적 이상이면 flay 갯수에 비례하여 폰트 크기 설정
    this.removeResizeListener = addResizeListener(() => {
      const isHugeScreen = window.innerWidth * window.innerHeight > 1080 * 1920;
      this.querySelectorAll('.flay-tag-info').forEach((element) => {
        const flayTagInfo = element as FlayTagInfo;
        (flayTagInfo.querySelector('.name') as HTMLElement).style.fontSize = isHugeScreen ? `calc(var(--size-normal) + ${Math.floor(Number(flayTagInfo.dataset.flayCount) / 5)}px)` : '';
      });
    }, true);

    window.dispatchEvent(new Event('resize'));
  }

  disconnectedCallback() {
    this.removeResizeListener?.();
  }

  /**
   * FlayTagInfo 클릭 시 헤더 입력 필드에 태그 정보를 채운다
   * @param tag 선택된 태그 정보
   */
  private selectTag(tag: Tag) {
    this.tagIdInput.value = String(tag.id);
    this.tagGroupInput.value = tag.group;
    this.tagNameInput.value = tag.name;
    this.tagDescInput.value = tag.description;
  }

  /** 태그 그룹과 태그 목록을 가져와 렌더링한다 */
  private async renderTagList() {
    this.mainEl.textContent = null;

    const tagGroupList = await FlayFetch.getTagGroups();
    Array.from(tagGroupList).forEach(({ id, name, desc }) => {
      const groupDiv = this.mainEl.appendChild(document.createElement('fieldset'));
      groupDiv.innerHTML = `<legend>${id}: ${name} ${desc}</legend><div id="${id}"></div>`;

      const dropzone = groupDiv.querySelector('div')!;
      dropzone.classList.add('dropzone');
      DragDrop.setDropzone(dropzone);

      if (id === 'etc') {
        const pin = document.createElement('span');
        pin.innerHTML = `📌`;
        pin.className = 'pin';
        pin.addEventListener('click', () => groupDiv.classList.toggle('fixed'));
        groupDiv.insertAdjacentElement('afterbegin', pin);
      }
    });

    const tagList = await FlayFetch.getTagListWithCount();
    Array.from(tagList)
      .sort((t1, t2) => t1.name.localeCompare(t2.name))
      .forEach((tag) => {
        const flayTagInfo = new FlayTagInfo(tag);
        flayTagInfo.addEventListener('click', () => this.selectTag(tag));
        flayTagInfo.addEventListener('drop', async (e) => {
          const dropzone = (e.target as HTMLElement).closest('.dropzone')!;
          const newGroup = dropzone.id;
          if (tag.group !== newGroup) {
            tag.group = newGroup;
            await FlayAction.updateTag(tag);
          }
          const sorted = Array.from(dropzone.querySelectorAll('.flay-tag-info')).sort((t1, t2) => (t1 as FlayTagInfo).tag.name.localeCompare((t2 as FlayTagInfo).tag.name));
          for (const item of sorted) {
            dropzone.insertBefore(item, null);
          }
        });

        this.querySelector('#etc')!.append(flayTagInfo);
        if (tag.group) this.querySelector('#' + tag.group)?.append(flayTagInfo);

        DragDrop.setMoveable(flayTagInfo);
      });
  }
}

customElements.define('flay-tag-manager', FlayTagManager);
