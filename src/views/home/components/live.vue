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
  </div>
</template> 

<script>
import { mapState } from "vuex";
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
          const codeAction = {
            // 邀请直播
            1706:() => {
              debugger
            },
            // 申请上麦
            1710:() => {
              debugger
            },
            // 处理上麦申请
            1712:() => {
              debugger
            },
            // 处理上麦邀请
            1714:() => {
              debugger
            },
            // 开始直播
            1722:() => {
              debugger
            },
            // 结束直播
            1723:() => {
              debugger
            },
            // 嘉宾上麦
            1726:() => {
              debugger
            },
            // 嘉宾下麦
            1727:() => {
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
