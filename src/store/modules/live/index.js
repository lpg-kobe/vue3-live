import { getRoomPrivateKey, getMembers } from '../../../services/live'

export default {
  namespaced: true,
  state: {
    members: []
  },
  getters: {},
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
    // 获取房间密钥
    async getPrivateKey ({ }, { payload, callback }) {
      const { status, data } = await getRoomPrivateKey(payload)
      status && callback?.(data)
    },

    // 获取连麦成员
    async getMembers ({ commit }, { payload, callback }) {
      const { status, data: { data } } = await getMembers(payload)
      if (status) {
        callback?.()
        commit('setState', {
          key: 'members',
          value: data
        })
      }
    }
  },
}