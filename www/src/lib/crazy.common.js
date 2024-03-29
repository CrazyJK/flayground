export const agent = navigator.userAgent.toLowerCase(),
  MSIE = 'MSIE',
  EDGE = 'Edge',
  CHROME = 'Chrome',
  FIREFOX = 'Firefox',
  SAFARI = 'Safari',
  browser = /trident/i.test(agent) || /msie/i.test(agent) ? MSIE : /edge/i.test(agent) ? EDGE : /chrome/i.test(agent) ? CHROME : /firefox/i.test(agent) ? FIREFOX : /safari/i.test(agent) ? SAFARI : 'Unknown',
  WINDOWS = 'Windows',
  LINUX = 'Linux',
  MAC = 'Macintosh',
  IPHONE = 'iPhone',
  IPAD = 'iPad',
  ANDROID = 'Android',
  system = /Windows/i.test(agent) ? WINDOWS : /linux/i.test(agent) ? LINUX : /macintosh/i.test(agent) ? MAC : /iphone/i.test(agent) ? IPHONE : /ipad/i.test(agent) ? IPAD : /android/i.test(agent) ? ANDROID : 'Unknown',
  DEFAULT_SPECS = 'toolbar=0,location=0,directories=0,titlebar=0,status=0,menubar=0,scrollbars=1,resizable=1',
  PATH = '',
  COVER_RATIO = 0.6625,
  COVER_ASPECT_RATIO = '80 / 53';

export const Popup = {
  /**
   * 팝업창을 띄운다.
   * @param url
   * @param name '-'글자는 ''으로 바뀜
   * @param width if null, 화면 절반 크기
   * @param height if null, 화면 절반 크기
   * @param positionMethod if null, 화면 가운데. Mouse 마우스 위치.
   * @param specs if null, default is DEFAULT_SPECS
   */
  open(url, name, width, height, positionMethod, specs, event) {
    // console.log("[popup] Call popup : ", url, name, width, height, positionMethod, specs, event);
    var windowScreenWidth = window.screen.width,
      windowScreenHeight = window.screen.height;
    var left, top;

    name = name.replace(/-/gi, '');
    if (width === '100%') {
      width = windowScreenWidth;
    } else {
      width = width || windowScreenWidth / 2;
    }
    if (height === '100%') {
      height = windowScreenHeight;
    } else {
      height = height || windowScreenHeight / 2;
    }

    if (positionMethod && positionMethod === 'Mouse') {
      left = event.screenX;
      top = event.screenY;
    } else {
      left = (windowScreenWidth - width) / 2;
      top = (windowScreenHeight - height) / 2;
    }
    specs = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',' + (specs || DEFAULT_SPECS);
    // console.log("[popup] window.open : ", url, name, specs);

    var popupWindow = window.open(url, name, specs);
    if (popupWindow) {
      popupWindow.focus();
    }
  },
  image(url, name) {
    var img = new Image();
    img.onload = function () {
      Popup.open(PATH + './image.alone.html?src=' + url, name || url, this.naturalWidth, this.naturalHeight);
    };
    img.src = url;
  },
  imageByNo(no, name) {
    var img = new Image();
    img.onload = function () {
      Popup.open(PATH + './image.alone.html?no=' + no, name || 'image' + no, this.naturalWidth, this.naturalHeight);
    };
    img.src = PATH + '/static/image/' + no;
  },
};

export const Random = {
  get(start, end) {
    return Math.random() * (end - start) + start;
  },
  getInteger(start, end) {
    // start부터 end사이의 random 정수 반환
    return Math.round(this.get(start, end));
  },
  getHex(start, end) {
    return this.getInteger(start, end).toString(16);
  },
  getBoolean() {
    return this.getInteger(1, 2) === 1;
  },
  getFont(inputFont) {
    const GOOGLE_FONTAPI = 'https://fonts.googleapis.com/css?family=';
    const GOOGLE_WEBFONTS = [
      'clipregular',
      'Bahiana',
      'Barrio',
      'Caveat Brush',
      'Indie Flower',
      'Lobster',
      'Gloria Hallelujah',
      'Pacifico',
      'Shadows Into Light',
      'Baloo',
      'Dancing Script',
      'VT323',
      'Acme',
      'Alex Brush',
      'Allura',
      'Amatic SC',
      'Architects Daughter',
      'Audiowide',
      'Bad Script',
      'Bangers',
      'BenchNine',
      'Boogaloo',
      'Bubblegum Sans',
      'Calligraffitti',
      'Ceviche One',
      'Chathura',
      'Chewy',
      'Cinzel',
      'Comfortaa',
      'Coming Soon',
      'Cookie',
      'Covered By Your Grace',
      'Damion',
      'Economica',
      'Freckle Face',
      'Gochi Hand',
      'Great Vibes',
      'Handlee',
      'Homemade Apple',
      'Josefin Slab',
      'Just Another Hand',
      'Kalam',
      'Kaushan Script',
      'Limelight',
      'Lobster Two',
      'Marck Script',
      'Monoton',
      'Neucha',
      'Nothing You Could Do',
      'Oleo Script',
      'Orbitron',
      'Pathway Gothic One',
      'Patrick Hand',
      'Permanent Marker',
      'Pinyon Script',
      'Playball',
      'Poiret One',
      'Rajdhani',
      'Rancho',
      'Reenie Beanie',
      'Righteous',
      'Rock Salt',
      'Sacramento',
      'Satisfy',
      'Shadows Into Light Two',
      'Source Code Pro',
      'Special Elite',
      'Tangerine',
      'Teko',
      'Ubuntu Mono',
      'Unica One',
      'Yellowtail',
      'Aclonica',
      'Aladin',
      'Allan',
      'Allerta Stencil',
      'Annie Use Your Telescope',
      'Arizonia',
      'Berkshire Swash',
      'Bilbo Swash Caps',
      'Black Ops One',
      'Bungee Inline',
      'Bungee Shade',
      'Cabin Sketch',
      'Chelsea Market',
      'Clicker Script',
      'Crafty Girls',
      'Creepster',
      'Diplomata SC',
      'Ewert',
      'Fascinate Inline',
      'Finger Paint',
      'Fontdiner Swanky',
      'Fredericka the Great',
      'Frijole',
      'Give You Glory',
      'Grand Hotel',
      'Hanuman',
      'Herr Von Muellerhoff',
      'Italianno',
      'Just Me Again Down Here',
      'Knewave',
      'Kranky',
      'Kristi',
      'La Belle Aurore',
      'Leckerli One',
      'Life Savers',
      'Love Ya Like A Sister',
      'Loved by the King',
      'Merienda',
      'Merienda One',
      'Modak',
      'Montez',
      'Mountains of Christmas',
      'Mouse Memoirs',
      'Mr Dafoe',
      'Mr De Haviland',
      'Norican',
      'Oregano',
      'Over the Rainbow',
      'Parisienne',
      'Petit Formal Script',
      'Pompiere',
      'Press Start 2P',
      'Qwigley',
      'Raleway Dots',
      'Rochester',
      'Rouge Script',
      'Schoolbell',
      'Seaweed Script',
      'Slackey',
      'Sue Ellen Francisco',
      'The Girl Next Door',
      'UnifrakturMaguntia',
      'Unkempt',
      'Waiting for the Sunrise',
      'Walter Turncoat',
      'Wire One',
      'Yesteryear',
      'Zeyada',
      'Aguafina Script',
      'Akronim',
      'Averia Sans Libre',
      'Bilbo',
      'Bungee Hairline',
      'Bungee Outline',
      'Cedarville Cursive',
      'Codystar',
      'Condiment',
      'Cormorant Upright',
      'Dawning of a New Day',
      'Delius Unicase',
      'Dorsa',
      'Dynalight',
      'Eagle Lake',
      'Engagement',
      'Englebert',
      'Euphoria Script',
      'Faster One',
      'Flamenco',
      'Glass Antiqua',
      'Griffy',
      'Henny Penny',
      'Irish Grover',
      'Italiana',
      'Jolly Lodger',
      'Joti One',
      'Julee',
      'Kenia',
      'Kite One',
      'Kumar One Outline',
      'League Script',
      'Lemonada',
      'Londrina Outline',
      'Lovers Quarrel',
      'Meddon',
      'MedievalSharp',
      'Medula One',
      'Meie Script',
      'Miniver',
      'Molle:400i',
      'Monofett',
      'Monsieur La Doulaise',
      'Montserrat Subrayada',
      'Mrs Saint Delafield',
      'Mystery Quest',
      'New Rocker',
      'Nosifer',
      'Nova Mono',
      'Piedra',
      'Quintessential',
      'Ribeye',
      'Ruthie',
      'Rye',
      'Sail',
      'Sancreek',
      'Sarina',
      'Snippet',
      'Sofia',
      'Stalemate',
      'Sunshiney',
      'Swanky and Moo Moo',
      'Titan One',
      'Trade Winds',
      'Tulpen One',
      'UnifrakturCook:700',
      'Vampiro One',
      'Vast Shadow',
      'Vibur',
      'Wallpoet',
      'Almendra Display',
      'Almendra SC',
      'Arbutus',
      'Astloch',
      'Aubrey',
      'Bigelow Rules',
      'Bonbon',
      'Butcherman',
      'Butterfly Kids',
      'Caesar Dressing',
      'Devonshire',
      'Diplomata',
      'Dr Sugiyama',
      'Eater',
      'Elsie Swash Caps',
      'Fascinate',
      'Felipa',
      'Flavors',
      'Gorditas',
      'Hanalei',
      'Hanalei Fill',
      'Jacques Francois Shadow',
      'Jim Nightshade',
      'Lakki Reddy',
      'Londrina Shadow',
      'Londrina Sketch',
      'Macondo Swash Caps',
      'Miltonian',
      'Miltonian Tattoo',
      'Miss Fajardose',
      'Mr Bedfort',
      'Mrs Sheppards',
      'Nova Script',
      'Original Surfer',
      'Princess Sofia',
      'Ravi Prakash',
      'Ribeye Marrow',
      'Risque',
      'Romanesco',
      'Ruge Boogie',
      'Sevillana',
      'Sirin Stencil',
      'Smokum',
      'Snowburst One',
      'Underdog',
    ];
    const selectedFont = inputFont || GOOGLE_WEBFONTS[this.getInteger(0, GOOGLE_WEBFONTS.length - 1)];

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTAPI + selectedFont;
    document.getElementsByTagName('head')[0].appendChild(link);
    return selectedFont;
  },
  getColor(alpha) {
    if (alpha) return 'rgba(' + this.getInteger(0, 255) + ',' + this.getInteger(0, 255) + ',' + this.getInteger(0, 255) + ',' + (alpha === 'r' ? this.get(0, 1) : alpha) + ')';
    else return '#' + this.getHex(0, 255).zf(2) + this.getHex(0, 255).zf(2) + this.getHex(0, 255).zf(2);
  },
};

export const LocalStorageItem = {
  set(itemName, itemValue) {
    if (typeof Storage !== 'undefined') localStorage.setItem(itemName, itemValue);
  },
  get(itemName, notfoundDefault) {
    return typeof Storage !== 'undefined' && (localStorage.getItem(itemName) || notfoundDefault);
  },
  getInteger(itemName, notfoundDefault) {
    return parseInt(this.get(itemName, notfoundDefault));
  },
  getBoolean(itemName, notfoundDefault) {
    if (notfoundDefault) {
      return this.get(itemName, notfoundDefault.toString()) === 'true';
    } else {
      return this.get(itemName) === 'true';
    }
  },
  split(itemName, notfoundDefault, delimiter) {
    return this.get(itemName, notfoundDefault).split(delimiter);
  },
  has(itemName) {
    // eslint-disable-next-line no-prototype-builtins
    return localStorage.hasOwnProperty(itemName);
  },
  remove(itemName) {
    localStorage.removeItem(itemName);
  },
  clear() {
    localStorage.clear();
  },
  findStartsWith(itemName) {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(itemName))
      .map((key) => {
        return { key: key, value: localStorage.getItem(key) };
      });
  },
};

export const SessionStorageItem = {
  set(itemName, itemValue) {
    if (typeof Storage !== 'undefined') sessionStorage.setItem(itemName, itemValue);
  },
  get(itemName, notfoundDefault) {
    return typeof Storage !== 'undefined' && (sessionStorage.getItem(itemName) || notfoundDefault);
  },
  getInteger(itemName, notfoundDefault) {
    return parseInt(this.get(itemName, notfoundDefault));
  },
  getBoolean(itemName, notfoundDefault) {
    if (notfoundDefault) {
      return this.get(itemName, notfoundDefault.toString()) === 'true';
    } else {
      return this.get(itemName) === 'true';
    }
  },
  has(itemName) {
    // eslint-disable-next-line no-prototype-builtins
    return sessionStorage.hasOwnProperty(itemName);
  },
  remove(itemName) {
    sessionStorage.removeItem(itemName);
  },
  clear() {
    sessionStorage.clear();
  },
  findStartsWith(itemName) {
    return Object.keys(sessionStorage)
      .filter((key) => key.startsWith(itemName))
      .map((key) => {
        return { key: key, value: sessionStorage.getItem(key) };
      });
  },
};

Date.prototype.format = function (f) {
  // http://stove99.tistory.com/46
  if (!this.valueOf()) return ' ';

  var weekName = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|E|HH|hh|mm|ss|a\/p)/gi, function ($1) {
    switch ($1) {
      case 'yyyy':
        return d.getFullYear();
      case 'yy':
        return (d.getFullYear() % 1000).zf(2);
      case 'MM':
        return (d.getMonth() + 1).zf(2);
      case 'dd':
        return d.getDate().zf(2);
      case 'E':
        return weekName[d.getDay()];
      case 'HH':
        return d.getHours().zf(2);
      case 'hh':
        return (d.getHours() % 12).zf(2);
      case 'mm':
        return d.getMinutes().zf(2);
      case 'ss':
        return d.getSeconds().zf(2);
      case 'a/p':
        return d.getHours() < 12 ? 'am' : 'pm';
      default:
        return $1;
    }
  });
};
String.prototype.string = function (len) {
  var s = '',
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};
String.prototype.zf = function (len) {
  return '0'.string(len - this.length) + this;
};

Number.prototype.zf = function (len) {
  return this.toString().zf(len);
};
Number.prototype.ifNotZero = function (suffix) {
  return this == 0 ? '' : this + (suffix ? suffix : '');
};
Number.prototype.withComma = function () {
  return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
Number.prototype.toDate = function (pattern) {
  return new Date(this).format(pattern);
};

export class StringUtils {
  static isBlank(string) {
    return string === null || string === '' || string.trim() === '';
  }
  static trim(string) {
    return this.isBlank(string) ? '' : string.trim();
  }
}

export class DateUtils {
  static format(pattern, date) {
    // console.log('DateUtils.format', pattern, date, typeof date);
    if (typeof date !== 'undefined') {
      if (typeof date === 'string') {
        date = new Date(date);
      } else if (typeof date === 'number') {
        if (date > 0) {
          date = new Date(date);
        } else {
          return '';
        }
      }
    } else {
      date = new Date();
    }
    return date.format(pattern);
  }
}

export class NumberUtils {
  static calculateAverage(...number) {
    let count = number.length;
    let sum = number.reduce((preiousvValue, currentValue) => preiousvValue + currentValue, 0);
    let average = sum / count;
    // console.log('NumberUtils.calculateAverage num', number);
    // console.log('NumberUtils.calculateAverage cnt', count);
    // console.log('NumberUtils.calculateAverage sum', sum);
    // console.log('NumberUtils.calculateAverage avg', average);
    return average;
  }
  static calculateStandardDeviation(...number) {
    let average = this.calculateAverage(...number);
    let deviation = number.reduce((pV, cV) => pV + Math.pow(cV - average, 2), 0);
    let sd = Math.sqrt(deviation / number.length);
    // console.log('NumberUtils.calculateStandardDeviation dev', deviation);
    // console.log('NumberUtils.calculateStandardDeviation  sd', sd);
    return {
      cnt: number.length,
      avg: average,
      sd: sd,
    };
  }
}

export const KB = 1024,
  MB = KB * KB,
  GB = MB * KB,
  TB = GB * KB;
export const File = {
  formatSize(length, unit, digits) {
    if (unit) {
      if (typeof digits === 'undefined') digits = 1;
      if (unit === 'MB') {
        return (length / MB).toFixed(digits) + ' MB';
      } else if (unit === 'GB') {
        return (length / GB).toFixed(digits) + ' GB';
      } else if (unit === 'TB') {
        return (length / TB).toFixed(digits) + ' TB';
      } else {
        return length + ' ' + unit;
      }
    } else {
      if (length < KB) return length + ' <small>B</small>';
      else if (length < MB) return (length / KB).toFixed(0) + ' <small>kB</small>';
      else if (length < GB) return (length / MB).toFixed(0) + ' <small>MB</small>';
      else if (length < TB) return (length / GB).toFixed(1) + ' <small>GB</small>';
      else return (length / TB).toFixed(2) + ' <small>TB</small>';
    }
  },
  validName(name) {
    // \ / : * ? " < > |
    return name.replace(/[\\]/gi, '＼').replace(/[/]/gi, '／').replace(/[:]/gi, '：').replace(/[*]/gi, '＊').replace(/[?]/gi, '？').replace(/["]/gi, '＂').replace(/[<]/gi, '＜').replace(/[>]/gi, '＞').replace(/[|]/gi, '｜');
  },
};

export const reqParam = location.search
  .split(/[?&]/)
  .slice(1)
  .map((paramPair) => paramPair.split(/=(.+)?/).slice(0, 2))
  .reduce((obj, pairArray) => {
    obj[pairArray[0]] = pairArray[1];
    return obj;
  }, {});

export const birthRegExp = /^(19[0-9][0-9]|20\d{2})年(0[0-9]|1[0-2])月(0[1-9]|[1-2][0-9]|3[0-1])日$/;
export const bodyRegExp = /^(7[0-9]|8[0-9]|9[0-9]|1\d{2})[A-J]? - (5[0-9]|6[0-9]) - (7[0-9]|8[0-9]|9[0-9]|1\d{2})$/;
export const heightRegExp = /^(1[4-7][0-9])$/;
export const debutRegExp = /^(199[0-9]|20[0-2][0-9])$/;

export const ThreadUtils = {
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
export const CSRF_HEADER = {
  'X-XSRF-TOKEN': (() => {
    let csrfHeaderValue = null;
    for (const cookie of document.cookie.split(';')) {
      if (cookie.substring(0, cookie.indexOf('=')).replace(/^\s+|\s+$/g, '') === CSRF_COOKIE_NAME) {
        csrfHeaderValue = cookie.substring(cookie.indexOf('=') + 1);
        break;
      }
    }
    return csrfHeaderValue;
  })(),
};
