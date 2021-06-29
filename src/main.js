/**
 * @desc main entry
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus';
import App from './App.vue'
import store from './store'
import router from './router'
import 'normalize.css/normalize.css'
import 'element-plus/lib/theme-chalk/index.css';
import './assets/style/index.scss'
import { formatDate } from './utils/tool'

import { createI18n } from 'vue-i18n'
import zh from './assets/lang/zh'
import en from './assets/lang/en'
import ja from './assets/lang/ja'
import es from './assets/lang/es'
const _lang = 'zh'
const i18n = createI18n({
  locale: _lang,
  messages: {
    'zh': zh,
    'en': en,
    'ja': ja,
    'es': es
  }
});

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
  app.use(i18n)
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
