import basketSVG from '@svg/basket';
import cloudDownSVG from '@svg/cloudDown';
import controlsSVG from '@svg/controls';
import editSVG from '@svg/edit';
import favoriteSVG from '@svg/favorite';
import folderSVG from '@svg/folder';
import jsonSVG from '@svg/json';
import newWindowSVG from '@svg/newWindow';
import noFavoriteSVG from '@svg/noFavorite';
import playSVG from '@svg/play';
import rankSVG from '@svg/ranks';
import subtitlesSVG from '@svg/subtitles';
import tagSVG from '@svg/tag';
import themeSVG from '@svg/themes';
import torrentSVG from '@svg/torrent';
import trashBinSVG from '@svg/trashBin';
import vaginaSVG from '@svg/vagina';
import weatherSVG from '@svg/weathers';
import windowButton from '@svg/windowButton';
import youtubeSVG from '@svg/youtube';
import './inc/Page';
import './style.scss';

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
  .appendSVG(windowButton.minimize)
  .appendSVG(windowButton.maximize)
  .appendSVG(windowButton.terminate)
  .appendSVG(windowButton.reload)
  .appendSVG(windowButton.fullscreen)
  .appendSVG(windowButton.normalscreen)
  .appendIMG('./svg/flayground-text.svg')
  .appendIMG('./svg/flayground-circle.svg')
  .appendIMG('./svg/flayground-circle-t.svg');
