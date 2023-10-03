/**
 * 탭 UI 처리
 *
 * <button role="tab" target="#studioActress" [active] ...>
 * <div role="tabpanel" id="studioActress" ...>
 */

import './TabUI.scss';

const tablistNodeList = document.querySelectorAll('[role="tablist"]');
console.debug('tablistNodeList', tablistNodeList);
tablistNodeList.forEach((group) => {
  //
  const tabNodeList = group.querySelectorAll('[role="tab"]');
  console.debug('tabNodeList', tabNodeList);
  tabNodeList.forEach((tab) => {
    //
    const target = tab.getAttribute('target');
    const active = tab.hasAttribute('active');
    const targetPanel = document.querySelector(target);
    console.debug('tab', tab, targetPanel, active);

    if (active) {
      targetPanel.setAttribute('active', true);
    } else {
      targetPanel.removeAttribute('active');
    }

    tab.addEventListener('click', () => {
      activateTab(tab, tabNodeList);
    });
  });
});

function activateTab(checkedTab, tabNodeList) {
  console.debug('activateTab args', checkedTab, tabNodeList);
  tabNodeList.forEach((tab) => {
    //
    const target = tab.getAttribute('target');
    const targetPanel = document.querySelector(target);
    console.debug('activateTab', checkedTab, tab);

    if (tab === checkedTab) {
      tab.setAttribute('active', true);
      targetPanel.setAttribute('active', true);
    } else {
      tab.removeAttribute('active');
      targetPanel.removeAttribute('active');
    }
  });
}
