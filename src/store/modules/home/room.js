/**
 * @desc base modules of room
 */
import { ElMessageBox } from 'element-plus'
import { getroom, entryroom, getcompleteinfo, sendRoomHeartbeat } from '../../../services/room'

export default {
  namespaced: true,
  state: {
    lang: 'zh',
    room: {},
  },
  getters: {
    lang: state => state.lang,
    room: state => state.room,
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
    async getroom ({ commit }, { payload, callback }) {
      const { status, data: { data } } = await getroom(payload)

      if (status) {
        document.title = data.name
        commit('setState', [
          {
            key: 'room',
            value: data
          }
        ])

        callback?.(data)
      }
      return { status, data }
    },

    async entryroom ({ commit }, { payload, callback }) {
      const { status, data } = await entryroom(payload)

      if (status) {
        // 保存用户信息
        commit('user/setState', [
          {
            key: 'user',
            value: {
              ...data.data,
              isForbit: data.data.isForbit === 1 ? true : false
            }
          }], { root: true })

        if (data.data.lang) {
          commit('setState', {
            key: 'lang',
            value: data.data.lang
          })
        }
        callback?.(data)
      } else {
        // 进房异常
        if (+data?.code === 22) {
          window.location.href = "https://live.ofweek.com/"
          return
        }
        window.requestAnimationFrame(() => {
          ElMessageBox.alert(data?.message || '网络拥堵，请重新进入直播间', '提示', {
            confirmButtonText: '确定',
            callback: () => {
              window.location.reload()
            }
          });
        })
      }
      return { status, data }
    },

    // 房间成员心跳
    async roomHeartbeat ({ }, { payload, callback }) {
      const { status, data: { data } } = await sendRoomHeartbeat(payload)
      if (status) {
        callback?.(data)
      }
      return { status, data }
    },

  }
}