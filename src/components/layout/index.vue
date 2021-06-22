<template>
  <header>
      <el-button type="primary" @click="start">开始直播</el-button>
      <el-button @click="stop">结束直播</el-button>
      <el-button type="primary" @click="apply">申请上麦</el-button>
      <el-button @click="offLine">下麦</el-button>
      <el-button>媒体设置</el-button>
  </header>
  <main>
    <section class="section-l">
      <router-view />
      <div class="menu"></div>
    </section>
    <section class="section-r">
      <thumb-view v-if="liveStart"></thumb-view>
    </section>
  </main>
</template>

<script>
import { mapState } from 'vuex'
import { ElMessage } from 'element-plus'
import ThumbView from '../../views/home/components/thumbView.vue'
import { eventEmitter } from '../../utils/event'

export default {
  name: "layout",

  components: {
    ThumbView
  },

  computed: {
    ...mapState({
      userInfo: ({ user: { userInfo } }) => userInfo,
      liveStart: ({ live: { liveStart } }) => liveStart,
      trtcClient: ({ trtcClient }) => trtcClient,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  methods: {
    start () {
      this.$store.dispatch({
       type: 'room/getroom',
       payload: {
         roomid: this.roomId
       },
       callback: ({ myStreamId }) => {
         eventEmitter.emit(eventEmitter.event?.live?.start)
         this.$store.dispatch({
            type: 'live/startLive',
            payload: {
              roomid: this.roomId,
              streamid: myStreamId,
              streamtype: 1
            },
            callback: () => {
              ElMessage.success('上麦成功') 
            }
          })
       }
     })
    },
    
    stop() {
      this.$store.dispatch({
        type: 'live/stopLive',
        payload: {
          roomid: this.roomId
        },
        callback: () => {
          this.trtcClient.client.unpublish()
          ElMessage.success('直播已结束')
        }
      })
    },

    apply () {
      this.$store.dispatch({
       type: 'live/applyLive',
       payload: {
         roomid: this.roomId
       },
       callback: () => {
         ElMessage.success('上麦申请已发送')
       }
     })
    },

    offLine () {
      this.$store.dispatch({
       type: 'live/guestStopLive',
       payload: {
         roomid: this.roomId,
         memberid: this.userInfo?.imAccount
       },
       callback: () => {
          ElMessage.success('success')
       }
     })
    }
  }
};
</script>

<style lang="scss" scoped>
header {
  height: 48px;
  background: #000;
  margin-bottom: 12px;
}

main {
  width: 1200px;
  display: flex;
  min-height: 520px;
  margin: 0 auto;
}

.section-l {
  flex: 1;
}

.section-r {
  width: 352px;
  flex-basis: 352px;
  margin-left: 12px;
  background: #000;
}

.menu {
  height: 240px;
  background: #000;
}
</style>