import CryptoJS from 'crypto-js'
import { eventEmitter } from './event'
import { loopToInterval } from './tool'


export const SOCKET_CODE = {
  '000': 'NOT_SUPPORT',
  'XXX': 'NETWORK_ERROR',
  '200': 'CONNECTED',
  '201': 'RECEIVE_MESSAGE',
  '400': 'SOCKET_ERROR',
  '500': 'SOCKET_CLOSE',
}

export default class OfweekSocket {
  constructor(params = {}) {
    this.config = params
    this.code = SOCKET_CODE
    this.KP = {
      key: 'kijhytgvmt578943', // 秘钥
      iv: 'erasrehyt5rtyj75'  // 偏移量
    }
    this.socket = null
    this.timer = null
    this.statistics = {
      closeCount: 0
    } // socket统计信息
    this.socketUrl = `wss://livetest.ofweek.com/api/web/ws/webSocket?param=${encodeURIComponent(this.encryptAes(JSON.stringify(params), this.KP.key, this.KP.iv))}&needDecode=1`
    this.init()
  }

  init () {
    if (typeof (WebSocket) === 'undefined') {
      eventEmitter.emit(this.code['000'])
      return false
    }

    this.socket = new WebSocket(this.socketUrl)
    this.bindEvent()
  }

  bindEvent () {
    this.socket.onmessage = (e) => {
      console.log("socket收到消息~~", e.data)

      this.statistics.closeCount = 0
      eventEmitter.emit(this.code['201'], e)
    }

    this.socket.onopen = () => {
      console.log("socket连接成功~~")

      this.statistics.closeCount = 0
      eventEmitter.emit(this.code['200'])
      // interval to send msg to continue connect after open
      this.timer = loopToInterval(() => this.sendSocketMsg('ping'), this.timer, this.config.sendRate)
    }

    this.socket.onerror = (e) => {
      eventEmitter.emit(this.code['400'], e)
      console.error('socket 发生异常', e)
    }

    this.socket.onclose = (e) => {
      // e.code === 1000  表示正常关闭。 无论为何目的而创建, 该链接都已成功完成任务。
      // e.code !== 1000  表示非正常关闭。
      console.error('socket 连接关闭', e)

      eventEmitter.emit(this.code['500'], e)
      this.statistics.closeCount++
      // 断开超过5次认为当前用户掉线
      if (this.statistics.closeCount >= 5) {
        this.statistics.closeCount = 0
        eventEmitter.emit(this.code['XXX'], e)
      }
      if (e && e.reason.indexOf('2000') != -1) {
        setTimeout(() => {
          window.location.href = 'https://live.ofweek.com/'
        }, 2 * 1000)
      } else {
        this.reInit()
      }
    }

  }

  reInit () {
    this.close()
    this.init()
  }

  close () {
    this.socket?.close()
    this.socket = null
    clearTimeout(this.timer)
    this.timer = null
  }

  sendSocketMsg (data) {
    // 添加状态判断，当为OPEN时，发送消息
    if (this.socket.readyState === this.socket.OPEN) { // socket.OPEN = 1 
      // 发给后端的数据需要字符串化
      this.socket.send(data)
    }
    if (this.socket.readyState === this.socket.CLOSED) { // socket.CLOSED = 3 
      // emit error 
    }
    return data
  }

  on (name, handler, context) {
    eventEmitter.on(name, handler, context)
  }

  off (name, handler, context) {
    eventEmitter.off(name, handler, context)
  }

  // 加密
  encryptAes (data, key, iv) {
    let _key = CryptoJS.enc.Utf8.parse(key);
    let _iv = CryptoJS.enc.Utf8.parse(iv);
    let encrypted = CryptoJS.AES.encrypt(data, _key,
      {
        iv: _iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
    return encrypted.toString(); // 返回的是base64格式的密文
  }
}
