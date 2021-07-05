import {
  getRoomPrivateKey,
  getMembers,
  startLive,
  stopLive,
  applyLive,
  setSpeaker,
  toggleMedia,
  guestStartLive,
  guestStopLive,
  inviteLive,
  handleApplyLive, handleInviteLive
} from '../../../services/live'

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
    liveMainView: 2,
    // trtc join 状态 0 fail 0.5 joining 1 success
    liveJoinStatus: 0.5,
    // 直播上下麦切换loading
    liveToggleLoading: true
  },
  getters: {},
  mutations: {
    // 成员排序规则 (在线主播 > 在线嘉宾 > 离线主播 > 离线嘉宾)
    sortMembers(state, members) {
      state['liveMembers'] = [
        ...members.filter(({ online }) => online).sort((prev, next) => prev.role - next.role),
        ...members.filter(({ online }) => !online).sort((prev, next) => prev.role - next.role),
      ]
    },

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
        commit('sortMembers', data)
      }
      return { status, data }
    },

    // 房间开始直播
    async startLive({ }, { payload, callback }) {
      const { status, data: { data } } = await startLive(payload)
      status && callback?.(data)
      return { status }
    },

    // 嘉宾上麦
    async guestStartLive({ }, { payload, callback }) {
      const { status, data: { data } } = await guestStartLive(payload)
      status && callback?.(data)
      return { status }
    },

    // 房间结束直播
    async stopLive({ }, { payload, callback }) {
      const { status, data: { data } } = await stopLive(payload)
      status && callback?.(data)
      return { status }
    },

    // 房间设置主讲人
    async setMainSpeaker({ }, { payload, callback }) {
      const { status, data: { data } } = await setSpeaker(payload)
      status && callback?.(data)
      return { status, data }
    },

    // 直播中媒体设备开关
    async toggleMedia({ }, { payload, callback }) {
      const { status, data: { data } } = await toggleMedia(payload)
      status && callback?.(data)
      return { status, data }
    },

    // 嘉宾下麦
    async guestStopLive({ }, { payload, callback }) {
      const { status, data: { data } } = await guestStopLive(payload)
      status && callback?.(data)
      return { status }
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