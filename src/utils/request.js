/**
 * @desc common request of fetch
 * @author pika
 */

import { getUserSession } from './session';
import { getStore } from './tool';
import { eventEmitter } from './event';
import { IM_EVENT } from '../sdk/imLive';
import 'whatwg-fetch'
import { VITE_apiHost, MODE } from '../constants';
import { handleSuccess, handleError } from './reponseHandler';
const fetchController = new AbortController(); // 实验性功能

function parseJSON (response) {
  return response.json();
}

function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param  {object} [handler] The handler callback after "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request (
  url,
  options,
  handler
) {
  // staus of request 0waiting 1success 2timeout
  let fetchStatus = 0;

  // 配置默认headers
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    devType: 8,
    ...options?.headers,
  };

  if (options?.body && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // 配置默认设置
  const settings = {
    method: 'GET',
    mode: 'cors',
    signal: fetchController.signal,
    credentials: 'include',
    ...options,
    headers,
  };
  // 修复url中多余的斜杠
  const fixUrl = (MODE === 'prod' ? VITE_apiHost + url : url)
    .replace(/\/\//g, '/')
    .replace(/:\/([^/])/, '://$1');

  // 非GET方式不允许缓存
  if (settings.method.toUpperCase() !== 'GET') {
    settings['Cache-Control'] = 'no-cache';
  }

  // 超时设置
  setTimeout(() => {
    if (fetchStatus !== 1) {
      fetchStatus = 2;
    }
  }, 5 * 1000);

  return fetch(fixUrl, settings)
    .then(checkStatus)
    .then(parseJSON)
    .then(
      (data) => {
        if (fetchStatus === 2) {
          handleError(handler, { message: '网络不给力~~' });
          return {
            status: false,
            data: new Response('timeout', {
              status: 504,
              statusText: 'timeout',
            }),
          };
        } else {
          fetchStatus = 1;
        }

        if (data.code !== 0) {
          // 登录过期
          if (data.code === -10 || data.code === -20 || data.code === -22) {
            fetchController.abort();
            handleError(handler, data);
            eventEmitter.emit(IM_EVENT.loginExp, {});
            return { status: false, data };
          }
          handleError(handler, data);
          return { status: false, data };
        }

        handler?.onSuccess && handleSuccess(handler, data);

        return { status: true, data };
      },
      (err) => {
        handleError(handler, { message: '网络不给力' });
        return {
          err,
          status: false,
          data: {},
        };
      }
    );
}