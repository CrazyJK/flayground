const loadScript = (FILE_URL, async = true, type = 'text/javascript') => {
  return new Promise((resolve, reject) => {
    try {
      const scriptEle = document.createElement('script');
      scriptEle.type = type;
      scriptEle.async = async;
      scriptEle.src = FILE_URL;

      scriptEle.addEventListener('load', (ev) => {
        resolve({ url: FILE_URL, status: true });
      });

      scriptEle.addEventListener('error', (ev) => {
        reject({
          status: false,
          message: `Failed to load the script ${FILE_URL}`,
        });
      });

      document.body.appendChild(scriptEle);
    } catch (error) {
      reject(error);
    }
  });
};

async function callFunc() {
  console.log(new Date(), '[main] call iframe');

  // document.write(`<iframe id="inFrame" src="inFrame.html"></iframe>`);

  document.querySelector('#inFrame').addEventListener('load', () => {
    console.log(new Date(), '[main] load iframe');
  });
}

function iframeLoaded() {
  console.log(new Date(), '[main] iframeLoaded');

  Promise.all([
    loadScript('script.defer01.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer02.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer03.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer04.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer05.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer06.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer07.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer08.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer09.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer10.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer11.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer12.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
    loadScript('script.defer13.js').then((data) => console.log(new Date(), 'loadScript', data.url)),
  ]).then(() => {
    init01();
    init02();
    init03();
    init04();
    init05();
    init06();
    init07();
    init08();
    init09();
    init10();
    init11();
    init12();
    init13();
  });
}
