<template>
  <div class="ofweek-live-container flex-column">
    <MediaCheck
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="user.userInfo"
      @btn-click="handleMediaSel"
    />
    <div v-if="filterLiveStream().length" class="remote-view flex">
      <div class="wrap-item" v-for="(item) in filterLiveStream()" :key="item.userId">
        <div :id="`live_stream_${item.userId_}`"></div>
      </div>
    </div>
    <div class="ppt-view"></div>
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
          console.log('members.......', members)
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
      this.trtcClient?.offClient("stream-added", this.onStreamAdded);
      this.trtcClient?.offClient("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.offClient("stream-removed", this.onStreamRemoved);
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event?.anchor?.start,this.onAnchorStart)
      eventEmitter.on(eventEmitter.event?.anchor?.invite,this.onAnchorInvite)
      eventEmitter.on(eventEmitter.event?.anchor?.stop,this.onAnchorStop)
      eventEmitter.on(eventEmitter.event?.guest?.start,this.onGuestStart)
      eventEmitter.on(eventEmitter.event?.guest?.apply,this.onGuestApply)
      eventEmitter.on(eventEmitter.event?.guest?.stop,this.onGuestStop)
      this.imClient?.on(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.onClient("stream-added", this.onStreamAdded);
      this.trtcClient?.onClient("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.onClient("stream-removed", this.onStreamRemoved);
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
                ElMessage.warn(`${payloadData.anthorNick}拒绝了您的上麦申请`)
              }
            },

            // 处理上麦邀请消息
            1714: () => {
              if (String(payloadData.adminId) !== String(this.user?.userInfo?.imAccount)) {
                return
              }
              ElMessage[payloadData.isAgree ? 'success' : 'fail'](`${payloadData.guestNick}${payloadData.isAgree ? 
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
              debugger
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
      this.$store.commit('live/setState', [{
        key: 'liveStreamList',
        value: [...this.live.liveStreamList, stream]
      },{            
          key: 'liveStart',
          value: true                        
      }])

      //  ignore current speaker & play remote stream to main stream view
      if (!this.live.liveSpeaker?.userId) {
        const { data } = await this.$store.dispatch({
          type: 'live/getMembers',
          payload: {
            roomid: this.roomId
          }
        })
        isSpeaker = String(data.find(({ isMainSpeaker }) => isMainSpeaker).memberId) === String(stream.userId_)
      } else {
        isSpeaker = String(this.live.liveSpeaker?.userId) === String(stream.userId_)
      }
      this.$nextTick(() => {
        !isSpeaker && stream.play(`live_stream_${stream.userId_}`)
      })
    },

    onStreamRemoved() {},

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
        callback: () => ElMessage.success('上麦成功')
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
          value: [...this.live.liveStreamList, this.trtcClient.stream]
        }])   

      }, (err) => {
        ElMessage.error('上麦失败')
        console.warn('fail for anchor to publish stream', err)
      })            
    },

    /** 主播邀请直播 */
    async onAnchorInvite () {},

    /** 主播结束直播 */
    async onAnchorStop () {
      await this.$store.dispatch({
        type: 'live/stopLive',
        payload: {
          roomid: this.roomId
        }
      })
      this.trtcClient.client.unpublish()
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
      this.trtcClient.client.publish(this.trtcClient.stream).then(async () => {
        console.log('success for guest to publish stream~~~~~') 
        this.$store.commit('live/setState', [{
          key: 'liveStart',
          value: true
        },{
          key: 'liveStreamList',
          value: [...this.live.liveStreamList, this.trtcClient.stream]
        }])
        await this.trtcClient.stream.stop()
        this.$nextTick(() => {
          this.trtcClient.stream.play(`live_stream_${this.trtcClient.stream.userId_}`)
        })
      }, (err) => {
        ElMessage.error('上麦失败')
        console.warn('fail for guest to publish stream', err)
      })
    },

    /** 嘉宾下麦 */
    async onGuestStop () {
      await this.$store.dispatch({
        type: 'live/guestStopLive',
        payload: {
          roomid: this.roomId,
          memberid: this.user.userInfo?.imAccount
        }
      })
      this.trtcClient.client.unpublish()
      ElMessage.success('您已下麦')
    }

  },
};
</script>
<style lang="scss" scoped>
.ofweek-live-container {
  height: 460px;
  .remote-view {
    flex-basis: 150px;
    height: 150px;
    background: #2C2C2C;
    .wrap-item {
      background: #000;
      .icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #333333;
      }
    }
  }
}
</style>
