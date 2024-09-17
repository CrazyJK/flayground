import './init/Page';
import './style.scss';

import basketSVG from './svg/basket.svg';
import cloudDownSVG from './svg/cloudDown.svg';
import editSVG from './svg/edit.svg';
import favoriteSVG from './svg/favorite.svg';
import folderSVG from './svg/folder.svg';
import jsonSVG from './svg/json.svg';
import newWindowSVG from './svg/newWindow.svg';
import noFavoriteSVG from './svg/noFavorite.svg';
import playSVG from './svg/play.svg';
import subtitlesSVG from './svg/subtitles.svg';
import tagSVG from './svg/tag.svg';
import torrentSVG from './svg/torrent.svg';
import trashBinSVG from './svg/trashBin.svg';
import vaginaSVG from './svg/vagina.svg';
import youtubeSVG from './svg/youtube.svg';

import controlsSVG from './svg/js/controlsSVG';
import rankSVG from './svg/js/rankSVG';
import themeSVG from './svg/js/themeSVG';
import weatherSVG from './svg/js/weatherSVG';

Element.prototype.appendSVG = function (svg) {
  this.appendChild(document.createElement('label')).innerHTML = svg;
  return this;
};

Element.prototype.appendIMG = function (imgSrc) {
  this.appendChild(document.createElement('label')).appendChild(new Image()).src = imgSrc;
  return this;
};

document
  .getElementById('svgContainer')
  .appendSVG(subtitlesSVG)
  .appendSVG(favoriteSVG)
  .appendSVG(noFavoriteSVG)
  .appendSVG(folderSVG)
  .appendSVG(newWindowSVG)
  .appendSVG(editSVG)
  .appendSVG(torrentSVG)
  .appendSVG(cloudDownSVG)
  .appendSVG(tagSVG)
  .appendSVG(trashBinSVG)
  .appendSVG(basketSVG)
  .appendSVG(jsonSVG)
  .appendSVG(playSVG)
  .appendSVG(youtubeSVG)
  .appendSVG(vaginaSVG)
  .appendSVG(controlsSVG.nextTrack)
  .appendSVG(controlsSVG.pause)
  .appendSVG(controlsSVG.volume)
  .appendSVG(rankSVG[0])
  .appendSVG(rankSVG[1])
  .appendSVG(rankSVG[2])
  .appendSVG(rankSVG[3])
  .appendSVG(rankSVG[4])
  .appendSVG(rankSVG[5])
  .appendSVG(rankSVG[6])
  .appendSVG(themeSVG.os)
  .appendSVG(themeSVG.light)
  .appendSVG(themeSVG.dark)
  .appendSVG(weatherSVG.cloud)
  .appendSVG(weatherSVG.rain)
  .appendSVG(weatherSVG.snow)
  .appendSVG(weatherSVG.sunny)
  .appendIMG('./svg/flayground-text.svg')
  .appendIMG('./svg/flayground-circle.svg')
  .appendIMG('./svg/flayground-circle-t.svg');
