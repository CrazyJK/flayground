import FlayFetch from '@lib/FlayFetch';
import './FlayHotTag.scss';

/**
 * 핫 태그 통계 페이지 커스텀 엘리먼트.
 * likes가 있는 Flay를 태그별로 그룹화하여 태그 정보, 전체 flay 수, liked flay 수를 리스트로 보여준다.
 */
export class FlayHotTag extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `<div class="loading">로딩 중...</div>`;
  }

  async connectedCallback() {
    const [allFlays, allTags] = await Promise.all([FlayFetch.getFlayAll(), FlayFetch.getTags()]);

    // tag별 전체 Flay 수 및 liked Flay 수 집계
    const tagMap = new Map<number, { totalCount: number; likedCount: number }>();
    for (const flay of allFlays) {
      for (const tag of flay.video.tags) {
        const entry = tagMap.get(tag.id);
        const liked = flay.video.likes.length > 0 ? 1 : 0;
        if (entry) {
          entry.totalCount++;
          entry.likedCount += liked;
        } else {
          tagMap.set(tag.id, { totalCount: 1, likedCount: liked });
        }
      }
    }

    // 모든 태그를 likedCount 내림차순 정렬
    const sorted = allTags
      .map((tag) => {
        const counts = tagMap.get(tag.id) || { totalCount: 0, likedCount: 0 };
        return { tag, ...counts };
      })
      .sort((a, b) => b.likedCount - a.likedCount);

    // 렌더링
    this.innerHTML = `
      <div class="hot-tag-header">
        <h1>Hot Tags</h1>
        <div class="hot-tag-summary">전체 Flay ${allFlays.length}개 · ${sorted.length}개 태그</div>
      </div>
      <ul class="hot-tag-list">
        ${sorted
          .map(
            ({ tag, totalCount, likedCount }) => `
          <li class="hot-tag-item">
            <span class="tag-name">${tag.name}</span>
            <span class="tag-group">${tag.group}</span>
            <span class="tag-desc">${tag.description}</span>
            <span class="tag-total">${totalCount}</span>
            <span class="tag-liked">${likedCount}</span>
            <span class="tag-rate">${totalCount > 0 ? Math.round((likedCount / totalCount) * 100) : 0}%</span>
          </li>`
          )
          .join('')}
      </ul>
    `;
  }
}

customElements.define('flay-hot-tag', FlayHotTag);
