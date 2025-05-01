/**
 * Intersection Observer API는 상위 요소 또는 최상위 문서의 viewport와 대상 요소 사이의 변화를 비동기적으로 관찰할 수 있는 수단을 제공
 *
 * - ref) https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API
 */

// 이미지 지연 로딩을 위한 IntersectionObserver 설정
const backgroundImageObserver = new IntersectionObserver((entries, observer) => {
  // entries: 뷰포트에 들어온 요소들의 배열
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const entryTarget = entry.target;
      try {
        // 화면에 보이는 요소에 배경 이미지 설정
        entryTarget.style.backgroundImage = `url('${entryTarget.dataset.lazyBackgroundImageUrl}')`;
        delete entryTarget.dataset.lazyBackgroundImageUrl;

        // 관찰 중단
        observer.unobserve(entryTarget);
        console.debug('이미지 지연 로딩 완료:', entryTarget);
      } catch (error) {
        console.error('이미지 지연 로딩 중 오류 발생:', error, entryTarget);
      }
    }
  });
});

/**
 * 문서 내의 모든 지연 로딩 대상 이미지를 관찰 시작
 */
export const lazyLoadBackgroundImage = () => {
  // 기존 모든 관찰 중단 후 새로 시작
  backgroundImageObserver.disconnect();

  const images = document.querySelectorAll('[data-lazy-background-image-url]');
  images.forEach((image) => {
    backgroundImageObserver.observe(image);
  });

  console.debug(`이미지 지연 로딩 설정 완료 (${images.length}개)`);
};

/**
 * 특정 요소 내의 지연 로딩 대상 이미지를 관찰 시작
 * @param {HTMLElement} element - 이미지를 포함하는 부모 요소
 */
export const addLazyLoadBackgroundImage = (element) => {
  if (!element) {
    console.warn('지연 로딩을 적용할 요소가 없습니다.');
    return;
  }

  const images = element.querySelectorAll('[data-lazy-background-image-url]');
  images.forEach((image) => {
    backgroundImageObserver.observe(image);
  });

  if (images.length > 0) {
    console.debug(`요소 내 이미지 지연 로딩 설정 완료 (${images.length}개)`);
  }
};
