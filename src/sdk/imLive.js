/**
 * @desc sdk for im base on tim-js-sdk
 */

import Event from '../utils/event'
import { VITE_sdkAppId } from "../constants";
import TIM from 'tim-js-sdk'

export const IM_EVENT = {
  sdkReady: TIM.EVENT.SDK_READY,// tim-sdk加载成功
  msgReceive: TIM.EVENT.MESSAGE_RECEIVED,// tim收到消息
  error: TIM.EVENT.ERROR,// sdk-error
  loginExp: 'login_expire', // 登录过期
  kick: TIM.EVENT.KICKED_OUT // 被踢下线
};

export default class ImLive {
  constructor(config) {
    const { userId, userSig } = config
    this.event = IM_EVENT
    this.emmitter = new Event();
    this.tim = this.initIm();
    this.TIM = TIM;
    this.loginIm({
      userId,
      userSig
    })
    this.unbindEvent();
    this.bindEvent();
  }

  // 初始化 sdk 实例
  initIm () {
    const tim = TIM.create({
      SDKAppID: VITE_sdkAppId,
    });
    tim.setLogLevel(2); // 告警级别，SDK 只输出告警和错误级别的日志
    return tim;
  }

  /**
   * 登录IM
   * @param {Object} params
   * @param {String} userID 用户ID
   * @param {String} userSig 签名
   */
  loginIm (params) {
    if (!this.tim) {
      return;
    }
    const promise = this.tim.login({
      userID: params.userId,
      userSig: params.userSig
    });
    promise.then((imResponse) => { // { data: { repeatLogin; errorInfo } }
      console.log('loginIm', imResponse?.data); // IM登录成功
    }).catch((imError) => {
      console.warn('login Im error:', imError); // 登录失败的相关信息
    });
  }

  // 登出IM
  logoutIm () {
    let promise = this.tim.logout();
    promise.then(() => {
      console.log('logout success'); // IM登出成功
    }).catch(function (imError) {
      console.warn('logout error:', imError);
    });
  }

  // 初始化im-sdk监听
  bindEvent () {
    this.tim.on(this.event.error, this.onError, this);
  }

  unbindEvent () {
    this.tim.off(this.event.error, this.onError);
  }

  // tim sdk error
  onError (event) { // data: { code: any; message: any }
    this.emmitter.emit(this.event.error, {
      errcode: event.data?.code,
      errmsg: event.data?.message,
    });
  }

  on (eventName, handler) {
    this.tim.on(eventName, handler, this)
  }

  off (eventName, handler) {
    this.tim.off(eventName, handler, this)
  }

}