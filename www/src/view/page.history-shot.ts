import { tabUI } from '@lib/TabUI';
import './inc/Page';
import './page.history-shot.scss';
import { FlayShotDailyPanel } from '../flay/panel/FlayShotDailyPanel';
import { FlayShotReleasePanel } from '../flay/panel/FlayShotReleasePanel';

class Page {
  constructor() {}

  async start(): Promise<void> {
    this.#initDailyPanel();
    this.#initReleasePanel();
  }

  #initDailyPanel(): void {
    const dailyPanel = document.getElementById('dailyPanel');
    if (dailyPanel) {
      dailyPanel.appendChild(new FlayShotDailyPanel());
    }
  }

  #initReleasePanel(): void {
    const releasePanel = document.getElementById('releasePanel');
    if (releasePanel) {
      releasePanel.appendChild(new FlayShotReleasePanel());
    }
  }
}

new Page().start().then(() => {
  tabUI(document.body);
});
