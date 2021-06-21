/**
 * @desc base router config
 */
import { createRouter, createWebHistory } from 'vue-router'
import { getUserSession } from './utils/session'
import Home from './views/home/index.vue'
import Login from './views/login/index.vue'
import store from './store'

const historyMode = createWebHistory('')
const router = createRouter({
  history: historyMode,
  routes: [{
    path: '/:roomId',
    name: 'home',
    meta: {
      initIm: true,
      initTrtc: true,
    },
    component: Home
  }, {
    path: '/login',
    name: 'login',
    meta: {
      initIm: false,
      initTrtc: false,
    },
    component: Login
  }]
})

// router permission
function routerPermit ({ name }, from, next) {
  if (name !== 'login' && !getUserSession()) {
    next({
      name: 'login'
    })
  } else {
    next()
  }
}

// init global state|data for router config, don`t do anything here for single page
function initRouterMeta (to) {
  const { meta: { initIm, initTrtc } } = to
  // save router data
  store.commit('setState', {
    key: 'router',
    value: to
  })
  initIm && store.dispatch({
    type: 'initIm',
    payload: {}
  })
  initTrtc && store.dispatch({
    type: 'initTrtc',
    payload: {}
  })
}

router.beforeEach((...args) => {
  routerPermit(...args)
  initRouterMeta(...args)
})

export default router
