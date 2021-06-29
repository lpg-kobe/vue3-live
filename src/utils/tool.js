
/**
 * @desc common tool
 * @author pika
 */

import { VITE_publicPath } from '../constants'

// flag of requestAnimationFrame
let rafFlag = {};

export function getStore(name) {
  try {
    // @ts-ignore
    return JSON.parse(localStorage.getItem(name));
  } catch (error) {
    console.warn('can not parse user object witch you want to get...');
    // @ts-ignore
    return {};
  }
}

export function setStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('can not stringify user object witch you want to save...');
    localStorage.setItem(key, JSON.stringify({}));
  }
}

export function removeStore(key) {
  return localStorage.removeItem(key);
}

export function scrollElement(dom, position) {
  if (!dom.nodeType) {
    throw new Error(`target of ${dom} is not an HTMLElement`);
  }
  if (isNaN(position)) {
    const scrollReact = {
      bottom: () => {
        dom.scrollTop = dom.scrollHeight
      },
      top: () => {
        dom.scrollTop = 0
      },
    };
    scrollReact[position]?.();
  } else {
    dom.scrollTop = position;
  }
}

// 跟随屏幕帧率节流
export function tottle(fn, key) {
  key = key || 'default';
  if (!rafFlag[key]) {
    window.requestAnimationFrame(() => {
      fn();
      rafFlag[key] = false;
    });
  }
  rafFlag[key] = true;
}

// debounce防抖
export function debounce(
  fn,
  wait,
  immediate,
  ...args
) {
  wait = wait || 250;
  let timer = null;
  return function () {
    if (immediate) {
      fn.apply(this, [...args]);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, [...args]);
    }, wait);
  };
}

/**
 * @desc 跟随帧率刷新获取dom最新的位置
 * @param {HTMLElement} dom 监听的dom节点
 * @param {Function} callback 回调函数
 */
export function nextTick(dom, callback) {
  const realDom =
    typeof dom === 'string' ? document.querySelector(dom) : dom;
  if (!realDom.nodeType) {
    throw new Error(`target of ${realDom} is not an HTMLElement`);
  }

  const rect = realDom.getBoundingClientRect();
  // 触发首次对比
  let prevTop = rect.top - 1;
  let prevLeft = rect.left - 1;

  function getPosition() {
    const nextRect = realDom.getBoundingClientRect();
    if (prevTop !== nextRect.top || prevLeft !== nextRect.left) {
      prevTop = nextRect.top;
      prevLeft = nextRect.left;
      window.requestAnimationFrame(getPosition);
      return 'not real position';
    } else {
      const curRect = {
        offsetTop: realDom.offsetTop,
        offsetLeft: realDom.offsetLeft,
        scrollHeight: realDom.scrollHeight,
        rect: realDom.getBoundingClientRect(),
      };
      callback?.(curRect);
      return curRect;
    }
  }
  getPosition();
}

/**
 * @desc 屏幕帧率检测
 */
export function checkFps(cb) {
  let initTime = performance.now();
  let prevTime = performance.now();
  let frame = 0;
  let fps = 60;
  return function loop() {
    const now = performance.now();
    const fs = now - prevTime;
    fps = Math.round(1000 / fs);
    prevTime = now;
    frame++;
    if (now >= 1000 + initTime) {
      fps = Math.round((frame * 1000) / (now - initTime));
      frame = 0;
      initTime = now;
    }
    cb?.(fps);
    window.requestAnimationFrame(loop);
  };
}

/**
 * @desc 过滤字符文本换行符
 * @param {String} text 文本内容
 */
export function filterBreakWord(text) {
  return text.replace(/\n/g, '<br/>');
}

/**
 * @desc 路由自定义拼接
 * @param {String} path hashRouter-path or browserRouter-path
 */
export function judgeRouterUrl(path) {
  path = path.replace(/^\//, '');
  // hashRouter
  if (location.hash) {
    return `${location.origin}${location.pathname}#/${path}`;
  } else {
    // browserRouter
    return `${location.origin}${location.pathname}${path}`;
  }
}

/**
 * @desc setTimeout 递归模拟 setInterval,可轮询异步status
 * @param {Function} fn callback
 * @param {timer} setTimeout timer result
 * @param {delay} Number 间隔时间
 */
export function loopToInterval(
  fn,
  timer,
  delay
) {
  async function loop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const isContinue = await fn();
    isContinue && (timer = setTimeout(loop, delay));
  }
  loop();
  return timer;
}

/**
 * @desc 倒计时
 * @param {Number} curTime 当前时间，默认本地
 * @param {Number} endTime 结束时间
 * @param {Number||null} timer setTimeout timer
 * @param {Function} fn callback after countdown
 */
export function countdown(
  endTime,
  timer,
  delay,
  fn,
  curTime
) {
  loopToInterval(
    () => {
      curTime && (curTime += delay);
      const distance = endTime - (curTime || new Date().getTime());
      const disDay = Math.floor(distance / 24 / 60 / 60 / 1000);
      const disHour = Math.floor(distance / 60 / 60 / 1000) % 24;
      const disMin = Math.floor(distance / 60 / 1000) % 60;
      const disSec = Math.floor(distance / 1000) % 60;
      const disMs = distance % 1000;
      if (distance > 0) {
        fn({
          day: disDay < 10 ? `0${disDay}` : disDay,
          hour: disHour < 10 ? `0${disHour}` : disHour,
          minutes: disMin < 10 ? `0${disMin}` : disMin,
          second: disSec < 10 ? `0${disSec}` : disSec,
          milSecond: disMs,
        });
        return true;
      } else {
        fn(0);
        return false;
      }
    },
    timer,
    delay
  );
}

/**
 * @desc 全屏元素
 */
export function fullScreenEle(ele) {
  ele = ele || document.documentElement;
  const fullFn =
    ele.requestFullscreen ||
    ele.mozRequestFullScreen ||
    ele.webkitRequestFullscreen ||
    ele.msRequestFullscreen;
  fullFn.call(ele);
}

/**
 * @desc 图片加载处理
 * @param {src} Array | String
 */
export function loadImage(src, onComplete) {
  if (Array.isArray(src)) {
    let loadCount = 0;
    let loadArrs = [];
    let loadLen = src.length;
    for (let i = 0; i < loadLen; i++) {
      loadArrs[i] = new Image();
      loadArrs[i].src = src[i];
      loadArrs[i].onload = () => {
        loadCount++;
        loadCount === loadLen && onComplete?.(true);
      };
      loadArrs[i].onerror = () => {
        loadCount++;
        loadCount === loadLen && onComplete?.(true);
      };
    }
  } else {
    if (!src) {
      onComplete?.(false);
      return;
    }

    const imgInstance = new Image();
    imgInstance.src = src;
    imgInstance.onload = () => {
      onComplete?.(true);
    };
    imgInstance.onerror = () => {
      onComplete?.(false);
    };
  }
}

/**
 * @desc 退出全屏
 */
export function exitFullScreen() {
  const cancelFn =
    document.exitFullScreen ||
    document.mozCancelFullScreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;
  cancelFn.call(document);
}

/**
 * @desc 索引插入元素到输入框，后期考虑更换成rich editor
 * @return {String} value
 */
export function formatInput(inputEle, value) {
  const initValue = inputEle.value;
  const focusStart = ~~inputEle.selectionStart;
  const focusEnd = ~~inputEle.selectionEnd;
  return `${initValue.slice(0, focusStart)}${value}${initValue.slice(
    focusEnd,
    initValue.length
  )}`;
}

/**
 * @desc replace router by mode
 * @param {String} url
 */
export function replaceHistory(path) {
  path = path.replace(/^\//, '');
  if (location.hash) {
    window.location.hash = `#/${path}`
  } else {
    window.location.replace(`${VITE_publicPath}${path}`)
  }
}