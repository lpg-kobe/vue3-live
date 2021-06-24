import { getRoomPrivateKey, getMembers, startLive, stopLive, applyLive, guestStartLive, guestStopLive, inviteLive, handleApplyLive, handleInviteLive } from '../../../services/live'

export default {
  namespaced: true,
  state: {
    // 直播状态
    liveStart: false,
    // 直播成员
    liveMembers: [],
    // 上麦中的流
    liveStreamList: [],
    // 当前主讲人
    liveSpeaker: {
      userId: ''
    },
    // 当前主窗口视角 2 插播 1 ppt 0 本人画面
    liveMainView: 2
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
    // 获取房间密钥
    async getPrivateKey({ }, { payload, callback }) {
      const { status, data } = await getRoomPrivateKey(payload)
      status && callback?.(data)
    },

    // 获取连麦成员
    async getMembers({ commit }, { payload, callback }) {
      const { status, data: { data } } = await getMembers(payload)
      if (status) {
        callback?.(data)
        commit('setState', {
          key: 'liveMembers',
          value: data
        })
      }
      return { status, data }
    },

    // 房间开始直播
    async startLive({ }, { payload, callback }) {
      const { status, data: { data } } = await startLive(payload)
      status && callback?.(data)
    },

    // 嘉宾上麦
    async guestStartLive({ }, { payload, callback }) {
      const { status, data: { data } } = await guestStartLive(payload)
      status && callback?.(data)
    },

    // 房间结束直播
    async stopLive({ }, { payload, callback }) {
      const { status, data: { data } } = await stopLive(payload)
      status && callback?.(data)
    },

    // 嘉宾下麦
    async guestStopLive({ }, { payload, callback }) {
      const { status, data: { data } } = await guestStopLive(payload)
      status && callback?.(data)
    },

    // 嘉宾申请上麦
    async applyLive({ }, { payload, callback }) {
      const { status, data: { data } } = await applyLive(payload)
      status && callback?.(data)
    },

    // 处理申请上麦
    async handleApplyLive({ }, { payload, callback }) {
      const { status, data: { data } } = await handleApplyLive(payload)
      status && callback?.(data)
    },

    // 主播邀请上麦
    async inviteLive({ }, { payload, callback }) {
      const { status, data: { data } } = await inviteLive(payload)
      status && callback?.(data)
    },

    // 处理邀请上麦
    async handleInviteLive({ }, { payload, callback }) {
      const { status, data: { data } } = await handleInviteLive(payload)
      status && callback?.(data)
    },

  },
}