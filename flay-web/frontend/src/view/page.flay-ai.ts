import './inc/Page';
import './page.flay-ai.scss';

void import(/* webpackChunkName: "FlayAiChatPanel" */ '@ai/FlayAiChatPanel').then(({ default: FlayAiChatPanel }) => {
  document.querySelector('main')!.appendChild(new FlayAiChatPanel());
});
