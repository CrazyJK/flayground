/**
 * 주어진 URL에서 JSONP 데이터를 가져옵니다.
 *
 * @param {string} url - JSONP 데이터를 가져올 URL입니다.
 * @param {string} callbackName - JSONP 요청에 사용될 콜백 함수의 이름입니다.
 * @returns {Promise<any>} JSONP 데이터로 해결되거나 오류로 거부되는 Promise를 반환합니다.
 */
function fetchJsonp(url, callbackName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callbackFunctionName = callbackName || `jsonp_callback_${Date.now()}`;

    window[callbackFunctionName] = (data) => {
      delete window[callbackFunctionName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.src = `${url}?callback=${callbackFunctionName}`;
    script.onerror = (error) => {
      delete window[callbackFunctionName];
      document.body.removeChild(script);
      reject(error);
    };

    document.body.appendChild(script);
  });
}

export default fetchJsonp;
