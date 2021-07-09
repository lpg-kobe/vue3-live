/**
 * @desc key code 事件调度中心
 * @author pika
 */
import Event, { eventEmitter } from './event'

const KEY_EVENT = {
  enter: 'Enter',
  esc: 'Escape',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  devtool: 'shiftKey&F12',
}

export default class KeyCode {

  constructor() {
    this.bindEvent()
    this.event = KEY_EVENT
  }

  on (eventName, handler, context) {
    eventEmitter.on(eventName, handler, context)
  }

  off (eventName, handler, context) {
    eventEmitter.off(eventName, handler, context)
  }

  onKeyCode (event) {
    Object.entries(this.event).forEach(([name, value]) => {
      const { key, code } = event
      const multiKeys = value.split('&')
      if (multiKeys.length > 1) {
        key === multiKeys[1] && event[multiKeys[0]] ? eventEmitter.emit(value, { keys: multiKeys }) : null
      } else {
        key === value && eventEmitter.emit(value, { key, code })
      }
    })
  }

  bindEvent () {
    document.removeEventListener('keyup', this.onKeyCode.bind(this), true)
    document.addEventListener('keyup', this.onKeyCode.bind(this), true)
  }
}
