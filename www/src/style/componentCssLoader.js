import componentCSS from 'raw-loader!./components.css';

export default function (wrapper) {
  if (!wrapper) {
    wrapper = document.querySelector('head');
  }
  const style = wrapper.appendChild(document.createElement('style'));
  style.innerHTML = componentCSS;
}
