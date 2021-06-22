<template>
  <div class="ofweek-live-container flex-column">
    <MediaCheck
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="userInfo"
      @btn-click="handleMediaSel"
    />
    <div v-if="liveRemoteList.length" class="remote-view flex">
      <div class="wrap-item" v-for="(item,index) in liveRemoteList" :key="index"></div>
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
      streamList: [],
      mediaSelVisible: false,
      applyShow: false,
      applyMsg: {},
      applyTimer: null,
      inviteShow: false,
      inviteMsg: {},
      inviteTimer: null
    };
  },

  created() {
    this.unbindEvent();
    this.bindEvent();
    this.joinTrtc();
    this.initRoom();
  },

  computed: {
    ...mapState({
      userInfo: ({ user: { userInfo } }) => userInfo,
      liveMembers: ({ live: { liveMembers } }) => liveMembers,
      liveRemoteList: ({ live: { liveRemoteList } }) => liveRemoteList,
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

    // init room status
    initRoom() {
      this.$store.dispatch({
        type: "live/getMembers",
        payload: {
          roomid: this.roomId,
        },
        callback: () => {},
      });
    },

    // ready to mix stream of users in room
    startMixStream() {
      const videoRate = 9 / 16;
      const mixUsers = this.liveMembers.map(({ memberId }) => ({
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
              if (String(payloadData.auditerId) !== String(this.userInfo.imAccount)) {
                return 
              }
              if (payloadData.isAgree) {
                ElMessage.success(`${payloadData.anthorNick}同意了您的上麦申请`)
              } else {
                ElMessage.warn(`${payloadData.anthorNick}拒绝了您的上麦申请`)
              }
            },

            // 处理上麦邀请消息
            1714: () => {
              if (String(payloadData.adminId) !== String(this.userInfo.imAccount)) {
                return
              }
              ElMessage[payloadData.isAgree ? 'success' : 'fail'](`${payloadData.guestNick}${payloadData.isAgree ? 
              '同意' : '拒绝'}了您的上麦邀请`)
            },

            // 开始直播
            1722: () => {
              debugger
            },

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
      const { stream: remoteStream } = event;
      this.trtcClient.client
        .subscribe(remoteStream, { audio: true, video: true })
        .then(
          () => {
            console.log("some one publish stream");
          },
          () => {
            console.error("failed to subscribe remoteStream");
          }
        );
    },

    /** admin of room ready to start live */
    onLiveStart(){
      
    },

    /** success to get remote stream to play */
    onGetRemoteStream(event) {
      debugger
      const { stream: remoteStream } = event;
      this.$store.commit('live/setState', {
        key: 'liveRemoteList',
        value: [...liveRemoteList, remoteStream]
      })
      // remoteStream.play();
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
