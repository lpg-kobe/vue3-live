/**
 * @desc global state define during app, page state use in folder modules
 * @tips this store use for global, don`t do any here for page
 * @author pika
 */

import { ElMessageBox } from 'element-plus';
import { removeUserSession } from '../utils/session'
import { replaceHistory } from '../utils/tool'
import { eventEmitter } from '../utils/event'
import ImSdk, { IM_EVENT } from '../sdk/imLive'
import WebTrtcLive, { TRTC_EVENT } from '../sdk/webTrtcLive'
import { VITE_sdkAppId } from '../constants';
import TRTC from 'trtc-js-sdk'

export default {

  state: {
    imClient: null,
    trtcClient: null,
    // current router data
    router: {}
  },

  getters: {
  },

  mutations: {
    setState (state, params) {
      if (Array.isArray(params)) {
        params.forEach(({ key, value }) => {
          state[key] = value
        })
      } else {
        const { key, value } = params
        state[key] = value
      }
      return state
    }
  },

  actions: {
    // register global event
    registerEvent ({ commit }, { payload }) {
      Object.values(IM_EVENT).forEach(ele => {
        Object.values(ele).forEach(event => {
          eventEmitter.on(event, () => {
            const actionMap = {
              [IM_EVENT.loginExp]: () => {
                removeUserSession()
                replaceHistory('logout')
              },
              [IM_EVENT.kick]: () => {
                if (window.location?.hash === '#/login' || window.location?.pathname === "/login") {
                  return
                }
                removeUserSession()
                ElMessageBox.alert('您的账号在其它设备登录，您已下线', '提示', {
                  confirmButtonText: '确定',
                  callback: action => {
                    replaceHistory('login')
                  }
                });
              }
            }
            actionMap[event]?.()
          })
        })

      })
    },

    // init im
    initIm ({ commit, state }, { payload, callback }) {
      const { imAccount, userSig } = state.user?.userInfo || {};
      const imParam = { userId: imAccount, userSig };
      const imClient = new ImSdk(imParam);
      commit('setState', {
        key: 'imClient',
        value: imClient
      })
      callback?.(imClient)
    },

    // init trtc
    initTrtc ({ commit, state, dispatch }, { payload, callback }) {
      const { imAccount, userSig } = state.user?.userInfo || {};
      const imParam = { userId: imAccount, userSig, sdkAppId: VITE_sdkAppId };
      const trtcClient = new WebTrtcLive(imParam);
      commit('setState', {
        key: 'trtcClient',
        value: trtcClient
      })
      callback?.(trtcClient)
    }
  },
}