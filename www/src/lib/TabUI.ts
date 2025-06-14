import './TabUI.scss';

/**
 * 탭 UI 처리
 * * HTML 구조 예시:
 * ```html
 * <div role="tablist">
 *   <button role="tab" target="#panel1" active>탭 1</button>
 *   <button role="tab" target="#panel2">탭 2</button>
 * </div>
 * <div role="tabpanel" id="panel1">패널 1 내용</div>
 * <div role="tabpanel" id="panel2">패널 2 내용</div>
 * ```
 * @param root - 탭 UI를 포함하는 루트 요소
 */
export const tabUI = (root: HTMLElement): void => {
  root.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    // 탭 버튼들을 찾아서 이벤트 리스너 등록
    const tabs = tablist.querySelectorAll('[role="tab"]');
    tabs.forEach((thisTab, i, tabsNodeList) => {
      // 클릭 이벤트 리스너 등록
      thisTab.addEventListener('click', () => {
        // 모든 탭의 활성 상태 업데이트
        tabsNodeList.forEach((tab) => {
          const isEquals = thisTab === tab;
          const targetSelector = tab.getAttribute('target');

          // 탭 버튼 활성 상태 토글
          tab.toggleAttribute('active', isEquals);

          // 대상 패널 활성 상태 토글
          if (targetSelector) {
            const targetPanel = root.querySelector(targetSelector);
            targetPanel?.toggleAttribute('active', isEquals);
          }
        });
      });
    });

    // 기본 활성 탭 클릭 (있는 경우)
    const defaultActiveTab = tablist.querySelector('[role="tab"][active]') as HTMLElement;
    defaultActiveTab?.click();
  });
};
