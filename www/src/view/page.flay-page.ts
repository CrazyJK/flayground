import FlayPage from '@flay/domain/FlayPage';
import FlayCondition from '@flay/panel/FlayCondition';
import FlayPagination from '@flay/panel/FlayPagination';
import { generate } from '../ai/index-proxy';
import FlayFetch from '../lib/FlayFetch';
import './inc/Page';
import './page.flay-page.scss';

const flayCondition = document.querySelector('body > main > header')!.appendChild(new FlayCondition());
const flayPagination = document.querySelector('body > main > footer')!.appendChild(new FlayPagination());
const flayPage = document.querySelector('body > main > article')!.appendChild(new FlayPage());

flayCondition.addEventListener('fetch', () => {
  flayPagination.set(flayCondition.opusList);
  suggestOpusByAI(flayCondition.opusList);
});
flayPagination.addEventListener('change', async () => {
  flayPagination.off();
  if (flayPagination.opus) {
    const viewTransition = document.startViewTransition(async () => {
      await flayPage.set(flayPagination.opus!);
      flayPage.classList.toggle('hide', false);
    });
    await viewTransition.updateCallbackDone;
    flayPagination.on();
  } else {
    flayPage.classList.toggle('hide', true);
  }
});

/**
 * mcp-gemini API를 사용하여 opus 목록에서 하나를 선택하도록 AI에 요청하고
 * 선택된 opus를 화면에 버튼으로 표시하고, 사용자가 클릭하면
 * `flayPagination`에 opus를 설정하여 페이지를 업데이트합니다.
 * @param opusList - 전체 opus 목록
 */
async function suggestOpusByAI(opusList: string[]) {
  const flayList = await FlayFetch.getFlayList(...opusList);
  const flayData = flayList.map((flay) => {
    return {
      opus: flay.opus,
      title: flay.title,
      release: flay.release,
      actress: flay.actressList.join(', '),
      lastPlayed: flay.video.lastPlay,
      rank: flay.video.rank,
      tags: flay.video.tags?.map((tag) => tag.name).join(', '),
    };
  });
  console.log('AI 추천을 위한 Flay 데이터:', flayData);

  const prompt = `다음 목록에서 opus 하나를 선택하고, 선택 이유를 간략하게 설명하세요.
    반드시 아래 형식으로만 답하세요:
    OPUS: <opus 코드>
    REASON: <선택 이유>

    ${JSON.stringify(flayData)}`;

  generate(prompt, { maxTokens: 100 })
    .then((response) => {
      const text = response.text.trim();
      const opusMatch = text.match(/OPUS:\s*(\S+)/);
      const reasonMatch = text.match(/REASON:\s*(.+)/);

      const selectedOpus = opusMatch?.[1]?.trim() ?? '';
      const reason = reasonMatch?.[1]?.trim() ?? '';

      console.log('AI 추천 opus:', selectedOpus, '/', reason);

      if (!opusList.includes(selectedOpus)) {
        console.warn('AI가 선택한 opus가 목록에 없습니다:', selectedOpus);
        return;
      }

      // 기존 추천 버튼 제거
      document.querySelector('.ai-opus-suggestion')?.remove();

      // AI 추천 버튼 생성 및 화면에 표시
      const suggestion = document.createElement('button');
      suggestion.className = 'ai-opus-suggestion';
      suggestion.title = `${selectedOpus} - 클릭하여 이동`;
      suggestion.innerHTML = `<strong>${selectedOpus}</strong>${reason}`;
      document.body.appendChild(suggestion);

      // 클릭 시 해당 opus로 이동
      suggestion.addEventListener('click', () => {
        flayPagination.opusIndex = opusList.indexOf(selectedOpus);
        flayPagination.opus = selectedOpus;
        flayPagination.dispatchEvent(new Event('change'));
        suggestion.remove();
      });

      // 60초 후 자동 제거
      setTimeout(() => suggestion.remove(), 60_000);
    })
    .catch((error) => {
      console.error('AI opus 추천 오류:', error);
    });
}
