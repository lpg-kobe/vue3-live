<template>
  <div class="ofweek-live-container flex-column">
    <media-check
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="user.userInfo"
      @btn-click="handleMediaSetEmit"
    />
    <div v-if="mainStreamList.length" class="remote-view flex">
      <div
        class="wrap-item live-small-view"
        v-for="item in mainStreamList"
        :key="item.userId_"
        @mouseover="onLiveStreamMouse(1, item)"
        @mouseout="onLiveStreamMouse(0, item)"
      >
        <div :id="`live_stream_${item.userId_}`" class="stream-player"></div>
        <div class="stream-label">
          <label>{{ item.nick }}</label>
        </div>
        <!--default cover-->
        <Img
          :src="item.headUrl"
          class="stream-cover"
          v-show="!item.isOpenCamera"
          alt="cover"
        />
        <stream-mask v-show="item.maskShow" :stream="item" />
      </div>
    </div>
    <div class="live-main-view flex-center">ppt</div>
    <el-dialog title="提示" v-model="applyShow">
      <p>{{ applyMsg.auditerNick }}申请上麦</p>
      <template #footer>
        <el-button @click="handleGuestApply(0)">拒绝</el-button>
        <el-button type="primary" @click="handleGuestApply(1)">同意</el-button>
      </template>
    </el-dialog>
    <el-dialog title="提示" v-model="inviteShow">
      <p>{{ inviteMsg.inviterNick }}邀请您上麦</p>
      <template #footer>
        <el-button @click="handleInvite(0)">拒绝</el-button>
        <el-button type="primary" @click="handleInvite(1)">同意</el-button>
      </template>
    </el-dialog>
  </div>
</template> 

<script>
import { mapState } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { IM_EVENT } from '../../../sdk/imLive'
import MediaCheck from './mediaCheck.vue'
import StreamMask from './streamMask.vue'
import Img from '../../../components/img/index.vue'
import { eventEmitter } from '../../../utils/event'

export default {
  name: 'live',

  components: {
    MediaCheck,
    Img,
    StreamMask,
  },

  data() {
    return {
      mediaSelVisible: true,
      mainStreamList: [],
      applyShow: false,
      applyMsg: {},
      applyTimer: null,
      inviteShow: false,
      inviteMsg: {},
      inviteTimer: null,
    }
  },

  created() {
    this.joinTrtc()
    this.initLive()
    this.unbindEvent()
    this.bindEvent()
  },

  computed: {
    ...mapState({
      user: ({ user }) => user,
      live: ({ live }) => live,
      room: ({ room }) => room,
      imClient: ({ imClient }) => imClient,
      trtcClient: ({ trtcClient }) => trtcClient,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },

  methods: {
    // join trtc room after get private key
    joinTrtc() {
      return new Promise((resolve) => {
        this.$store.dispatch({
          type: 'live/getPrivateKey',
          payload: {
            roomid: this.roomId,
          },
          callback: ({ data: { trtcPrivateSig } }) => {
            this.$store.commit('live/setState', {
              key: 'liveToggleLoading',
              value: true,
            })
            this.trtcClient.client
              .join({
                roomId: Number(this.roomId),
                role: 'anchor',
                privateMapKey: trtcPrivateSig,
              })
              .then(
                () => {
                  console.log('success to join trtc-room')
                  this.$store.commit('live/setState', [
                    {
                      key: 'liveJoinStatus',
                      value: 1,
                    },
                    {
                      key: 'liveToggleLoading',
                      value: false,
                    },
                  ])
                  resolve(true)
                },
                (err) => {
                  console.error('fail to join trtc-room', err)
                  this.$store.commit('live/setState', [
                    {
                      key: 'liveJoinStatus',
                      value: 0,
                    },
                    {
                      key: 'liveToggleLoading',
                      value: false,
                    },
                  ])
                  ElMessageBox.alert(
                    '网络异常导致进入直播间超时，请重新试试',
                    '温馨提示',
                    {
                      confirmButtonText: '好的',
                      callback: () => window.location.reload(),
                    }
                  )
                  resolve(false)
                }
              )
          },
        })
      })
    },

    // init live data before do anything, will move other in feature
    initLive() {
      this.$store.dispatch({
        type: 'room/getroom',
        payload: {
          roomid: this.roomId,
        },
      })
      this.$store.dispatch({
        type: 'live/getMembers',
        payload: {
          roomid: this.roomId,
        },
        callback: (members) => {
          // init room speaker
          const speaker = members.find(({ isMainSpeaker }) => isMainSpeaker)
          this.$store.commit('live/setState', {
            key: 'liveSpeaker',
            value: {
              ...speaker,
              userId: speaker.memberId,
            },
          })
        },
      })

      // get user in room, will move feature
      this.$store.dispatch({
        type: 'room/entryroom',
        payload: {
          roomid: this.roomId,
        },
      })
    },

    // ready to mix stream of all users in live
    startMixStream() {
      const videoRate = 9 / 16
      const videoHeight = 468
      const videoSpace = 10
      const thumbHeight = 120
      const videoWidth = 468 / videoRate
      const thumbWidth = (videoWidth - videoSpace * 6) / 5
      const speakerHeight = videoHeight - thumbHeight - videoSpace * 2
      // 主讲人占大画面，其余人依次排列在下方
      const mixUsers = [
        {
          width: videoWidth,
          height: speakerHeight,
          locationX: 0,
          locationY: 0,
          pureAudio: false,
          // streamType: 'main', // 远端主流
          userId: String(this.live.liveSpeaker.userId), // 主讲人占位
          zOrder: 1,
        },
        ...this.mainStreamList.map(({ userId_ }, index) => ({
          width: thumbWidth,
          height: thumbHeight,
          locationX: index * thumbWidth + videoSpace * (index + 1),
          locationY: speakerHeight + videoSpace, // 从上至下
          pureAudio: false,
          // streamType: 'auxiliary', // 远端辅流
          userId: '$PLACE_HOLDER_REMOTE$', // 其余人小窗口占位
          zOrder: 2,
        })),
      ]
      const mixConfig = {
        mode: 'preset-layout',
        streamId: this.room.room?.myStreamIdMix,
        videoWidth,
        videoHeight,
        videoBitrate: 1500,
        videoFramerate: 20,
        videoGOP: 2,
        audioSampleRate: 48000,
        audioBitrate: 64,
        audioChannels: 2,
        mixUsers,
      }
      return new Promise((resolve) => {
        this.trtcClient.client.startMixTranscode(mixConfig).then(
          () => {
            console.log('混流成功~~')
            resolve(true)
          },
          (err) => {
            console.error('混流失败~~', err)
            resolve(false)
          }
        )
      })
    },

    /**
     * @desc 停止混流
     * @description 注意事项: 停止混流必须在混流发起者leave trtc之前, 否则会导致异常
     */
    stopMixStream() {
      return new Promise((resolve) => {
        this.trtcClient.client.stopMixTranscode().then(
          () => {
            console.log('success to stop mixstream')
            resolve(true)
          },
          (err) => {
            console.warn('fail to stop mixstream', err)
            resolve(false)
          }
        )
      })
    },

    unbindEvent() {
      eventEmitter.off(eventEmitter.event?.live?.setMedia, this.onMediaSetting)
      eventEmitter.off(
        eventEmitter.event?.live?.toggleMedia,
        this.onMediaToggle
      )
      eventEmitter.off(eventEmitter.event?.anchor?.start, this.onAnchorStart)
      eventEmitter.off(eventEmitter.event?.anchor?.invite, this.onAnchorInvite)
      eventEmitter.off(eventEmitter.event?.anchor?.stop, this.onAnchorStop)
      eventEmitter.off(
        eventEmitter.event?.anchor?.setSpeaker,
        this.onAnchorSetSpeaker
      )
      eventEmitter.off(eventEmitter.event?.guest?.start, this.onGuestStart)
      eventEmitter.off(eventEmitter.event?.guest?.apply, this.onGuestApply)
      eventEmitter.off(eventEmitter.event?.guest?.stop, this.onGuestStop)
      this.imClient?.off(IM_EVENT?.msgReceive, this.onMsgReceive)
      this.trtcClient?.stream?.off('*')
      this.trtcClient?.client?.off('*')
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event?.live?.setMedia, this.onMediaSetting)
      eventEmitter.on(eventEmitter.event?.live?.toggleMedia, this.onMediaToggle)
      eventEmitter.on(eventEmitter.event?.anchor?.start, this.onAnchorStart)
      eventEmitter.on(eventEmitter.event?.anchor?.invite, this.onAnchorInvite)
      eventEmitter.on(eventEmitter.event?.anchor?.stop, this.onAnchorStop)
      eventEmitter.on(
        eventEmitter.event?.anchor?.setSpeaker,
        this.onAnchorSetSpeaker
      )
      eventEmitter.on(eventEmitter.event?.guest?.start, this.onGuestStart)
      eventEmitter.on(eventEmitter.event?.guest?.apply, this.onGuestApply)
      eventEmitter.on(eventEmitter.event?.guest?.stop, this.onGuestStop)
      this.imClient?.on(IM_EVENT?.msgReceive, this.onMsgReceive)
      this.trtcClient?.client?.on('stream-added', this.onStreamAdded)
      this.trtcClient?.client?.on('stream-subscribed', this.onGetRemoteStream)
      this.trtcClient?.client?.on('stream-removed', this.onStreamRemoved)
      this.trtcClient?.client?.on('mute-audio', this.onRemoteMuteAudio)
      this.trtcClient?.client?.on('unmute-audio', this.onRemoteUnmuteAudio)
      this.trtcClient?.client?.on('mute-video', this.onRemoteMuteVideo)
      this.trtcClient?.client?.on('unmute-video', this.onRemoteUnmuteVideo)
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i]

          if (!msg.payload?.data) {
            return
          }

          const payloadData = JSON.parse(msg.payload?.data)
          const { msgCode } = payloadData
          console.log(payloadData)

          if (String(payloadData.roomId) !== String(this.roomId)) {
            return
          }

          const codeAction = {
            // 直播间结束
            1027: () => {
              this.destroyRoom()
            },

            // 邀请直播消息
            1706: () => {
              this.inviteMsg = payloadData
              this.inviteShow = true
              // 30秒内不处理上麦消息自动决绝并关闭弹窗
              this.inviteTimer = setTimeout(() => {
                this.handleInvite(0)
              }, 30 * 1000)
            },

            // 申请上麦消息
            1710: () => {
              this.applyMsg = payloadData
              this.applyShow = true
              // 30秒内不处理上麦消息自动决绝并关闭弹窗
              this.applyTimer = setTimeout(() => {
                this.handleGuestApply(0)
              }, 30 * 1000)
            },

            // 处理上麦申请消息
            1712: () => {
              if (
                String(payloadData.auditerId) !==
                String(this.user?.userInfo?.imAccount)
              ) {
                return
              }
              if (payloadData.isAgree) {
                ElMessage.success(`${payloadData.anthorNick}同意了您的上麦申请`)
                eventEmitter.emit(eventEmitter.event?.guest?.start)
              } else {
                ElMessage.error(`${payloadData.anthorNick}拒绝了您的上麦申请`)
              }
            },

            // 处理上麦邀请消息
            1714: () => {
              if (
                String(payloadData.adminId) !==
                String(this.user?.userInfo?.imAccount)
              ) {
                return
              }
              ElMessage[payloadData.isAgree ? 'success' : 'error'](
                `${payloadData.guestNick}${
                  payloadData.isAgree ? '同意' : '拒绝'
                }了您的上麦邀请`
              )
            },

            // 主播开始直播消息
            1722: () => {},

            // 主播设置主讲人消息
            1724: () => {
              this.$store.commit('live/setState', {
                key: 'liveSpeaker',
                value: {
                  ...payloadData,
                  userId: payloadData.mainSpeakerId,
                },
              })
              this.mainStreamList = this.filterLiveStream()
            },

            // 主播结束直播
            1723: () => {
              this.destroyRoom()
            },

            // 嘉宾上麦
            1726: () => {},

            // 嘉宾下麦推送
            1727: () => {
              const isGuestSelf =
                String(payloadData.guestId) == String(this.user.user.imAccount)
              if (payloadData.isAuthorStopLive) {
                // 主播推送当前嘉宾下麦
                isGuestSelf && eventEmitter.emit(eventEmitter.event.guest.stop)
              }
            },
            // 直播中媒体设备开关消息
            1728: () => {
              const { isOpenCamera, isOpenMike } = payloadData
              const isMicToggle = isOpenMike !== null
              eventEmitter.emit(eventEmitter.event.live.toggleMedia, {
                type: isMicToggle ? 'mic' : 'camera',
                userId: payloadData.memberId,
                isOpenMic: isMicToggle ? isOpenMike : null,
                isOpenCamera: isMicToggle ? null : isOpenCamera,
              })
            },
          }
          codeAction[msgCode]?.()
        }
      } catch (err) {
        console.warn('fail to pass msg of im', err)
      }
    },

    /** remote stream publish */
    onStreamAdded(event) {
      this.trtcClient.client
        .subscribe(event.stream, { audio: true, video: true })
        .then(
          () => {
            console.log('some one publish stream')
          },
          () => {
            console.error('failed to subscribe remoteStream')
          }
        )
    },

    /** success to get remote stream to play */
    async onGetRemoteStream(event) {
      let isSpeaker = false
      const { stream } = event

      //  ignore current speaker & play remote stream to main stream view
      if (!this.live.liveSpeaker?.userId) {
        const { status, data } = await this.$store.dispatch({
          type: 'live/getMembers',
          payload: {
            roomid: this.roomId,
          },
        })

        if (!status) {
          return
        }

        const mainSpeaker = data.find(({ isMainSpeaker }) => isMainSpeaker)
        this.$store.commit('live/setState', {
          key: 'liveSpeaker',
          value: {
            userId: mainSpeaker.memberId,
          },
        })
        isSpeaker = String(mainSpeaker.memberId) === String(stream.userId_)
      } else {
        isSpeaker =
          String(this.live.liveSpeaker.userId) === String(stream.userId_)
      }

      this.$store.commit('live/setState', [
        {
          key: 'liveStreamList',
          value: [
            ...this.live.liveStreamList,
            Object.assign(stream, {
              isOpenMic: isSpeaker,
              isOpenCamera: true,
            }),
          ],
        },
        {
          key: 'liveStart',
          value: true,
        },
      ])

      this.mainStreamList = this.filterLiveStream()
      this.$nextTick(() => {
        !isSpeaker &&
          this.tryToPlayStream(stream, `live_stream_${stream.userId_}`)
      })
    },

    onStreamRemoved(event) {
      const { stream } = event
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.filterLiveStream(stream.userId_),
      })
      this.mainStreamList = this.filterLiveStream()
    },

    onRemoteMuteAudio(event) {
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.map((stream) =>
          Object.assign(stream, {
            isOpenMic:
              String(event.userId) === String(stream.userId_)
                ? false
                : stream.isOpenMic,
          })
        ),
      })
      this.mainStreamList = this.filterLiveStream()
    },

    onRemoteUnmuteAudio(event) {
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.map((stream) =>
          Object.assign(stream, {
            isOpenMic:
              String(event.userId) === String(stream.userId_)
                ? true
                : stream.isOpenMic,
          })
        ),
      })
      this.mainStreamList = this.filterLiveStream()
    },

    onRemoteMuteVideo(event) {
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.map((stream) =>
          Object.assign(stream, {
            isOpenCamera:
              String(event.userId) === String(stream.userId_)
                ? false
                : stream.isOpenCamera,
          })
        ),
      })
      this.mainStreamList = this.filterLiveStream()
    },

    onRemoteUnmuteVideo(event) {
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.map((stream) =>
          Object.assign(stream, {
            isOpenCamera:
              String(event.userId) === String(stream.userId_)
                ? true
                : stream.isOpenCamera,
          })
        ),
      })
      this.mainStreamList = this.filterLiveStream()
    },

    // 处理上麦邀请
    handleInvite(isagree) {
      window.clearTimeout(this.inviteTimer)
      this.$store.dispatch({
        type: 'live/handleInviteLive',
        payload: {
          roomid: this.roomId,
          adminid: this.inviteMsg.inviterId,
          isagree,
        },
      })
      this.inviteShow = false
    },

    // 处理上麦申请
    handleGuestApply(isagree) {
      window.clearTimeout(this.applyTimer)
      this.$store.dispatch({
        type: 'live/handleApplyLive',
        payload: {
          roomid: this.roomId,
          auditerid: this.applyMsg.auditerId,
          isagree,
        },
      })
      this.applyShow = false
    },

    /** filter live stream by id */
    filterLiveStream(filterId = this.live.liveSpeaker?.userId) {
      return this.live.liveStreamList
        .filter(({ userId_ }) => String(userId_) !== String(filterId))
        .map((stream) =>
          Object.assign(
            stream,
            {
              ...this.live.liveMembers.find(
                ({ memberId }) => String(memberId) === String(stream.userId_)
              ),
            },
            {
              isOpenMic: stream.isOpenMic,
              isOpenCamera: stream.isOpenCamera,
            }
          )
        )
    },

    /** 打开媒体设置 */
    onMediaSetting() {
      this.mediaSelVisible = !this.mediaSelVisible
    },

    /**
     * @desc 直播间切换媒体设备开关
     * @param {type:String,userId:String,isOpenMic:Boolean,isOpenCamera:Boolean} Object
     */
    onMediaToggle({ data: { type, userId, isOpenMic, isOpenCamera } }) {
      const isMicToggle = type === 'mic'
      const isSelf = String(userId) === String(this.user.user.imAccount)
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.map((stream) =>
          Object.assign(stream, {
            isOpenMic:
              isMicToggle && String(userId) === String(stream.userId_)
                ? isOpenMic
                : stream.isOpenMic,
            isOpenCamera:
              !isMicToggle && String(userId) === String(stream.userId_)
                ? isOpenCamera
                : stream.isOpenCamera,
          })
        ),
      })
      isSelf &&
        this.trtcClient.stream &&
        this.trtcClient.stream[
          isMicToggle
            ? [isOpenMic ? 'unmuteAudio' : 'muteAudio']
            : [isOpenCamera ? 'unmuteVideo' : 'muteVideo']
        ]?.()
      this.mainStreamList = this.filterLiveStream()
    },

    /** 主播开始直播，主播上麦默认主讲人 */
    async onAnchorStart() {
      if (this.live.liveJoinStatus !== 1) {
        await this.joinTrtc()
      }

      this.$store.commit('live/setState', {
        key: 'liveToggleLoading',
        value: true,
      })
      this.$store.dispatch({
        type: 'live/startLive',
        payload: {
          roomid: this.roomId,
          streamid: this.room.room?.myStreamIdMix,
          streamtype: 1,
        },
        callback: () => ElMessage.success('直播已开始'),
      })

      // publish & mix
      this.trtcClient.client.publish(this.trtcClient.stream).then(
        () => {
          console.log('success for anchor to publish stream~~~~~')
          this.$store.commit('live/setState', [
            {
              key: 'liveToggleLoading',
              value: false,
            },
            {
              key: 'liveStart',
              value: true,
            },
            {
              key: 'liveSpeaker',
              value: {
                stream: this.trtcClient.stream,
                userId: this.trtcClient.stream.userId_,
              },
            },
            {
              key: 'liveStreamList',
              value: [
                ...this.live.liveStreamList,
                Object.assign(this.trtcClient.stream, {
                  isOpenMic: true,
                  isOpenCamera: true,
                }),
              ],
            },
          ])
          this.mainStreamList = this.filterLiveStream()
          // this.startMixStream()
        },
        (err) => {
          this.$store.commit('live/setState', [
            {
              key: 'liveToggleLoading',
              value: false,
            },
          ])
          ElMessage.error('直播失败，请重试')
          console.warn('fail for anchor to publish stream', err)
        }
      )
    },

    /** 主播邀请直播 */
    async onAnchorInvite() {},

    /** 主播结束直播 */
    async onAnchorStop() {
      this.$store.commit('live/setState', {
        key: 'liveToggleLoading',
        value: true,
      })
      this.clearLiveDataOfUser(true)
      this.$store.dispatch({
        type: 'live/stopLive',
        payload: {
          roomid: this.roomId,
        },
        callback: () => ElMessage.success('直播已结束'),
      })
    },

    /** 主播设置主讲人 */
    async onAnchorSetSpeaker({ data }) {
      const { status } = await this.$store.dispatch({
        type: 'live/setMainSpeaker',
        payload: {
          roomid: this.roomId,
          memberid: data?.userId_,
        },
      })
      if (!status) {
        return
      }
      // this.startMixStream()
      ElMessage.success(`已将${data?.nick}设为主讲人`)
    },

    /** 嘉宾申请上麦 */
    async onGuestApply() {
      await this.$store.dispatch({
        type: 'live/applyLive',
        payload: {
          roomid: this.roomId,
        },
      })
      ElMessage.success('上麦申请已发送')
    },

    /** 嘉宾开始上麦 */
    async onGuestStart() {
      if (this.live.liveJoinStatus !== 1) {
        await this.joinTrtc()
      }
      this.$store.dispatch({
        type: 'live/guestStartLive',
        payload: {
          roomid: this.roomId,
        },
        callback: () => ElMessage.success('上麦成功'),
      })

      this.trtcClient.client.publish(this.trtcClient.stream).then(
        async () => {
          console.log('success for guest to publish stream~~~~~')

          this.$store.commit('live/setState', [
            {
              key: 'liveStart',
              value: true,
            },
            {
              key: 'liveStreamList',
              value: [
                ...this.live.liveStreamList,
                Object.assign(this.trtcClient.stream, {
                  isOpenMic: false,
                  isOpenCamera: true,
                }),
              ],
            },
          ])

          this.mainStreamList = this.filterLiveStream()
          // 嘉宾上麦默认静音
          this.trtcClient.stream.muteAudio()
          await this.trtcClient.stream.stop()
          this.$nextTick(() => {
            this.tryToPlayStream(
              this.trtcClient.stream,
              `live_stream_${this.trtcClient.stream.userId_}`,
              {
                muted: true,
              }
            )
          })
        },
        (err) => {
          ElMessage.error('上麦失败')
          console.warn('fail for guest to publish stream', err)
        }
      )
    },

    /** 嘉宾下麦 */
    async onGuestStop() {
      this.$store.commit('live/setState', {
        key: 'liveToggleLoading',
        value: true,
      })
      this.clearLiveDataOfUser(false)
      this.$store.dispatch({
        type: 'live/guestStopLive',
        payload: {
          roomid: this.roomId,
          memberid: this.user.userInfo?.imAccount,
        },
        callback: () => ElMessage.success('您已下麦'),
      })
    },

    /** handle click btn of media setting */
    async handleMediaSetEmit() {
      const userIsSpeaker =
        String(this.live.liveSpeaker.userId) ===
        String(this.user.user.imAccount)
      const userIsLive = this.live.liveStreamList.find(
        ({ userId_ }) => String(userId_) === String(this.user.user.imAccount)
      )

      await this.trtcClient.stream.stop()
      userIsLive &&
        this.trtcClient.stream.play(
          userIsSpeaker
            ? 'speakerId'
            : `live_stream_${this.user.user.imAccount}`
        )
      this.mediaSelVisible = false
    },

    onLiveStreamMouse(type, item) {
      const { role, imAccount } = this.user.user
      const isSelf = String(imAccount) === String(item.userId_)
      if (role !== 1 && !isSelf) {
        return
      }
      item.maskShow = type
    },

    /** clear data of user after user stop live */
    async clearLiveDataOfUser(isAnchor) {
      // isAnchor && (await this.stopMixStream())
      await this.trtcClient.cancelPublish()
      this.trtcClient.stream.stop()
      this.$store.commit('live/setState', [
        {
          key: 'liveStreamList',
          value: isAnchor
            ? []
            : this.filterLiveStream(this.trtcClient.stream.userId_),
        },
        {
          key: 'liveJoinStatus',
          value: 0,
        },
        {
          key: 'liveToggleLoading',
          value: false,
        },
      ])
      this.mainStreamList = this.filterLiveStream()
    },

    /** destroy room & clear store of live */
    async destroyRoom() {
      const userIsLive = this.live.liveStreamList.some(
        ({ userId_ }) => String(userId_) === String(this.user.user.imAccount)
      )
      if (userIsLive) {
        await this.trtcClient.cancelPublish()
        this.trtcClient.stream?.stop()
      }
      this.$store.commit('live/setState', [
        {
          key: 'liveStreamList',
          value: [],
        },
        {
          key: 'liveJoinStatus',
          value: 0,
        },
        {
          key: 'liveSpeaker',
          value: {
            userId: '',
          },
        },
        {
          key: 'liveStart',
          value: false,
        },
      ])
      this.mainStreamList = []
    },

    /** custom stream attribute before create */
    customStream(stream, config) {
      // can i use __proto__ here ?
      Object.entries(config).forEach(([key, value]) => {
        stream.__proto__[key] = value
      })
      return stream
    },

    /** try to play & handle error */
    tryToPlayStream(stream, target, options = {}) {
      stream.play(target, options).then(
        () => {
          console.log('yes!!! success to play remote stream')
        },
        (err) => {
          const errorCode = err?.getCode?.()
          if (errorCode === 0x4043) {
            // TODO PLAY_NOT_ALLOWED,引导用户手势操作并调用 stream.resume 恢复音视频播放
            // stream.resume()
          }
        }
      )
    },
  },
}
</script>
<style lang="scss" scoped>
.ofweek-live-container {
  .remote-view {
    background: #2c2c2c;
    .wrap-item {
      position: relative;
      overflow: hidden;
      margin: 10px 0 10px 10px;
      width: calc((100% - 10px * 6) / 5);
      .stream-player {
        height: 100%;
      }
      .stream-label {
        position: absolute;
        overflow: hidden;
        white-space: nowrap;
        word-break: keep-all;
        text-overflow: ellipsis;
        z-index: 4;
        top: 10px;
        left: 10px;
        width: calc(100% - 10px);
        font-size: 14px;
        color: #fff;
      }
      .stream-cover {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
    }
  }
  .live-main-view {
    background: red;
    height: calc(100% * 9 / 16);
  }
}
</style>
