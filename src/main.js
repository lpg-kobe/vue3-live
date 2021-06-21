/**
 * @desc main entry
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import App from './App.vue'
import store from './store'
import router from './router'
import './assets/style/global.scss'
import 'element-plus/lib/theme-chalk/index.css';

function init () {
  initApp()
  initEvent()
}

// init app
function initApp () {
  const app = createApp(App)
  app.use(ElementPlus)
  app.use(store)
  app.use(router)
  app.mount('#app')
}

// init global event listener
function initEvent () {
  store.dispatch({
    type: "registerEvent",
    payload: {},
  });
}

init()
