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
import { sendWebsocket, closeWebsocket, websocketSend } from '../../utils/websocket.js'
import { mapState } from 'vuex'

export default {
  name: 'room',
  data() {
    return {
      initFinish: false,
      query: null
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
    this.initRoom()
  },

  methods: {
    wsMessage (data) {
      console.log(data.data)
    },
    wsError () {
      sendWebsocket( this.query, this.wsMessage, this.wsError)
    },
    requstWs () {
      closeWebsocket()
      this.query = {
        groupid: String(this.roomId),
        memberid: String(this.user.user.imAccount),
        type: '2',
        token: Cookies.get('userToken')
      }
      // 发起ws请求
      sendWebsocket( this.query, this.wsMessage, this.wsError)
      // 每隔5秒发一次心跳
      setInterval(() => {
        websocketSend('ping')
      }, 5*1000);
    },
    async initRoom() {
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
    destroyed () {
      // 销毁监听
      closeWebsocket()
    }
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
