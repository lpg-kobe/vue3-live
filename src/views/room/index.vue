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
import heads from '../../components/layout/header/index.vue'
import liveBox from './components/live/index.vue'
import thumbView from './components/thumbView/index.vue'
import imgText from './components/imgText/index.vue'
import chat from './components/chat/index.vue'
// import mpCard from './components/header/mpCard.vue'
// import photoLiveBox from './components/chat/photoLiveBox.vue'
import Cookies from 'js-cookie'
import {
  sendWebsocket,
  closeWebsocket,
  websocketSend,
} from '../../utils/websocket.js'
import { mapState } from 'vuex'

export default {
  name: 'room',
  data() {
    return {
      initFinish: false,
      query: null,
      timer: null,
      reconnectTimer: null,
    }
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
    this.bindEvent()
    this.initRoom()
  },

  methods: {
    bindEvent() {
      window.onbeforeunload = () => {
        console.log('onbeforeunload')
        clearInterval(this.timer)
        clearInterval(this.reconnectTimer)
        closeWebsocket()
      }
    },

    wsMessage(data) {
      console.log(data.data)
    },

    wsError() {
      clearInterval(this.timer)
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = setTimeout(() => {
        this.requstWs()
      }, 3 * 1000)
    },

    websocketOpen() {
      // 每隔5秒发一次心跳
      this.timer = setInterval(() => {
        websocketSend('ping')
      }, 5 * 1000)
    },

    requstWs() {
      closeWebsocket()
      this.query = {
        groupid: String(this.roomId),
        memberid: String(this.user.user.imAccount),
        type: '2',
        token: Cookies.get('userToken'),
      }
      // 发起ws请求
      sendWebsocket({
        query: this.query,
        successCallback: this.wsMessage,
        errCallback: this.wsError,
        openCallback: this.websocketOpen,
      })
    },

    async initRoom() {
      this.$store.commit('room/setState', [
        {
          key: 'roomId',
          value: this.roomId,
        },
      ])
      await this.$store.dispatch({
        type: 'room/entryroom',
        payload: { roomid: this.roomId, v: new Date().getTime() },
        callback: () => {},
      })
      await this.$store.dispatch({
        type: 'room/getroom',
        payload: { roomid: this.roomId },
      })
      this.initFinish = true
      this.requstWs()
    },
  },

  beforeDestroy() {
    closeWebsocket()
  },
}
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
