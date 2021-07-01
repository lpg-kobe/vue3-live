<template>
  <div>
    <div v-if="initFinish">
      <!-- <mp-card></mp-card> -->
      <heads/>

      <div class="wrap main_container">

        <div class="main_left">
          <live-box/>
          <img-text/>
        </div>

        <div class="main_right">
          <div v-if="showPpt && isOpenLive" class="container_tiem guichet-wrap"></div>
          <chat/> 
          <!-- <photo-live-box/> -->
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import heads from '../../components/header/index.vue'
import liveBox from '../../components/live/index.vue'
import imgText from '../../components/imgText/index.vue'
import chat from '../../components/chat/index.vue'
// import mpCard from '../../components/header/mpCard.vue'
// import photoLiveBox from '../../components/chat/photoLiveBox.vue'
import { mapGetters } from 'vuex'
import Cookies from 'js-cookie'
import { sendWebsocket, closeWebsocket, websocketSend } from '../../utils/websocket.js'
export default {
  name: 'layout',
  data () {
    return {
      initFinish: false
    }
  },
  components: {
    heads,
    liveBox,
    imgText,
    chat,
    // mpCard,
    // photoLiveBox
  },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
      user: 'user/user',
      isOpenLive: 'room/isOpenLive',
      isOpenInsert: 'room/isOpenInsert',
      isOpenSpeech: 'room/isOpenSpeech'
    }),
    // showPpt () {
    //   return this.isOpenSpeech && this.isOpenLive || this.isOpenInsert
    // }
  },
  methods: {
    wsMessage (data) {
      console.log(data.data)
    },
    wsError () {
      console.log('ws链接失败')
    },
    requstWs () {
      closeWebsocket()
      let query = {
        groupid: String(this.roomId),
        memberid: String(this.user.imAccount),
        type: '2',
        token: Cookies.get('userToken')
      }
      // 发起ws请求
      sendWebsocket( query, this.wsMessage, this.wsError)
      setInterval(() => {
        websocketSend('ping')
      }, 5*1000);
    }
  },
  async created () {
     await this.$store.dispatch({
        type: "room/entryroom",
        payload: {roomid: this.roomId, v: (new Date).getTime()},
        callback: () => {
         
        }
      });
     await this.$store.dispatch({
        type: "room/getroom",
        payload: {roomid: this.roomId}
      });
      this.initFinish = true
      this.requstWs()
  },
  destroyed () {
    // 销毁监听
    closeWebsocket()
  }
}
</script>

<style lang="scss">
.main_container {
  position: relative;

  .main_left {
    float: left;
    width: 820px;
  }

  .main_right {
    float: right;
    width: 360px;
  }

  .container_tiem {
    margin-top: 20px;
    background: #fff;
  }
  .guichet-wrap {
    width: 360px;
    height: 203px;
  }
}
</style>
