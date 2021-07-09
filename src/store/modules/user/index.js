/**
 * @desc base modules of user
 */

import { ElMessage } from 'element-plus'
import qs from 'qs'
import { login, sendSms, smsLogin } from '../../../services/user'
import { getUserSession, saveUserSession } from '../../../utils/session'
import { replaceHistory } from '../../../utils/tool'

export default {
  namespaced: true,
  state: {
    userInfo: getUserSession(),
    user: {},
    mainFormId: '',
    closeNeedOut: false,
    cardNeedOut: false,
    loginShow: false,
    phoneRegisterShow: false,
    cardShow: false,
    isForbit: false,
    imAccount: '',
    isVisitorLogin: false,
    dialogShopVideo: false
  },
  getters: {
    user: state => state.user,
    mainFormId: state => state.mainFormId,
    closeNeedOut: state => state.closeNeedOut,
    cardNeedOut: state => state.cardNeedOut,
    loginShow: state => state.loginShow,
    phoneRegisterShow: state => state.phoneRegisterShow,
    cardShow: state => state.cardShow,
    isForbit: state => state.isForbit,
    imAccount: state => state.user.imAccount,
    isVisitorLogin: state => state.isVisitorLogin,
    dialogShopVideo: state => state.dialogShopVideo,
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
    async login ({ commit, dispatch }, { payload }) {
      const { status, data: { data } } = await login(payload)
      status && dispatch({
        type: 'judgeLogin',
        payload: {
          data
        }
      })
    },

    async sendSms ({ commit, dispatch }, { payload, callback }) {
      const { status, data } = await sendSms(payload)
      status && callback?.({ status, ...data })
    },

    async smsLogin ({ commit, dispatch }, { payload }) {
      const { status, data: { data } } = await smsLogin(payload)
      status && dispatch({
        type: 'judgeLogin',
        payload: {
          data
        }
      })
    },

    judgeLogin ({ }, { payload: { data } }) {
      if (data?.isAuthorOrGuest === 0) {
        ElMessage.error('您还不是主播，请点击右下方申请直播');
        return;
      }
      ElMessage.success('登录成功')
      const { redirect } = qs.parse(location.search, { ignoreQueryPrefix: true })
      saveUserSession(data)
      if (redirect) {
        location.replace(decodeURI(redirect))
      } else {
        replaceHistory('/')
      }
    }
  },
}