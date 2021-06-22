/**
 * @desc base modules of user
 */

import { ElMessage } from 'element-plus'
import { login, sendSms, smsLogin } from '../../../services/user'
import { getUserSession, saveUserSession } from '../../../utils/session'
import { replaceHistory } from '../../../utils/tool'

export default {
  namespaced: true,
  state: {
    // 登录用户
    userInfo: getUserSession(),
    // 房间用户
    user: {}
  },
  getters: {},
  mutations: {
    setState(state, params) {
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
    async login({ commit, dispatch }, { payload }) {
      const { status, data: { data } } = await login(payload)
      status && dispatch({
        type: 'judgeLogin',
        payload: {
          data
        }
      })
    },

    async sendSms({ commit, dispatch }, { payload, callback }) {
      const { status, data } = await sendSms(payload)
      status && callback?.({ status, ...data })
    },

    async smsLogin({ commit, dispatch }, { payload }) {
      const { status, data: { data } } = await smsLogin(payload)
      status && dispatch({
        type: 'judgeLogin',
        payload: {
          data
        }
      })
    },

    judgeLogin({ }, { payload: { data } }) {
      if (data?.isAuthorOrGuest === 0) {
        ElMessage.error(t('您还不是主播，请点击右下方申请直播'));
        return;
      }
      ElMessage.success('登录成功')
      saveUserSession(data)
      replaceHistory('/')
    }
  },
}