<template>
  <div class="ofweek-live-container">
    <nav>
      <el-button type="primary" @click="startMixStream">开始直播</el-button>
      <el-button>申请上麦</el-button>
      <el-button @click="mediaSelVisible = true">媒体设置</el-button>
    </nav>
    <MediaCheck
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="userInfo"
      @btn-click="handleMediaSel"
    />
  </div>
</template> 

<script>
import { mapState } from "vuex";
import { IM_EVENT } from "../../../sdk/imLive";
import MediaCheck from "./mediaCheck.vue";

export default {
  name: "live",

  components: {
    MediaCheck,
  },

  data() {
    return {
      streamList: [],
      mediaSelVisible: true,
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
      members: ({ live: { members } }) => members,
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
              roomId: Number(his.roomId),
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
      const mixUsers = this.members.map(({ memberId }) => ({
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
      this.imClient?.off(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.offClient("stream-added", this.onStreamAdded);
      this.trtcClient?.offClient("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.offClient("stream-removed", this.onStreamRemoved);
    },

    bindEvent() {
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
          console.log(payloadData);
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

    /** success to get remote stream to play */
    onGetRemoteStream(event) {
      const { stream: remoteStream } = event;
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
}
</style>
