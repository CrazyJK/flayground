import arrow from '@svg/arrow';
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

export const svgMap = new Map<string, string>([
  ['subtitles', subtitlesSVG],
  ['favorite', favoriteSVG],
  ['noFavorite', noFavoriteSVG],
  ['folder', folderSVG],
  ['newWindow', newWindowSVG],
  ['edit', editSVG],
  ['torrent', torrentSVG],
  ['cloudDown', cloudDownSVG],
  ['tag', tagSVG],
  ['trashBin', trashBinSVG],
  ['basket', basketSVG],
  ['json', jsonSVG],
  ['play', playSVG],
  ['youtube', youtubeSVG],
  ['vagina', vaginaSVG],
  ['nextTrack', controlsSVG.nextTrack],
  ['pause', controlsSVG.pause],
  ['volume', controlsSVG.volume],
  ['rank-1', rankSVG[0]!],
  ['rank0', rankSVG[1]!],
  ['rank1', rankSVG[2]!],
  ['rank2', rankSVG[3]!],
  ['rank3', rankSVG[4]!],
  ['rank4', rankSVG[5]!],
  ['rank5', rankSVG[6]!],
  ['os', themeSVG.os],
  ['light', themeSVG.light],
  ['dark', themeSVG.dark],
  ['cloud', weatherSVG.cloud],
  ['rain', weatherSVG.rain],
  ['snow', weatherSVG.snow],
  ['sunny', weatherSVG.sunny],
  ['minimize', windowButton.minimize],
  ['maximize', windowButton.maximize],
  ['terminate', windowButton.terminate],
  ['reload', windowButton.reload],
  ['fullscreen', windowButton.fullscreen],
  ['normalscreen', windowButton.normalscreen],
  ['expand', windowButton.expand],
  ['compress', windowButton.compress],
  ['arrow.square.Up', arrow.square.Up],
  ['arrow.square.Down', arrow.square.Down],
  ['arrow.square.Left', arrow.square.Left],
  ['arrow.square.Right', arrow.square.Right],
  ['arrow.square.UpLeft', arrow.square.UpLeft],
  ['arrow.square.UpRight', arrow.square.UpRight],
  ['arrow.square.DownLeft', arrow.square.DownLeft],
  ['arrow.square.DownRight', arrow.square.DownRight],
  ['arrow.circle.Up', arrow.circle.Up],
  ['arrow.circle.Down', arrow.circle.Down],
  ['arrow.circle.Left', arrow.circle.Left],
  ['arrow.circle.Right', arrow.circle.Right],
  ['arrow.circle.UpLeft', arrow.circle.UpLeft],
  ['arrow.circle.UpRight', arrow.circle.UpRight],
  ['arrow.circle.DownLeft', arrow.circle.DownLeft],
  ['arrow.circle.DownRight', arrow.circle.DownRight],
]);

export const svgNames = new Array<string>(
  'basket',
  'cloudDown',
  'controls.nextTrack',
  'controls.pause',
  'controls.volume',
  'edit',
  'favorite',
  'flayground_circle_t',
  'flayground_circle',
  'flayground_text',
  'folder',
  'json',
  'newWindow',
  'noFavorite',
  'play',
  'ranks-1',
  'ranks0',
  'ranks1',
  'ranks2',
  'ranks3',
  'ranks4',
  'ranks5',
  'subtitles',
  'tag',
  'themes.dark',
  'themes.light',
  'themes.os',
  'torrent',
  'trashBin',
  'vagina',
  'weathers.cloud',
  'weathers.rain',
  'weathers.snow',
  'weathers.sunny',
  'windowButton.fullscreen',
  'windowButton.maximize',
  'windowButton.minimize',
  'windowButton.normalscreen',
  'windowButton.reload',
  'windowButton.terminate',
  'windowButton.expand',
  'windowButton.compress',
  'youtube',
  'arrow.square.Up',
  'arrow.square.Down',
  'arrow.square.Left',
  'arrow.square.Right',
  'arrow.square.UpLeft',
  'arrow.square.UpRight',
  'arrow.square.DownLeft',
  'arrow.square.DownRight',
  'arrow.circle.Up',
  'arrow.circle.Down',
  'arrow.circle.Left',
  'arrow.circle.Right',
  'arrow.circle.UpLeft',
  'arrow.circle.UpRight',
  'arrow.circle.DownLeft',
  'arrow.circle.DownRight'
);

export class SvgProvider {
  static getSvg(name: string): string | undefined {
    return svgMap.get(name);
  }

  static getSvgURL(name: string): string | undefined {
    if (svgNames.includes(name)) {
      return `/svg/${name}.svg`;
    }
    return undefined;
  }
}
