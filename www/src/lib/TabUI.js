import './TabUI.scss';

/**
 * 탭 UI 처리
 *
 * ```html
 * <button role="tab" target="#studioActress" [active] ...>
 * <div role="tabpanel" id="studioActress" ...>
 * ```
 * @param {Element} root
 */
export const tabUI = (root) => {
  root.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    //
    tablist.querySelectorAll('[role="tab"]').forEach((thisTab, i, tabs) => {
      //
      thisTab.addEventListener('click', () => {
        //
        tabs.forEach((tab) => {
          //
          const isEquals = thisTab === tab;

          tab.toggleAttribute('active', isEquals);
          root.querySelector(tab.getAttribute('target')).toggleAttribute('active', isEquals);
        });
      });
    });

    tablist.querySelector('[role="tab"][active]')?.click();
  });
};
