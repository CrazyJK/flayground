/**
 * flay utility
 */

import $ from 'jquery';
import { browser, FIREFOX, PATH, Popup, Random } from './crazy.common.js';
import { Rest } from './flay.rest.service.js';

const todayYear = new Date().getFullYear();

export const Util = {
  Flay: {
    sort(flayList, sort) {
      const compareTo = (data1, data2) => {
        var result = 0;
        if (typeof data1 === 'number') {
          result = data1 - data2;
        } else if (typeof data1 === 'string') {
          result = data1.toLowerCase().localeCompare(data2.toLowerCase());
        } else if (typeof data1 === 'object') {
          // maybe actressList
          result = Util.Actress.getNames(data1).localeCompare(Util.Actress.getNames(data2));
        } else {
          result = data1 > data2 ? 1 : -1;
        }
        return result;
      };
      flayList.sort(function (flay1, flay2) {
        switch (sort) {
          case 'S': {
            const sVal = compareTo(flay1.studio, flay2.studio);
            return sVal === 0 ? compareTo(flay1.opus, flay2.opus) : sVal;
          }
          case 'O':
            return compareTo(flay1.opus, flay2.opus);
          case 'T':
            return compareTo(flay1.title, flay2.title);
          case 'A': {
            const aVal = compareTo(flay1.actressList, flay2.actressList);
            return aVal === 0 ? compareTo(flay1.opus, flay2.opus) : aVal;
          }
          case 'R': {
            const rVal = compareTo(flay1.release, flay2.release);
            return rVal === 0 ? compareTo(flay1.opus, flay2.opus) : rVal;
          }
          case 'M':
            return compareTo(flay1.lastModified, flay2.lastModified);
          case 'P': {
            const pVal = compareTo(flay1.video.play, flay2.video.play);
            return pVal === 0 ? compareTo(flay1.release, flay2.release) : pVal;
          }
        }
      });
    },
  },
  Tag: {
    includes(tags, _tag) {
      var found = false;
      $.each(tags, function (idx, tag) {
        if (typeof _tag === 'string') {
          if (tag.name === _tag) {
            found = true;
          }
        } else {
          if (tag.id === _tag.id) {
            found = true;
          }
        }
      });
      return found;
    },
    indexOf(tags, _tag) {
      var found = -1;
      $.each(tags, function (idx, tag) {
        if (tag.id === _tag.id) {
          found = idx;
        }
      });
      return found;
    },
    push(tags, tag) {
      var idx = Util.Tag.indexOf(tags, tag);
      if (idx < 0) {
        tags.push(tag);
      }
    },
    remove(tags, tag) {
      var idx = Util.Tag.indexOf(tags, tag);
      if (idx > -1) {
        tags.splice(idx, 1);
      }
    },
    sort(tags) {
      tags.sort(function (t1, t2) {
        return t1.name.localeCompare(t2.name);
      });
    },
  },
  Actress: {
    getNames(actressList) {
      if (actressList != null && Array.isArray(actressList)) {
        return actressList.map((actress) => (typeof actress === 'string' ? actress : actress.name)).join(', ');
      } else if (typeof actressList === 'string') {
        return actressList;
      } else {
        return '';
      }
    },
    get(actressList, className) {
      var list = [];
      if (actressList != null && Array.isArray(actressList)) {
        $.each(actressList, function (idx, actress) {
          var $actress = $('<span>', { class: className ? 'actress' : '' })
            .html(actress)
            .on('click', function () {
              View.actress(actress);
            })
            .css({
              cursor: 'pointer',
            });
          list.push($actress);
        });
      }
      return list;
    },
    getAgeNumber(actress, baseYear) {
      return Number(baseYear || todayYear) - parseInt(actress.birth.substring(0, 4)) + 1;
    },
    getAge(actress, baseYear) {
      if (actress.birth) {
        return `${this.getAgeNumber(actress, baseYear)}<small>y</small>`;
      } else {
        return '';
      }
    },
    getBirth(actress) {
      if (actress.birth) {
        return actress.birth.replace(/年|月|日/g, (match, offset, string) => {
          return '<small>' + match + '</small>';
        });
      } else {
        return '';
      }
    },
    getCup(actress) {
      if (actress.body) {
        return actress.body.replace(/[-0-9\s]/g, '');
      } else {
        return '';
      }
    },
    getBody(actress) {
      if (actress.body) {
        return actress.body
          .split(' - ')
          .map((b) => {
            let cup = b.replace(/[0-9]/g, '');
            let inch = Math.round(parseInt(b) / 2.54);
            return inch + cup;
          })
          .join('<small>-</small>');
      } else {
        return '';
      }
    },
    getHeight(actress) {
      if (actress.height) {
        return actress.height + '<small>cm</small>';
      } else {
        return '';
      }
    },
    getDebut(actress) {
      if (actress.debut) {
        return actress.debut + '<small>d</small>';
      } else {
        return '';
      }
    },
    toArray(names) {
      var split = names.split(',');
      for (var i = 0; i < split.length; i++) {
        split[i] = split[i].trim();
      }
      return split;
    },
  },
};

export const View = {
  flay(opus) {
    Popup.open(PATH + './info.flay.html?opus=' + opus, 'flay-' + opus, 800, 770);
  },
  flayInPage(flay) {
    if ($('#flayInPage').length === 0) {
      $(`	<div id="flayInPage" class="collapse fixed-center rounded shadow" style="width: 800px">
					<span class="text-light hover" style="position: absolute; right: 0; bottom: 0; margin: 5px; font-size: 3rem; line-height: 0.5; text-shadow: 0px 0px 4px #000;" onclick="$(this).parent().hide();">&times;</span>
					<div style="font-size: initial; font-family: initial; box-shadow: 0 0 0.125rem 0.125rem orange, 0 0 1rem 1rem #000;"></div>
				</div>`).appendTo($('body'));
    }
    $('#flayInPage > div').empty().appendFlayCard(flay);
    $('#flayInPage').show();
  },
  video(opus) {
    Popup.open(PATH + '/info/video/' + opus, 'video-' + opus, 400, 300);
  },
  actress(name) {
    Popup.open(PATH + './info.actress.html?name=' + name, 'actress-' + name, 1072, 1100);
  },
  tag(tagId) {
    // Popup.open(PATH + '/info/tag/' + tagId, 'Tag-' + tagId, 800, 650);
    Popup.open(PATH + './info.tag.html?id=' + tagId, 'Tag-' + tagId, 1072, 650);
  },
  studio(name) {
    Popup.open(PATH + './info.studio.html?s=' + name, 'Studio-' + name, 1072, 1900);
  },
};

const URL_SEARCH_ARZON = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=';
const URL_SEARCH_AVNORI = 'https://avnori6.com/bbs/search.php?search_flag=search&stx=';
const URL_SEARCH_NEXTJAV = 'https://nextjav.com/torrent/detail/';
const URL_SEARCH_AVDBS = 'https://www.avdbs.com/menu/search.php?kwd=';
const URL_SEARCH_ACTRESS = 'https://www.minnano-av.com/search_result.php?search_scope=actress&search=+Go+&search_word=';

const URL_SEARCH_GOOGLE = 'https://www.google.co.kr/search?q=';
const URL_TRANSLATE_GOOGLE = 'https://translate.google.co.kr/?hl=ko&tab=wT#ja/ko/';
const URL_TRANSLATE_PAPAGO = 'https://papago.naver.com/?sk=auto&tk=ko&st=';

const URL_SEARCH_SUBTITLES = 'https://www.subtitlecat.com/index.php?search=';

const URL_FIND_ACTRESS = 'http://javtorrent.re/tag/';

export const Search = {
  opus(keyword) {
    var url = FIREFOX === browser ? URL_SEARCH_ARZON : URL_SEARCH_AVNORI;
    Popup.open(url + keyword, 'opusSearch', 1500, 1000);
  },
  arzon(keyword) {
    Popup.open(URL_SEARCH_ARZON + keyword, 'arzonSearch', 800, 1000);
  },
  avnori(keyword) {
    Popup.open(URL_SEARCH_AVNORI + keyword, 'avnoriSearch', 800, 1000);
  },
  avdbs(keyword) {
    Popup.open(URL_SEARCH_AVDBS + keyword, 'avdbsSearch', 800, 1000);
  },
  nextjav(keyword) {
    Popup.open(URL_SEARCH_NEXTJAV + keyword, 'nextjavSearch', 800, 1000);
  },
  actress(keyword) {
    Popup.open(URL_SEARCH_ACTRESS + encodeURI(keyword), 'actressSearch', 1200, 950);
  },
  torrent(keyword) {
    Popup.open(URL_SEARCH_GOOGLE + keyword + '+FHD+torrent', 'torrentSearch', 900, 950);
  },
  google(keyword) {
    Popup.open(URL_SEARCH_GOOGLE + keyword, 'googleSearch', 800, 1000);
  },
  translateByPapago(message) {
    Popup.open(URL_TRANSLATE_PAPAGO + message, 'translateByPapago', 1000, 500);
  },
  translateByGoogle(message) {
    Popup.open(URL_TRANSLATE_GOOGLE + message, 'translateByGoogle', 1000, 500);
  },
  opusByRandom() {
    Search.opus(Random.getInteger(1, 999));
  },
  find(keyword) {
    Popup.open(URL_FIND_ACTRESS + encodeURI(keyword), 'findSearch', 1200, 950);
  },
  subtitles(keyword, w, h) {
    Popup.open(URL_SEARCH_SUBTITLES + keyword, 'subtitlesSearch', w || 900, h || 950);
  },
  subtitlesUrlIfFound(opus, callback) {
    $.ajax({
      url: '/file/find/exists/subtitles?opus=' + opus,
      success: (result) => {
        if (typeof callback === 'function') {
          callback(result, opus);
        }
      },
    });
  },
};

export const Security = {
  principal: null,
  getUser() {
    Rest.Security.whoami((principal) => {
      this.principal = principal;
    });
  },
  hasRole(role) {
    if (this.principal == null) {
      this.getUser();
    }
    for (let { authority } of this.principal.authorities) {
      if (authority === 'ROLE_' + role) {
        return true;
      }
    }
    return false;
  },
  getName() {
    if (this.principal == null) {
      this.getUser();
    }
    return this.principal.username;
  },
  isAutomaticallyCertificated() {
    return Rest.Security.isAutomaticallyCertificated();
  },
};
