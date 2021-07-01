import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
let websock = null
let messageCallback = null
let errorCallback = null
let wsUrl = ''
let tryTime = 0
const KP = {
  key: 'kijhytgvmt578943', // 秘钥
  iv: 'erasrehyt5rtyj75'  // 偏移量
}

// 加密
function encryptAes(data, key, iv) {
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
 
// 接收ws后端返回的数据
function websocketonmessage (e) { 
  // messageCallback(JSON.parse(e.data))
  messageCallback(e)
}

/**
 * 发起websocket连接
 * @param {Object} agentData 需要向后台传递的参数数据
 */
export function websocketSend (agentData) {
  // 添加状态判断，当为OPEN时，发送消息
  if (websock.readyState === websock.OPEN) { // websock.OPEN = 1 
    // 发给后端的数据需要字符串化
    websock.send(agentData)
  }
  if (websock.readyState === websock.CLOSED) { // websock.CLOSED = 3 
    console.log('websock.readyState=3')
    ElMessage.error('ws连接异常，请稍候重试')
    errorCallback()
  }
}
 
// 关闭ws连接
function websocketclose (e) {
  // e.code === 1000  表示正常关闭。 无论为何目的而创建, 该链接都已成功完成任务。
  // e.code !== 1000  表示非正常关闭。
  console.log(e)
  if (e && e.code !== 1000) {
    ElMessage.error('ws连接异常，请稍候重试 onclose')
    errorCallback()
    // // 如果需要设置异常重连则可替换为下面的代码，自行进行测试
    // if (tryTime < 10) {
    //   setTimeout(function() {
    //    websock = null
    //    tryTime++
    //    initWebSocket()
    //    console.log(`第${tryTime}次重连`)
    //  }, 3 * 1000)
    //} else {
    //  ElMessage.error('重连失败！请稍后重试')
    //}
  }
}
// 建立ws连接
function websocketOpen (e) {
  console.log('websocket连接成功')
}
 
// 初始化weosocket
function initWebSocket () { 
  if (typeof (WebSocket) === 'undefined') {
    ElMessage.error('您的浏览器不支持WebSocket，无法获取数据')
    return false
  }
  
  // ws请求完整地址
  const requstWsUrl = wsUrl
  websock = new WebSocket(requstWsUrl)

  websock.onmessage = function (e) {
    websocketonmessage(e)
  } 
  websock.onopen = function () {
    websocketOpen()
  }
  websock.onerror = function () {
    ElMessage.error('ws连接异常，请稍候重试 onerror')
    errorCallback()
  }
  websock.onclose = function (e) {
    websocketclose(e)
  } 
}
 
/**
 * 发起websocket请求函数
 * @param {string} url ws连接地址
 * @param {Object} agentData 传给后台的参数
 * @param {function} successCallback 接收到ws数据，对数据进行处理的回调函数
 * @param {function} errCallback ws连接错误的回调函数
 */
export function sendWebsocket ( query, successCallback, errCallback) {
  wsUrl = `wss://livetest.ofweek.com/api/web/ws/webSocket?param=${encodeURIComponent(encryptAes(JSON.stringify(query), KP.key, KP.iv))}&needDecode=1`
  // wsUrl = `ws://qincx.ofweek.com/api/web/ws/webSocket?param=${encodeURIComponent(encryptAes(JSON.stringify(data), KP.key, KP.iv))}&needDecode=1`
  console.log(wsUrl)
  initWebSocket()
  messageCallback = successCallback
  errorCallback = errCallback
  // websocketSend(agentData)
}

/**
 * 关闭websocket函数
 */
export function closeWebsocket () {
  if (websock) {
    websock.close() // 关闭websocket
    websock.onclose() // 关闭websocket
  }
}