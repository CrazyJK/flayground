import '../image/InfiniteImageGallery';
import './inc/Page';
import './index.scss';

// 갤러리 커스텀 엘리먼트 생성 및 추가
const main = document.querySelector('body > main') as HTMLDivElement;
const gallery = document.createElement('infinite-image-gallery');
main.appendChild(gallery);
