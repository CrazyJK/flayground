import { FlayShotDailyPanel } from '@flay/panel/FlayShotDailyPanel';
import { FlayShotReleasePanel } from '@flay/panel/FlayShotReleasePanel';
import { tabUI } from '@lib/TabUI';
import './inc/Page';
import './page.history-shot.scss';

class Page {
  constructor() {}

  async start(): Promise<void> {
    document.body.addEventListener('tabActivated', (e: CustomEvent) => {
      const { tab } = e.detail;

      if (tab.getAttribute('target') === '#dailyPanel') {
        this.#initDailyPanel();
      } else if (tab.getAttribute('target') === '#releasePanel') {
        this.#initReleasePanel();
      }
    });

    tabUI(document.body); // tabActivated
  }

  #initDailyPanel(): void {
    if (!document.querySelector('.flay-shot-daily-panel')) document.getElementById('dailyPanel')!.appendChild(new FlayShotDailyPanel());
  }

  #initReleasePanel(): void {
    if (!document.querySelector('.flay-shot-release-panel')) document.getElementById('releasePanel')!.appendChild(new FlayShotReleasePanel());
  }
}

new Page().start();
