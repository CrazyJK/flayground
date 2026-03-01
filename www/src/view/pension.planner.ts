/**
 * DC 퇴직연금 리밸런싱 플래너 - 엔트리 포인트
 * webpack에서 pension.planner 번들의 진입점으로 사용됩니다.
 */
import { PensionPlanner } from '../pension/pensionPlanner';
import '../pension/pensionPlanner.scss';

new PensionPlanner();
