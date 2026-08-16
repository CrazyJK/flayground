/**
 * 비디오 관련 커스텀 엘리먼트의 베이스 클래스입니다.
 *
 * - `ground`, `ground-movie` 클래스를 자동으로 추가합니다.
 * - 비디오 컴포넌트는 이 클래스를 상속하여 구현합니다.
 */
export default class GroundMovie extends HTMLElement {
  constructor() {
    super();
    this.classList.add('ground', 'ground-movie');
  }
}
