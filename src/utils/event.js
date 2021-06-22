/**
 * @desc event事件调度
 * @author pika
 */

// global event define
export const EVENTENUM = {
  live: {
    start: 'START_LIVE',
    stop: 'STOP_LIVE'
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
