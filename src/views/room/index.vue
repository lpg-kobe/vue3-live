<template>
  <div v-if="initFinish" class="ofweek-room-container">
    <!-- <mp-card></mp-card> -->
    <heads />

    <main class="wrap clearfix">
      <section class="section-l">
        <live-box class="wrap-container" v-if="room.room.status === 1" />
        <img-text />
      </section>

      <section class="section-r">
        <thumb-view class="wrap-container" v-if="live.liveStart"></thumb-view>
        <chat />
        <!-- <photo-live-box/> -->
      </section>
    </main>
  </div>
</template>

<script>
import heads from "../../components/layout/header/index.vue";
import liveBox from "./components/live/index.vue";
import thumbView from "./components/thumbView/index.vue";
import imgText from "./components/imgText/index.vue";
import chat from "./components/chat/index.vue";
// import mpCard from './components/header/mpCard.vue'
// import photoLiveBox from './components/chat/photoLiveBox.vue'
import Cookies from "js-cookie";
import OfweekSocket from "../../utils/websocket.js";
import { mapState } from "vuex";
import { loopToInterval } from "../../utils/tool";

export default {
  name: "room",
  data() {
    return {
      initFinish: false,
      query: null,
      socket: null,
      heartbeatTimer: null,
    };
  },
  components: {
    heads,
    liveBox,
    thumbView,
    imgText,
    chat,
    // mpCard,
    // photoLiveBox
  },

  computed: {
    ...mapState({
      user: ({ user }) => user,
      live: ({ live }) => live,
      room: ({ room }) => room,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },

  created() {
    this.bindEvent();
    this.initRoom();
  },

  methods: {
    bindEvent() {
      window.onbeforeunload = () => {
        console.log("onbeforeunload");
      };
    },

    requstWs() {
      this.query = {
        groupid: String(this.roomId),
        memberid: String(this.user.user.imAccount),
        type: "2",
        token: Cookies.get("userToken"),
        sendRate: 1 * 1000,
      };
      this.socket = new OfweekSocket(this.query);
      // 直播状态取决于socket连接
      this.socket.on(this.socket.code["XXX"], () => {
        this.live.liveSocketStatus &&
          this.$store.commit("live/setState", {
            key: "liveSocketStatus",
            value: 0,
          });
      });
      this.socket.on(this.socket.code["200"], () => {
        !this.live.liveSocketStatus &&
          this.$store.commit("live/setState", {
            key: "liveSocketStatus",
            value: 1,
          });
      });
    },

    /**发送房间用户心跳 */
    sendRoomHeartbeat() {
      loopToInterval(
        () => {
          return this.$store.dispatch({
            type: "room/roomHeartbeat",
            payload: {
              memberId: this.user.user.imAccount,
              roomId: this.roomId,
            },
          });
        },
        this.heartbeatTimer,
        8 * 1000
      );
    },

    async initRoom() {
      let result = {};
      result = await this.$store.dispatch({
        type: "room/entryroom",
        payload: { roomid: this.roomId, v: new Date().getTime() },
        callback: () => {},
      });

      result = await this.$store.dispatch({
        type: "room/getroom",
        payload: { roomid: this.roomId },
        callback: ({ manyLiveStatus }) => {
          this.$store.commit("live/setState", [
            {
              key: "liveStart",
              value: Boolean(manyLiveStatus),
            },
          ]);
        },
      });

      if (!result.status) {
        return;
      }

      this.initFinish = true;
      this.requstWs();
      this.sendRoomHeartbeat();
    },
  },
};
</script>

<style lang="scss">
.ofweek-room-container {
  .section-l {
    width: calc(100% - 12px - 360px);
    float: left;
  }

  .section-r {
    position: relative;
    float: left;
    width: 360px;
    margin-left: 12px;
  }
}

.wrap-container {
  margin-top: 12px;
  background: #fff;
}
</style>
