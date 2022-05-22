import menuItems from '../main.json';

/* ref)
   https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_custom_elements
   https://developer.mozilla.org/ko/docs/Web/Web_Components/Using_shadow_DOM
 */

class FlayMenu extends HTMLElement {
  constructor(align) {
    super();

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' });

    // get align
    let dataAlign = this.getAttribute('data-align') || align;
    let alignLeft = dataAlign !== 'right';

    // style
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', 'css/font-awesome.css');
    shadow.appendChild(linkElem);

    const style = document.createElement('style');
    style.textContent = `
    a {
      color: #607d8b;
      text-decoration: none;
    }
    .nav-wrap {
      background-color: #151515;
      color: #607d8b;
      position: absolute;
      top: 0;
      ${alignLeft ? 'left' : 'right'}: -200px;
      bottom: 0;
      width: 200px;
      overflow: hidden;
      z-index: 6974892;
      transition: ${alignLeft ? 'left' : 'right'} 0.4s;
    }
    .nav-wrap.fixed,
    .nav-wrap:hover {
      ${alignLeft ? 'left' : 'right'}: 0;
    }
    .nav-wrap > span {
      cursor: pointer;
      margin: 0;
      padding: 0.75rem;
    }
    .nav-wrap > span#fixedPin {
      position: absolute;
      top: 0;
      ${alignLeft ? 'right' : 'left'}: 0;
      transform: rotate(${alignLeft ? '' : '-'}45deg);
      transition: transform 0.3s;
    }
    .nav-wrap.fixed > span#fixedPin {
      color: crimson;
      transform: rotate(0deg);
    }
    .nav-wrap > span#openTrigger {
      position: fixed;
      top: 0;
      ${alignLeft ? 'left' : 'right'}: 0;
      opacity: 0;
      font-size: 1.25rem;
    }
    .nav-wrap > span#openTrigger:hover {
      opacity: 1;
    }
    .nav-wrap h1 {
      margin: 2rem 0 1rem;
      text-align: center;
    }
    .nav-wrap ul.nav {
      display: flex;
      flex-direction: column;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-wrap ul.nav li {
      display: flex;
      align-items: center;
      flex: 0 0 2rem;
    }
    .nav-wrap ul.nav li i {
      flex: 0 0 2rem;
      text-align: center;
    }
    .nav-wrap ul.nav li div {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex: 1 1 auto;
    }

    .nav-wrap ul.nav li div a:nth-child(2) {
      width: 2rem;
      text-align: center;
      opacity: 0;
    }
    .nav-wrap ul.nav li:hover a {
      color: orange;
    }
    .nav-wrap ul.nav li:hover div a.href::after {
      content: " ▣";
    }
    .nav-wrap ul.nav li:hover div a:nth-child(2) {
      opacity: 1;
    }
    `;
    shadow.appendChild(style);

    // main wrapper
    const navWrap = document.createElement('nav');
    navWrap.setAttribute('class', 'nav-wrap');
    shadow.appendChild(navWrap);

    // fixed pin
    const fixedPin = document.createElement('span');
    fixedPin.setAttribute('id', 'fixedPin');
    fixedPin.setAttribute('class', 'fa fa-thumb-tack');
    fixedPin.addEventListener('click', (e) => {
      navWrap.classList.toggle('fixed');
    });
    navWrap.appendChild(fixedPin);

    // open trigger
    const openTrigger = document.createElement('span');
    openTrigger.setAttribute('id', 'openTrigger');
    openTrigger.setAttribute('class', 'fa fa-angle-double-' + (alignLeft ? 'right' : 'left'));
    navWrap.appendChild(openTrigger);

    // title
    const title = document.createElement('h1');
    const titleAnker = document.createElement('a');
    titleAnker.setAttribute('href', '/dist/main.html');
    titleAnker.textContent = 'Flayground';
    title.appendChild(titleAnker);
    navWrap.appendChild(title);

    const mainMenuNav = document.createElement('ul');
    mainMenuNav.setAttribute('class', 'nav');
    navWrap.appendChild(mainMenuNav);

    menuItems.forEach((menu) => {
      const li = document.createElement('li');
      mainMenuNav.appendChild(li);

      // icon
      const menuIcon = document.createElement('i');
      menuIcon.setAttribute('class', menu.icon);
      li.appendChild(menuIcon);

      // menu
      const menuDiv = document.createElement('div');
      li.appendChild(menuDiv);

      // decide url
      let menuURL = menu.uri;
      if (menu.mode === 'include') {
        menuURL = 'main.popup.html?target=' + menu.uri;
      }
      // decide popup size
      if (menu.popup === 'full') {
        menu.popup = {
          w: window.innerWidth,
          h: window.innerHeight,
        };
      }

      // current window
      const anker = document.createElement('a');
      anker.setAttribute('class', menu.mode);
      anker.setAttribute('href', menuURL);
      anker.textContent = menu.name;
      menuDiv.appendChild(anker);

      // new window
      const popup = document.createElement('a');
      popup.setAttribute('href', `javascript:window.open('${menuURL}', '${menu.name}', 'width=${menu.popup.w},height=${menu.popup.h}')`);
      const popupIcon = document.createElement('i');
      popupIcon.setAttribute('class', 'fa fa-external-link hover');
      popup.appendChild(popupIcon);
      menuDiv.appendChild(popup);
    });
  }
}

// Define the new element
customElements.define('flay-menu', FlayMenu);

// const flayMenu = document.createElement('flay-menu');
// flayMenu.setAttribute('data-align', 'right');

document.body.prepend(new FlayMenu('left'));
