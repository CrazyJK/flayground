import FlayBatch from './elements/control/FlayBatch';
import FlayCandidate from './elements/control/FlayCandidate';
import FlayFinder from './elements/control/FlayFinder';
import FlayRegister from './elements/control/FlayRegister';
import SubtitlesFinder from './elements/control/SubtitlesFinder';
import './page.control.scss';
import './util/flay.sse';

import SideNavBar from './elements/page/SideNavBar';
document.querySelector('body').prepend(new SideNavBar());

let targetId;
let targetContent;

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    targetId = e.target.getAttribute('for');
    targetContent = document.querySelector('#' + targetId);
    console.log('click', targetId);

    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });
    e.target.classList.add('active');

    tabContents.forEach((tab) => {
      tab.classList.remove('active');
    });
    targetContent.classList.add('active');

    console.log('hasChildNodes', targetContent.hasChildNodes());

    if (!targetContent.hasChildNodes()) {
      switch (targetId) {
        case 'search':
          targetContent.appendChild(new FlayFinder());
          break;
        case 'regist':
          targetContent.appendChild(new FlayRegister());
          break;
        case 'batch':
          targetContent.appendChild(new FlayBatch());
          break;
        case 'subtitles':
          targetContent.appendChild(new SubtitlesFinder());
          break;
        case 'candidates':
          targetContent.appendChild(new FlayCandidate());
          break;
        default:
          break;
      }
    }
  });
});
