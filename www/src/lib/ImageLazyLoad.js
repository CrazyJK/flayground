/**
 * Intersection Observer API는 상위 요소 또는 최상위 문서의 viewport와 대상 요소 사이의 변화를 비동기적으로 관찰할 수 있는 수단을 제공
 *
 * - ref) https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API
 */
const backgroundImageObserver = new IntersectionObserver((entries, observer) => {
  // entries: 보여지게된 객체 배열
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const entryTarget = entry.target;
      entryTarget.style.backgroundImage = `url('${entryTarget.dataset.lazyBackgroundImageUrl}')`;
      delete entryTarget.dataset.lazyBackgroundImageUrl;

      observer.unobserve(entryTarget);
      console.debug('unobserve', entryTarget);
    }
  });
});

export const lazyLoadBackgrungImage = () => {
  backgroundImageObserver.disconnect();
  document.querySelectorAll('[data-lazy-background-image-url]').forEach((image) => {
    backgroundImageObserver.observe(image);
  });

  console.log('lazyLoadBackgrungImage completed');
};
