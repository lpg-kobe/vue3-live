<template>
  <div class="ofweek-live-container flex-column">
    <MediaCheck
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="user.userInfo"
      @btn-click="handleMediaSel"
    />
    <div v-if="mainStreamList.length" class="remote-view flex">
      <div class="wrap-item live-small-view" v-for="(item) in mainStreamList" :key="item.userId_" 
      @mouseover="onLiveStreamMouse(1, item)" @mouseout="onLiveStreamMouse(0, item)">
        <div :id="`live_stream_${item.userId_}`"></div>
        <div class="stream-mask" v-show="item.maskShow">
          <div class="mask-header">
              {{item.userName}}
          </div>
          <div class="mask-menu">
            <i class="icon icon-user" title="设为主讲" v-if="user.user.role === 1"></i>
            <i :class="`icon icon-${item.isOpenCamera ? 'camera' : 'uncamera'}`" 
            :title="`${item.isOpenCamera ? '关闭' : '开启'}摄像头`"></i>
            <i :class="`icon icon-${item.isOpenMic ? 'mic' : 'unmic'}`" 
            :title="`${item.isOpenMic ? '关闭' : '开启'}麦克风`"></i>
            <i class="icon icon-hand" 
            title="上麦中"></i>
          </div>
        </div>
      </div>
    </div>
    <div class="live-main-view flex-center">
      ppt
    </div>
      <el-dialog title="提示" v-model="applyShow">
        <p>{{applyMsg.auditerNick}}申请上麦</p>
        <template #footer>
          <el-button @click="handleGuestApply(0)">拒绝</el-button>
          <el-button type="primary" @click="handleGuestApply(1)">同意</el-button>
        </template>
      </el-dialog>
      <el-dialog title="提示" v-model="inviteShow">
        <p>{{inviteMsg.inviterNick}}邀请您上麦</p>
        <template #footer>
          <el-button @click="handleInvite(0)">拒绝</el-button>
          <el-button type="primary" @click="handleInvite(1)">同意</el-button>
        </template>
      </el-dialog>
  </div>
</template> 

<script>
import { mapState } from "vuex";
import { ElMessage } from 'element-plus'
import { IM_EVENT } from "../../../sdk/imLive";
import MediaCheck from "./mediaCheck.vue";
import { eventEmitter } from '../../../utils/event'

export default {
  name: "live",

  components: {
    MediaCheck,
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
      inviteTimer: null
    };
  },

  created() {
    this.joinTrtc();
    this.initLive();
    this.unbindEvent();
    this.bindEvent();
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
      this.$store.dispatch({
        type: "live/getPrivateKey",
        payload: {
          roomid: this.roomId,
        },
        callback: ({ data: { trtcPrivateSig } }) => {
          this.trtcClient.client
            .join({
              roomId: Number(this.roomId),
              role: "anchor",
              privateMapKey: trtcPrivateSig,
            })
            .then(
              () => {
                console.log("success to join trtc-room");
              },
              (err) => {
                console.error("fail to join trtc-room", err);
              }
            );
        },
      });
    },

    // init live data before do anything, will move other in feature
    initLive() {
      this.$store.dispatch({
        type: 'room/getroom',
        payload: {
          roomid: this.roomId
        }
      })
      this.$store.dispatch({
        type: "live/getMembers",
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
              userId: speaker.memberId
            }
          })
        },
      });

      // get user in room, will move feature
      this.$store.dispatch({
        type: 'room/entryroom',
        payload: {
          roomid: this.roomId
        }
      })
    },

    // ready to mix stream of users in room
    startMixStream() {
      const videoRate = 9 / 16;
      const mixUsers = this.live.liveMembers.map(({ memberId }) => ({
        height: 120,
        width: 120 / videoRate,
        // locationX:
      }));
      const mixConfig = {
        mode: "preset-layout",
        videoWidth: 450 / videoRate,
        videoHeight: 450,
        videoBitrate: 1500,
        videoFramerate: 15,
        videoGOP: 2,
        audioSampleRate: 48000,
        audioBitrate: 64,
        audioChannels: 1,
        // 预设一路本地摄像头、一路本地屏幕分享、两路远端流的排版位置
      };
    },

    unbindEvent() {
      eventEmitter.off(eventEmitter.event?.anchor?.start,this.onAnchorStart)
      eventEmitter.off(eventEmitter.event?.anchor?.invite,this.onAnchorInvite)
      eventEmitter.off(eventEmitter.event?.anchor?.stop,this.onAnchorStop)
      eventEmitter.off(eventEmitter.event?.guest?.start,this.onGuestStart)
      eventEmitter.off(eventEmitter.event?.guest?.apply,this.onGuestApply)
      eventEmitter.off(eventEmitter.event?.guest?.stop,this.onGuestStop)
      this.imClient?.off(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.client?.off("stream-added", this.onStreamAdded);
      this.trtcClient?.client?.off("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.client?.off("stream-removed", this.onStreamRemoved);
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event?.anchor?.start,this.onAnchorStart)
      eventEmitter.on(eventEmitter.event?.anchor?.invite,this.onAnchorInvite)
      eventEmitter.on(eventEmitter.event?.anchor?.stop,this.onAnchorStop)
      eventEmitter.on(eventEmitter.event?.guest?.start,this.onGuestStart)
      eventEmitter.on(eventEmitter.event?.guest?.apply,this.onGuestApply)
      eventEmitter.on(eventEmitter.event?.guest?.stop,this.onGuestStop)
      this.imClient?.on(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.client?.on("stream-added", this.onStreamAdded);
      this.trtcClient?.client?.on("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.client?.on("stream-removed", this.onStreamRemoved);
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i];

          if (!msg.payload?.data) {
            return 
          }
          
          const payloadData = JSON.parse(msg.payload?.data)
          const { msgCode } = payloadData
          console.log(payloadData);

          if (String(payloadData.roomId) !== String(this.roomId)) {
            return 
          }

          const codeAction = {
            // 邀请直播消息
            1706: () => {
              this.inviteMsg = payloadData
              this.inviteShow = true
              // 30秒内不处理上麦消息自动决绝并关闭弹窗
              this.inviteTimer = setTimeout(() => {
                this.handleInvite(0)
               }, 30 * 1000);
            },

            // 申请上麦消息
            1710: () => {
               this.applyMsg = payloadData
               this.applyShow = true
                // 30秒内不处理上麦消息自动决绝并关闭弹窗
               this.applyTimer = setTimeout(() => {
                this.handleGuestApply(0)
               }, 30 * 1000);
            },

            // 处理上麦申请消息
            1712: () => {
              if (String(payloadData.auditerId) !== String(this.user?.userInfo?.imAccount)) {
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
              if (String(payloadData.adminId) !== String(this.user?.userInfo?.imAccount)) {
                return
              }
              ElMessage[payloadData.isAgree ? 'success' : 'error'](`${payloadData.guestNick}${payloadData.isAgree ? 
              '同意' : '拒绝'}了您的上麦邀请`)
            },

            // 主播开始直播消息
            1722: () => {},

            // 结束直播
            1723: () => {
              this.$store.commit('live/setState', [{
                key: 'liveStreamList',
                value: []
              },{
                key: 'liveSpeaker',
                value: {
                  userId: ''
                },
              },{
                key: 'liveStart',
                value: false
              }])
            },

            // 嘉宾上麦
            1726: () => {
            },

            // 嘉宾下麦
            1727: () => {
              
            },
          }
          codeAction[msgCode]?.()
        }
      } catch (err) {
        console.warn("fail to pass msg of im", err);
      }
    },

    /** remote stream publish */
    onStreamAdded(event) {
      this.trtcClient.client
        .subscribe(event.stream, { audio: true, video: true })
        .then(
          () => {
            console.log("some one publish stream");
          },
          () => {
            console.error("failed to subscribe remoteStream");
          }
        );
    },

    /** success to get remote stream to play */
    async onGetRemoteStream (event) {
      let isSpeaker = false
      const { stream } = event

      //  ignore current speaker & play remote stream to main stream view
      if (!this.live.liveSpeaker?.userId) {
        const { data } = await this.$store.dispatch({
          type: 'live/getMembers',
          payload: {
            roomid: this.roomId
          }
        })
        const mainSpeaker = data.find(({ isMainSpeaker }) => isMainSpeaker)
        this.$store.commit('live/setState', {
          key: 'liveSpeaker',
          value: {
            userId: mainSpeaker.memberId
          }
        })
        isSpeaker = String(mainSpeaker.memberId) === String(stream.userId_)
      } else {
        isSpeaker = String(this.live.liveSpeaker.userId) === String(stream.userId_)
      }

      this.$store.commit('live/setState', [{
        key: 'liveStreamList',
        value: [...this.live.liveStreamList, Object.assign(stream, {
          isOpenMic: isSpeaker,
          isOpenCamera: true
        })]
      },{            
          key: 'liveStart',
          value: true                        
      }])
      this.mainStreamList = this.filterLiveStream()
      this.$nextTick(() => {
        !isSpeaker && this.tryToPlayStream(stream, `live_stream_${stream.userId_}`)
      })
    },

    onStreamRemoved(event) {
      const { stream } = event
      this.$store.commit('live/setState', {
        key: 'liveStreamList',
        value: this.live.liveStreamList.filter(({ userId_ }) => userId_ !== stream.userId_)
      })
    },

    handleMediaSel(ok) {
      this.mediaSelVisible = false;
      if (ok) {
      }
    },

    // 处理上麦邀请
    handleInvite(isagree) {
      window.clearTimeout(this.inviteTimer)
      this.$store.dispatch({
        type: 'live/handleInviteLive',
        payload: {
          roomid: this.roomId,
          adminid: this.inviteMsg.inviterId,
          isagree
        }
      })
      this.inviteShow = false;
    },

    // 处理上麦申请
    handleGuestApply(isagree) {
      window.clearTimeout(this.applyTimer)
      this.$store.dispatch({
        type: 'live/handleApplyLive',
        payload: {
          roomid: this.roomId,
          auditerid: this.applyMsg.auditerId,
          isagree
        }
      })
      this.applyShow = false;
    },

    /** filter speaker member from live stream */
    filterLiveStream () {
      return this.live.liveStreamList.filter(({ 
      userId_
      }) => String(userId_) !== String(this.live.liveSpeaker.userId))
    },

    /** 主播开始直播，主播上麦默认主讲人 */
    onAnchorStart () {
      this.$store.dispatch({
        type: 'live/startLive',
        payload: {
          roomid: this.roomId,
          streamid: this.room.room?.myStreamId,
          streamtype: 1
        },
        callback: () => ElMessage.success('直播已开始')
      })

      // publish & mix
      this.trtcClient.client.publish(this.trtcClient.stream).then(() => {
        console.log('success for anchor to publish stream~~~~~')            

        this.$store.commit('live/setState', [{            
          key: 'liveStart',
          value: true                        
        }, {
          key: 'liveSpeaker',
          value: {
            stream: this.trtcClient.stream,
            userId: this.trtcClient.stream.userId_
          }
        }, {
          key: 'liveStreamList',
          value: [...this.live.liveStreamList, Object.assign(this.trtcClient.stream, {
            isOpenMic: true,
            isOpenCamera: true
          })]
        }])
        this.mainStreamList = this.filterLiveStream()   

      }, (err) => {
        ElMessage.error('直播失败，请重试')
        console.warn('fail for anchor to publish stream', err)
      })            
    },

    /** 主播邀请直播 */
    async onAnchorInvite () {},

    /** 主播结束直播 */
    async onAnchorStop () {

      this.trtcClient.client?.unpublish(this.trtcClient.stream)
      this.trtcClient.stream?.stop()
      this.$store.commit('live/setState', [{
        key: 'liveStreamList',
        value: this.live.liveStreamList.filter(({ userId_ }) => userId_ !== this.trtcClient.stream.userId_)
      }])
      this.mainStreamList = this.filterLiveStream()

      await this.$store.dispatch({
        type: 'live/stopLive',
        payload: {
          roomid: this.roomId
        }
      })
      ElMessage.success('直播已结束')
    },

    /** 嘉宾申请上麦 */
    async onGuestApply () {
      await this.$store.dispatch({
        type: 'live/applyLive',
        payload: {
          roomid: this.roomId
        }
      })
      ElMessage.success('上麦申请已发送')
    },

    /** 嘉宾开始上麦 */
    onGuestStart () {
      this.$store.dispatch({
        type: 'live/guestStartLive',
        payload: {
          roomid: this.roomId
        },
        callback: () => ElMessage.success('上麦成功')
      })

      this.trtcClient.client.publish(this.trtcClient.stream)
      .then(async () => {
        console.log('success for guest to publish stream~~~~~') 

        this.$store.commit('live/setState', [{
          key: 'liveStart',
          value: true
        },{
          key: 'liveStreamList',
          value: [...this.live.liveStreamList, Object.assign(this.trtcClient.stream, {
            isOpenMic: false,
            isOpenCamera: true
          })]
        }])

        this.mainStreamList = this.filterLiveStream()
        // 嘉宾上麦默认静音
        this.trtcClient.stream.muteAudio()
        await this.trtcClient.stream.stop()
        this.$nextTick(() => {
          this.tryToPlayStream(this.trtcClient.stream, `live_stream_${this.trtcClient.stream.userId_}`, {
            muted: true
          })
        })
      }, (err) => {
        ElMessage.error('上麦失败')
        console.warn('fail for guest to publish stream', err)
      })
    },

    /** 嘉宾下麦 */
    async onGuestStop () {
      
      this.trtcClient.client.unpublish(this.trtcClient.stream)
      this.trtcClient.stream.stop()
      this.$store.commit('live/setState', [{
        key: 'liveStreamList',
        value: this.live.liveStreamList.filter(({ userId_ }) => userId_ !== this.trtcClient.stream.userId_)
      }])
      this.mainStreamList = this.filterLiveStream()

      await this.$store.dispatch({
        type: 'live/guestStopLive',
        payload: {
          roomid: this.roomId,
          memberid: this.user.userInfo?.imAccount
        }
      })
      ElMessage.success('您已下麦')
    },

    onLiveStreamMouse (type, item) {
      item.maskShow = type
    },

    /** custom stream attribute before create */
    customStream (stream, config) {
      // can i use __proto__ here ?
      Object.entries(config).forEach(([key, value]) => {
        stream.__proto__[key] = value
      })
      return stream
    },

    /** try to play & handle error */
    tryToPlayStream (stream, target, options={}) {
      stream.play(target, options).then(()=>{
        console.log('yes!!! success to play remote stream')
      }, (err) => {
        const errorCode = err?.getCode?.();
        if (errorCode === 0x4043) {
          // TODO PLAY_NOT_ALLOWED,引导用户手势操作并调用 stream.resume 恢复音视频播放
          // stream.resume()
        } 
      })
    }

  },
};
</script>
<style lang="scss" scoped>
.ofweek-live-container {
  .remote-view {
    background: #2C2C2C;
    .wrap-item {
      position: relative;
      margin: 10px 0 10px 10px;
      width: calc((100% - 10px * 6) / 5);
      .stream-mask{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        background: #000;
        padding: 0 10px;
        .mask-header{
          margin: 10px 0 25px 0;
          color:#fff;
          font-size: 14px;
        }
        .mask-menu{}
      }
      .icon {
        display: inline-block;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin-left: 10px;
        background-color:#333333;
        &:first-child{
          margin-left: 0;
        }
        &.active{
          background-color:#E65E50;
        }
      }
    }
  }
  .live-main-view {
    background: red;
    height: calc(100% * 9 / 16)
  }
}
</style>
