/**
 * @desc event事件调度
 * @author pika
 */

// global event define
export const EVENTENUM = {
  anchor: {
    invite: 'ANCHOR_INVITE_LIVE', // 邀请上麦
    start: 'ANCHOR_START_LIVE', // 开始直播
    stop: 'ANCHOR_STOP_LIVE', // 结束直播
    closeMic: 'ANCHOR_CLOSE_MIC', // 关闭麦克风
    openMic: 'ANCHOR_OPEN_MIC', // 开启麦克风
    openCamera: 'ANCHOR_OPEN_CAMERA', // 开启摄像头
    closeCamera: 'ANCHOR_CLOSE_CAMERA', // 关闭摄像头
    setSpeaker: 'ANCHOR_SET_SPEAKER' // 设置主讲人
  },
  guest: {
    apply: 'GUEST_APPLY_LIVE', // 申请上麦
    start: 'GUEST_START_LIVE', // 上麦
    stop: 'GUEST_STOP_LIVE', // 下麦
    closeMic: 'GUEST_CLOSE_MIC', // 关闭麦克风
    openMic: 'GUEST_OPEN_MIC', // 开启麦克风
    openCamera: 'GUEST_OPEN_CAMERA', // 开启摄像头
    closeCamera: 'GUEST_CLOSE_CAMERA', // 关闭摄像头
  },
  live: {
    joinFail: 'FAIL_TO_JOIN_TRTC',
    setMedia: 'OPEN_MEDIA_SETTING', // 媒体设置
    toggleMedia: 'TOGGLE_MEDIA', // 切换麦克风|摄像头开关
    playStream: 'PLAY_STREAM', // 尝试播放直播流
  },
  login: {
    expire: 'LOGIN_EXPIRE',
  },
  chat: {
    scroll: 'SCROLL_TO_POSITION',
  },
  menu: {
    click: 'CLICK_MENU_EVENT'
  },
  editor: {
    setValue: 'SET_EDITOR_VALUE'
  }
}

export default class Event {
  constructor() {
    this.event = EVENTENUM;
    this.eventBus = this.eventBus || Object.create(null);
  }

  on(eventName, handler, context) {
    if (typeof handler !== 'function') {
      console.error('Event handler must be a function');
      return;
    }
    this.eventBus[eventName] = this.eventBus[eventName] || []
    this.eventBus[eventName].push({
      handler,
      context,
    });
  }

  emit(eventName, data) {
    let eventCollection = this.eventBus[eventName];
    const args = [];
    if (eventCollection) {
      eventCollection = [].slice.call(eventCollection);
      args[0] = {
        eventCode: eventName,
        data,
      };
      for (let i = 0, len = eventCollection.length; i < len; i++) {
        eventCollection[i].handler.apply(eventCollection[i].context, args);
      }
    }
  }

  off(eventName, handler) {
    const eventCollection = this.eventBus[eventName];

    // clear all eventBus when not give the eventName
    if (!eventName) {
      this.eventBus = Object.create(null);
      return;
    }

    if (!eventCollection || !eventCollection.length) {
      return;
    }

    if (!handler) {
      delete this.eventBus[eventName];
    }

    for (let i = 0, len = eventCollection.length; i < len; i++) {
      const fnName = (fun) => fun.name || fun.toString().match(/function\s*([^(]*)\(/)[1]
      // remove event handler if function name of it is the same as eventCollection
      if (fnName(eventCollection[i].handler) === fnName(handler)) {
        eventCollection.splice(i, 1);
        break;
      }
    }
  }
}

export const eventEmitter = new Event()
