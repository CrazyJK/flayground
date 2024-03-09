import './popup.panda-tv.scss';

const [id, pw] = ['jkcrazy', 'crazyjk588'];
const loginURL = `https://api.pandalive.co.kr/v1/member/login?id=${id}&pw=${pw}%21&idSave=Y`;
const listURL = `https://www.pandalive.co.kr/live#user`;

const loginFrame = document.querySelector('iframe#login');
const listFrame = document.querySelector('iframe#list');

loginFrame.src = loginURL;
loginFrame.onload = () => {
  loginFrame.parentElement.classList.add('loaded');

  location.href = listURL;
};
