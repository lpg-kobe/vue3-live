/**
 * @desc api services of user
 */

import request from '../../utils/request';
import qs from 'qs';

// 用户登录
export function login(payload) {
  return request(
    `/web/login/memberlogin?${qs.stringify(payload)}`,
    { method: 'post' }
  );
}

// 用户退出登录
export function logout(payload) {
  return request(
    `/web/logout`,
    { method: 'post' }
  );
}

// 验证码登录
export function smsLogin(payload) {
  return request(
    `/web/login/quickRegOrLogin?${qs.stringify(payload)}`,
    { method: 'post' }
  );
}

// 发送验证码
export function sendSms(payload) {
  return request(
    `/web/login/sendSMSValicode?${qs.stringify(payload)}`,
    {
      method: 'post',
    }
  );
}
