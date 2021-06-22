<template>
  <div class="ofweek-live-container flex-column">
    <MediaCheck
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="user.userInfo"
      @btn-click="handleMediaSel"
    />
    <div v-if="mainStreamList.length" class="remote-view flex">
      <div class="wrap-item" v-for="(item) in mainStreamList" :key="item.userId">
        <div :id="`remote_${item.userId}`"></div>
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
      mainStreamList: [],
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

    // init live data before do anything
    initLive() {
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
      eventEmitter.off(eventEmitter.event?.live?.start,this.onLiveStart)
      this.imClient?.off(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.offClient("stream-added", this.onStreamAdded);
      this.trtcClient?.offClient("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.offClient("stream-removed", this.onStreamRemoved);
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event?.live?.start,this.onLiveStart)
      this.imClient?.on(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.onClient("stream-added", this.onStreamAdded);
      this.trtcClient?.onClient("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.onClient("stream-removed", this.onStreamRemoved);
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i];
          const payloadData = JSON.parse(msg.payload?.data);
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
                this.initGuestLive()
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
              debugger
            },

            // 嘉宾上麦
            1726: () => {
              debugger
            },

            // 嘉宾下麦
            1727: () => {
              debugger
            },
          }
          codeAction[msgCode]?.()
        }
      } catch (err) {
        console.warn("fail to pass msg of im");
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
    onGetRemoteStream(event) {
      console.log('liveSpeaker.....', this.liveSpeaker)
      this.$store.commit('live/setState', {
        key: 'liveRemoteList',
        value: [...live.liveRemoteList, event.stream]
      })

      //  filter current speaker to thumb & play remote stream to main stream view
      // if(!this.live.liveSpeaker){
      //   this.$store.dispatch({
      //     type: 'live/getMembers',
      //     payload: {
      //       roomid: this.roomId
      //     },
      //     callback: (members) => {
      //       const speaker = members.find(({ isMainSpeaker }) => isMainSpeaker) || {}
      //       this.mainStreamList = this.liveRemoteList.filter
      //       this.$store.commit('live/setState', {
      //         key: 'liveSpeaker',
      //         value: {
      //           ...speaker,
      //           userId: speaker.memberId,
      //         }
      //       })
      //     }
      //   })
      // } else {
      //   this.mainStreamList = this.liveRemoteList.filter(({
      //      userId
      //   }) => String(userId) !== String(this.live.liveSpeaker.userId))
      // }
      // stream.play();
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

    /** 主播开始直播 */
    onLiveStart () {
      // publish & mix
      this.trtcClient.client.publish(this.trtcClient.stream).then(() => {
        console.log('success for anchor to publish stream~~~~~')            

        this.$store.commit('live/setState', [{            
          key: 'liveStart',
          value: true                        
        }])          
        this.$nextTick(async () => {
          await this.trtcClient.stream.stop()
          this.trtcClient.stream.play(this.live.liveThumbId)
        })

      }, (err) => {
        ElMessage.error('上麦失败')
        console.warn('fail for anchor to publish stream', err)
      })            
    },

    /** 嘉宾开始上麦 */
    initGuestLive () {
      this.trtcClient.client.publish(() => {
        console.log('success for guest to publish stream~~~~~') 
      }, (err) => {
        ElMessage.error('上麦失败')
        console.warn('fail for guest to publish stream', err)
      })
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
