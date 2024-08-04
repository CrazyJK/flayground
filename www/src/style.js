import './init/Page';
import './style.scss';

import './attach/FlayAttach';
import './control/FlayBatch';
import './control/FlayCandidate';
import './control/FlayControl';
import './control/FlayFinder';
import './control/FlayRegister';
import './control/SubtitlesFinder';
import './flay/FlayCard';
import './flay/FlayMonitor';
import './flay/FlayPage';
import './flay/FlayVideoPlayer';
import './flay/page/FlayCondition';
import './flay/page/FlayPagination';
import './flay/part/FlayActress';
import './flay/part/FlayComment';
import './flay/part/FlayCover';
import './flay/part/FlayFiles';
import './flay/part/FlayOpus';
import './flay/part/FlayRank';
import './flay/part/FlayRelease';
import './flay/part/FlayStudio';
import './flay/part/FlayTag';
import './flay/part/FlayTitle';
import './image/ImageFall';
import './image/part/FlayImage';
import './image/part/ImageFrame';
import './lib/Drag&Drop';
import './lib/SseConnector';
import './lib/TabUI';
import './lib/TableUtils';
import './nav/SideNavBar';
import './nav/part/ThemeController';
import SVG from './svg/SVG';

const svgWrap = document.createElement('div');
svgWrap.classList.add('svg-wrap');
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.subtitles;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.favorite;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.noFavorite;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[0];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[1];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[2];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[3];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[4];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[5];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.rank[6];
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.folder;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.newWindow;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.theme.os;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.theme.light;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.theme.dark;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.edit;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.weather.sunny;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.weather.cloud;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.weather.rain;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.weather.snow;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.controls.nextTrack;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.controls.pause;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.controls.volume;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.torrent;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.cloudDown;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.tag;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.trashBin;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.basket;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.json;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.play;
svgWrap.appendChild(document.createElement('label')).innerHTML = SVG.youtube;

svgWrap.appendChild(document.createElement('label')).appendChild(new Image()).src = './svg/flayground-text.svg';
svgWrap.appendChild(document.createElement('label')).appendChild(new Image()).src = './svg/flayground-circle.svg';
svgWrap.appendChild(document.createElement('label')).appendChild(new Image()).src = './svg/flayground-circle-t.svg';

document.querySelector('body').append(svgWrap);
