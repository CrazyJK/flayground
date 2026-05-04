import FlayMarker from '@flay/domain/FlayMarker';
import RandomUtils from '@lib/common/RandomUtils';
import { Countdown } from '@lib/components/Countdown';
import { ModalWindow } from '@lib/components/ModalWindow';
import { showAlert } from '@lib/components/showAlert';
import { showConfirm } from '@lib/components/showConfirm';
import { showDialog } from '@lib/components/showDialog';
import { showLoading } from '@lib/components/showLoading';
import { TickTimer } from '@lib/components/TickTimer';
import fetchJsonp from '@lib/services/fetchJsonp';
import './inc/Page';
import './test.scss';

class Page {
  start() {
    const [wUnit, hUnit] = [window.innerWidth / 12, window.innerHeight / 12];

    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'Video', () => this.#videoWindow(wUnit, hUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'Basket', () => this.#basketWindow(wUnit, hUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'Memo', () => this.#memoWindow(wUnit, hUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'ImageFall', () => this.#imageFallWindow(wUnit, hUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'ImageOne', () => this.#imageOneWindow(wUnit, hUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'Browser', () => this.#browserWindow(wUnit)));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'Countdown', () => this.#countdown()));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'TickTimer', () => this.#tickTimer()));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'FlayMarkerPanel', () => this.#flayMarkerPanel()));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'FlayMarkerSky', () => this.#flayMarkerSky()));
    document.querySelector('body > footer')!.appendChild(newHTMLButtonElement('button', 'ImageCircle', () => this.#imageCircle()));

    fetchJsonp('https://api.github.com/users')
      .then((data) => console.log('users', data))
      .catch((error) => console.error(error));

    import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => document.body.appendChild(flayMarkerFloat))
      .catch(console.error);

    import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
      .then((imageCircle) =>
        imageCircle.addExtraStyle(`
          image-circle {
            position: fixed;
            right: 0;
            bottom: 0;
            opacity: 0.5;
            transition: opacity 0.3s ease-in-out;
          }
          image-circle:hover {
            opacity: 1;
          }`)
      )
      .then((imageCircle) => document.body.appendChild(imageCircle))
      .catch(console.error);
  }

  #videoWindow(wUnit: number, hUnit: number) {
    void import(/* webpackChunkName: "FlayVideoViewPanel" */ '@flay/panel/FlayVideoViewPanel').then(({ FlayVideoViewPanel }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Video', {
            top: 0,
            left: 0,
            width: RandomUtils.getRandomInt(0, wUnit) + wUnit * 6,
            height: RandomUtils.getRandomInt(0, hUnit) + hUnit * 7,
            edges: [ModalWindow.EDGE.TOP, ModalWindow.EDGE.LEFT],
          })
        )
        .appendChild(new FlayVideoViewPanel());
    });
  }

  #basketWindow(wUnit: number, hUnit: number) {
    void import(/* webpackChunkName: "FlayBasket" */ '@flay/panel/FlayBasket').then(({ FlayBasket }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Basket', {
            top: 0,
            left: 0,
            width: RandomUtils.getRandomInt(0, wUnit) + wUnit * 4,
            height: RandomUtils.getRandomInt(0, hUnit) + hUnit * 3,
            edges: [ModalWindow.EDGE.BOTTOM, ModalWindow.EDGE.LEFT],
          })
        )
        .appendChild(new FlayBasket());
    });
  }

  #memoWindow(wUnit: number, hUnit: number) {
    void import(/* webpackChunkName: "FlayMemoEditor" */ '@flay/panel/FlayMemoEditor').then(({ FlayMemoEditor }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Memo', {
            top: 0,
            left: 0,
            width: RandomUtils.getRandomInt(0, wUnit) + wUnit * 1,
            height: RandomUtils.getRandomInt(0, hUnit) + hUnit * 2,
            edges: [ModalWindow.EDGE.BOTTOM, ModalWindow.EDGE.RIGHT],
          })
        )
        .appendChild(new FlayMemoEditor());
    });
  }

  #imageFallWindow(wUnit: number, hUnit: number) {
    void import(/* webpackChunkName: "ImageFall" */ '@image/ImageFall').then(({ ImageFall }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Image Fallen', {
            top: 0,
            left: 0,
            width: RandomUtils.getRandomInt(0, wUnit) + wUnit * 1,
            height: RandomUtils.getRandomInt(0, hUnit) + hUnit * 8,
            edges: [ModalWindow.EDGE.TOP, ModalWindow.EDGE.RIGHT],
          })
        )
        .appendChild(new ImageFall({ mode: 'random' }));
    });
  }

  #imageOneWindow(wUnit: number, hUnit: number) {
    void import(/* webpackChunkName: "ImageOne" */ '@image/ImageOne').then(({ ImageOne }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Image One', {
            top: 0,
            left: 0,
            width: RandomUtils.getRandomInt(0, wUnit) + wUnit * 8,
            height: RandomUtils.getRandomInt(0, hUnit) + hUnit * 6,
            edges: [ModalWindow.EDGE.TOP, ModalWindow.EDGE.RIGHT],
          })
        )
        .appendChild(new ImageOne());
    });
  }

  #browserWindow(wUnit: number) {
    void import(/* webpackChunkName: "BrowserPanel" */ '@lib/components/BrowserPanel').then(({ BrowserPanel }) => {
      document
        .querySelector('body > main')!
        .appendChild(
          new ModalWindow('Browser Panel', {
            top: 0,
            left: RandomUtils.getRandomInt(0, wUnit) + wUnit * 6,
            width: 730,
            height: 1326,
            initialMode: ModalWindow.MODE.NORMAL,
            edges: [ModalWindow.EDGE.TOP],
          })
        )
        .appendChild(new BrowserPanel());
    });
  }

  #countdown() {
    const header = document.body.appendChild(document.createElement('header'));

    const countdown = header.appendChild(new Countdown());
    const time = header.appendChild(document.createElement('input'));
    const startBtn = header.appendChild(document.createElement('button'));
    const pauseBtn = header.appendChild(document.createElement('button'));
    const resumeBtn = header.appendChild(document.createElement('button'));
    const resetBtn = header.appendChild(document.createElement('button'));

    startBtn.innerHTML = 'Start';
    pauseBtn.innerHTML = 'Pause';
    resumeBtn.innerHTML = 'Resume';
    resetBtn.innerHTML = 'Reset';

    time.type = 'number';
    time.min = String(1);
    time.step = String(1);
    time.value = String(10);

    header.style.cssText = 'position: absolute; top: 10rem; left: 10rem; display: flex; flex-direction: column; align-items: center;';
    countdown.style.cssText = 'padding: 1rem; border: 1px solid var(--color-orange); width: 12rem; height: 12rem';
    time.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    startBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    pauseBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    resumeBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    resetBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';

    startBtn.addEventListener('click', () => countdown.start(Number(time.value)));
    pauseBtn.addEventListener('click', () => countdown.pause());
    resumeBtn.addEventListener('click', () => countdown.resume());
    resetBtn.addEventListener('click', () => countdown.reset());
  }

  #tickTimer() {
    const header = document.body.appendChild(document.createElement('header'));

    const timer = header.appendChild(new TickTimer());
    const time = header.appendChild(document.createElement('input'));
    const startBtn = header.appendChild(document.createElement('button'));
    const pauseBtn = header.appendChild(document.createElement('button'));
    const resumeBtn = header.appendChild(document.createElement('button'));
    const stopBtn = header.appendChild(document.createElement('button'));

    startBtn.textContent = 'Start';
    pauseBtn.textContent = 'Pause';
    resumeBtn.textContent = 'Resume';
    stopBtn.textContent = 'Stop';

    time.type = 'number';
    time.min = String(1);
    time.step = String(1);
    time.value = String(10);

    header.style.cssText = 'position: absolute; top: 10rem; left: 24rem; display: flex; flex-direction: column; align-items: center;';
    timer.style.cssText = 'padding: 1rem; border: 1px solid var(--color-orange); width: 12rem; height: 12rem; font-size: 8rem;';
    time.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    startBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    pauseBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    resumeBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';
    stopBtn.style.cssText = 'width: 6rem; margin: 1rem; padding: 0.25rem 0.5rem; border: 1px solid var(--color-orange)';

    startBtn.addEventListener('click', () => timer.start(Number(time.value)));
    stopBtn.addEventListener('click', () => timer.stop());
    pauseBtn.addEventListener('click', () => timer.pause());
    resumeBtn.addEventListener('click', () => timer.resume());
  }

  #flayMarkerPanel() {
    const mainElement = document.querySelector('body > main')!;
    void import(/* webpackChunkName: "FlayMarkerPanel" */ '@flay/panel/FlayMarkerPanel')
      .then(({ FlayMarkerPanel }) => new FlayMarkerPanel({}))
      .then((flayMarkerPanel) => {
        mainElement.appendChild(flayMarkerPanel);
        mainElement.addEventListener('click', (e: Event) => {
          const mouseEvent = e as MouseEvent;
          if (mouseEvent.target !== mainElement) return;
          const inputNumber = mouseEvent.clientX * mouseEvent.clientY;
          const flayMarkers = Array.from(flayMarkerPanel.childNodes) as FlayMarker[];
          const randomIndex = inputNumber % flayMarkers.length;
          flayMarkers[randomIndex]?.click();
        });
      });
  }

  #flayMarkerSky() {
    const mainElement = document.querySelector('body > main')!;
    void import(/* webpackChunkName: "FlayMarkerSky" */ '@flay/panel/FlayMarkerSky')
      .then(({ FlayMarkerSky }) => new FlayMarkerSky())
      .then((flayMarkerSky) => {
        mainElement.appendChild(flayMarkerSky);
      });
  }

  #imageCircle() {
    const mainElement = document.querySelector('body > main') as HTMLElement;
    mainElement.style.display = 'flex';
    mainElement.style.justifyContent = 'center';
    mainElement.style.alignItems = 'center';
    mainElement.style.height = '100vh';
    void import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
      .then(({ ImageCircle }) => new ImageCircle({ rem: 50, shape: 'circle', effect: 'emboss', duration: 2000, eventAllow: false }))
      .then((imageCircle) => {
        mainElement.appendChild(imageCircle);
      });
  }
}

new Page().start();

function newHTMLButtonElement(type: 'button' | 'submit' | 'reset', text: string, callback: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.type = type;
  button.addEventListener('click', callback);
  return button;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = /* html */ `
    <div class="dialog-test">
      <h2>FlayDialog 테스트</h2>
      <div class="dialog-test__buttons">
        <button id="btn-alert" class="dialog-test__btn">showAlert</button>
        <button id="btn-confirm" class="dialog-test__btn">showConfirm</button>
        <button id="btn-confirm-opts" class="dialog-test__btn">showConfirm (옵션)</button>
        <button id="btn-loading" class="dialog-test__btn">showLoading (3초)</button>
        <button id="btn-dialog" class="dialog-test__btn">showDialog</button>
      </div>
      <pre id="dialog-test-result" class="dialog-test__result"></pre>
    </div>
  `;

  const result = document.querySelector<HTMLPreElement>('#dialog-test-result')!;
  const log = (text: string) => (result.textContent = text);

  document.querySelector('#btn-alert')?.addEventListener('click', async () => {
    await showAlert('저장이 완료되었습니다.', '알림');
    log('alert 닫힘');
  });

  document.querySelector('#btn-confirm')?.addEventListener('click', async () => {
    const ok = await showConfirm('삭제하시겠습니까?', '삭제');
    log(`confirm 결과: ${ok ? '확인' : '취소'}`);
  });

  document.querySelector('#btn-confirm-opts')?.addEventListener('click', async () => {
    const ok = await showConfirm({
      message: '계속 진행하시겠습니까?',
      title: '진행 확인',
      okLabel: '계속',
      cancelLabel: '중단',
    });
    log(`confirm(옵션) 결과: ${ok ? '계속' : '중단'}`);
  });

  document.querySelector('#btn-loading')?.addEventListener('click', async () => {
    log('로딩 중...');
    const hide = showLoading('처리 중입니다...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    hide();
    log('로딩 종료');
  });

  document.querySelector('#btn-dialog')?.addEventListener('click', async () => {
    const result = await showDialog<string>({
      title: '저장 방식 선택',
      content: '<p>어떤 방식으로 저장할까요?</p>',
      buttons: [
        { label: '덮어쓰기', value: 'overwrite', primary: true },
        { label: '새 파일', value: 'new' },
        { label: '취소', value: 'cancel' },
      ],
    });
    log(`dialog 결과: ${result ?? '닫힘(null)'}`);
  });
});
