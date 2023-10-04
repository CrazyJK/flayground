import CommonCSS from 'raw-loader!./components.css';

export default function (wrapper) {
  console.log(typeof wrapper, wrapper);
  if (!wrapper) {
    wrapper = document.querySelector('head');
  }
  const style = wrapper.appendChild(document.createElement('style'));
  style.innerHTML = CommonCSS;
}
