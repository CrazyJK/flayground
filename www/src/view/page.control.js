import './inc/Page';
import './page.control.scss';

import '../flay/panel/FlayBatch';
import '../flay/panel/FlayCandidate';
import '../flay/panel/FlayFinder';
import '../flay/panel/FlayRegister';
import '../flay/panel/SubtitlesFinder';

import FlayMemoEditor from '../flay/panel/FlayMemoEditor';
import { MODAL_EDGE } from '../GroundConstant';
import { tabUI } from '../lib/TabUI';
import ModalWindow from '../ui/ModalWindow';

tabUI(document);

document
  .querySelector('body')
  .appendChild(
    new ModalWindow('Memo', {
      top: 60,
      left: 0,
      width: 400,
      height: 250,
      edges: [MODAL_EDGE.BOTTOM, MODAL_EDGE.RIGHT],
    })
  )
  .appendChild(new FlayMemoEditor());
