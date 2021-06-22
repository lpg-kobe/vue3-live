/**
 * @desc base modules of room
 */
import { ElMessage } from 'element-plus'
import { getroom, entryroom, getcompleteinfo } from '../../../services/room'

export default {
  namespaced: true,
  state: {
    lang: 'zh',
    roomId: 94,
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

      document.title = data.name

      if (status) {
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

        callback?.({ status, ...data })
      }
    },

    async entryroom({ commit, dispatch }, { payload, callback }) {
      const { status, data } = await entryroom(payload)
      console.log(data, 'entryroom进入房间成功')

      if (data.code === 0) {
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
            console.log(_name)
            commit('user/setState', {
              key: 'userName',
              value: _name
            }, { root: true })
          }
        })

        // 获取房间信息
        dispatch({
          type: 'getroom',
          payload: {
            roomid: 94
          },
          callback: () => {
            // 是否完善名片
            // if (state.user.user.isCompletedInfo === 0 && this.room.watchMode === 2 && this.liveStatus !== 1) {
            //   setTimeout(() => {
            //     commit('user/setState', {
            //       key: 'cardShow',
            //       value: true
            //     }, { root: true })
            //   }, this.room.delayLoginTime * 1000)
            // }
            return
            // 用户心跳
            let heartTimer = setInterval(() => {
              heartbeat({
                memberId: this.imAccount,
                roomId: this.roomId,
                time: new Date()
              }).then(data => {
                // 断网后网络恢复
                if (this.networkBreak) {
                  window.location.reload();
                }
              }, error => {
                this.$EventBus.$emit('chatAddErrorMsg', this.networkDisconnection)
                if (!this.networkBreak) {
                  this.networkBreak = true
                }
              })
            }, 8000)

            // 被踢出
            // this.$EventBus.$on('timKickOut',() => {
            //   clearInterval(heartTimer)
            // })

            // ?为啥延迟100毫秒
            setTimeout(() => {
              this.initFinish = true
            }, 100)
          }
        })

        // 登录TIM
        // this.timLogin(isVisitor)
      } else {
        // 进房异常
        ElMessage.error(data.message)
        if (data.code === -23) {
          setTimeout(() => {
            location.reload()
          }, 3000)
        } else {
          setTimeout(() => {
            location.href = 'https://live.ofweek.com/'
          }, 3000)
        }
      }

      callback?.({ status, ...data })
    }
  }
}