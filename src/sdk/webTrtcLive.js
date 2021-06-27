/**
 * @desc main sdk for live base on trtc-js-sdk
 * @author pika
 */

import TRTC from 'trtc-js-sdk'
import { ElMessageBox } from 'element-plus'

export const TRTC_EVENT = {

};

export default class WebTrtcLive {
  constructor(config) {

    let support = true;
    (async () => {
      support = await this.isSupport()
    })()
    if (!support) {
      // 确保提示弹窗层级最深
      window.requestAnimationFrame(() => {
        ElMessageBox.alert('当前浏览器不支持开启直播，建议更换chrome浏览器', '温馨提示', {
          confirmButtonText: '知道了'
        })
      })
    }

    this.event = TRTC_EVENT
    this.trtc = TRTC
    this.createClient({
      ...config,
      mode: 'live'
    })
    this.initSetting()
  }

  // 初始化trtc设置
  initSetting() {

  }

  /** get version */
  getVersion() {
    return TRTC.VERSION
  }

  // 获取摄像头列表
  getCameras() {
    return new Promise(resolve => {
      this.trtc.getCameras().then((data) => resolve(data), () => resolve([]))
    });
  }

  // 获取当前使用的摄像头
  getCurCamera() {
    if (!this.stream) {
      return {}
    }
    const videoTrack = this.stream.getVideoTrack?.()
    return videoTrack?.getSettings?.() || {}
  }

  // 获取麦克风设备列表
  getMics() {
    return new Promise(resolve => {
      this.trtc.getMicrophones().then((data) => resolve(data), () => resolve([]))
    });
  }

  // 获取当前使用的麦克风
  getCurMic() {
    if (!this.stream) {
      return {}
    }
    const audioTrack = this.stream.getAudioTrack?.()
    return audioTrack?.getSettings?.() || {}
  }

  // browser support check
  isSupport() {
    return new Promise((resolve) => {
      TRTC.checkSystemRequirements().then(({ result }) => resolve(result), () => resolve(false))
    })
  }

  // share screen support check
  isSupportShareScreen() {
    return TRTC.isScreenShareSupported()
  }

  switchCamera(id) {
    return new Promise((resolve) => {
      this.trtc.switchDevice('video', id).then(() => resolve(true), () => resolve(false))
    })
  }

  switchMic(id) {
    return new Promise((resolve) => {
      this.trtc.switchDevice('audio', id).then(() => resolve(true), () => resolve(false))
    })
  }

  /** create trtc client */
  createClient(config) {
    this.client = TRTC.createClient(config)
    return this.client
  }

  /** create local preview stream */
  createStream(config) {
    const { settings, ...streamConfig } = config
    return new Promise((resolve) => {
      if (!streamConfig?.userId) {
        resolve({
          stream: null,
          error: {
            name: 'noUserId'
          }
        })
      }
      this.stream = this.trtc.createStream(streamConfig)
      this.stream.setVideoProfile(settings)
      this.stream.initialize().then(() => resolve({
        stream: this.stream
      }), (error) => resolve({
        stream: null,
        error
      }))
    })
  }

  /** 关闭所有音视频采集 */
  clearMedia() {

  }

  onClient(eventName, handler, context) {
    this.client?.on(eventName, handler, context);
  }

  offClient(eventName, handler, context) {
    this.client?.off(eventName, handler, context);
  }

  onStream(eventName, handler, context) {
    this.client?.on(eventName, handler, context);
  }

  offStream(eventName, handler, context) {
    this.client?.off(eventName, handler, context);
  }
}
