/**
 * @desc base modules of room
 */
import { ElMessageBox } from 'element-plus'
import { getroom, entryroom, getcompleteinfo, sendRoomHeartbeat } from '../../../services/room'

export default {
  namespaced: true,
  state: {
    lang: 'zh',
    roomId: '',
    roomType: '', // 是直播房间还是展会房间
    expoRoomName: '',
    trtcPrivateSig: '',
    room: {},
    pv: 0,
    isOpenInsert: 0, // 0没有开启,1:已经开启
    isOpenSpeech: 0, // 0没有开启,1:已经开启
    isOpenLive: false, // 是否开启直播
    liveStatus: 1 // 直播间状态 1未开始 2直播中 3已结束
  },
  getters: {
    lang: state => state.lang,
    roomId: state => state.roomId,
    roomType: state => state.roomType,
    room: state => state.room,
    pv: state => state.pv,
    isOpenInsert: state => state.isOpenInsert,
    isOpenSpeech: state => state.isOpenSpeech,
    isOpenLive: state => state.isOpenLive,
    liveStatus: state => state.liveStatus,
  },
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
    async getroom({ commit }, { payload, callback }) {
      const { status, data: { data } } = await getroom(payload)

      if (status) {
        document.title = data.name
        commit('setState', [
          {
            key: 'room',
            value: data
          },
          {
            key: 'pv',
            value: data.pv
          },
          {
            key: 'isOpenSpeech',
            value: data.isOpenSpeech
          },
          {
            key: 'isInstallVideoOpen',
            value: data.isInstallVideoOpen
          },
        ])

        if (data.curTime < data.startTime) {
          commit('setState', {
            key: 'liveStatus',
            value: 1
          })
        } else if (data.curTime > data.realEndTime) {
          commit('setState', {
            key: 'liveStatus',
            value: 3
          })
        } else {
          commit('setState', {
            key: 'liveStatus',
            value: 2
          })
        }

        if (data.liveAnthorIds.length > 0) {
          commit('setState', {
            key: 'isOpenLive',
            value: true
          })
        }

        callback?.(data)
      }
      return { status, data }
    },

    async entryroom({ commit }, { payload, callback }) {
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

        // 是否需要填写表单
        // this.setMainFormId(data.data.mainFormId)
        // if (data.data.needSummitForm && this.user.isCompletedInfo === 1) {
        //   location.href = `https://forms.ofweek.com/Form/preview?form_id=${data.data.mainFormId}&phone=${data.data.phone}`
        //   return
        // }

        // 获取进入视频直播间密匙
        // gettrtcprivatesig({roomid: this.roomId}).then(data => {
        //   if (data.code === 0) {
        //     this.setTrtcPrivateSig(data.data.trtcPrivateSig)
        //   }
        // })

        // 获取账号的要完善信息
        await getcompleteinfo().then(({ data }) => {
          if (data.code === 0) {
            // this.setUserInfo(data.data)
            let _name = ''
            if (data.data.nick) {
              _name = data.data.nick
            } else if (data.data.name) {
              _name = data.data.name
            } else {
              _name = data.data.mobilePhone
            }
            commit('user/setState', {
              key: 'userName',
              value: _name
            }, { root: true })
          }
        })
      } else {
        // 进房异常
        ElMessageBox.alert(data?.message || '网络拥堵，请重新进入直播间', '提示', {
          confirmButtonText: '确定',
          callback: () => window.location.reload()
        });
      }

      callback?.({ status, ...data })
    },

    // 房间成员心跳
    async roomHeartbeat({ }, { payload, callback }) {
      const { status, data: { data } } = await sendRoomHeartbeat(payload)
      if (status) {
        callback?.(data)
      }
      return { status, data }
    },

  }
}