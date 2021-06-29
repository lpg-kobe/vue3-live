<template>
  <div class="container_tiem">
    <div class="live-box">
      <videos :placeType="placeType"/>
      <live-ppt v-show="showPpt && liveStatus === 2" :placeType="placeType"/>
    </div>

    <div class="place-change" @click="handlePlace" v-show="showPpt && isOpenLive"></div>

    <div class="share">
      <!-- <share-bar v-if="room.isPcShare === null || room.isPcShare === 1"></share-bar> -->
    </div>

  </div>
</template>

<script>
import videos from './video.vue'
import livePpt from './ppt.vue'
import shareBar from './shareBar.vue'
import { mapGetters } from 'vuex'
export default {
  name: 'liveBox',
  data () {
    return {
      placeType: 2,
    }
  },
  components: {
    videos,
    shareBar,
    livePpt
  },
  computed: {
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      liveStatus: 'room/liveStatus',
      isOpenLive: 'room/isOpenLive',
      isOpenInsert: 'room/isOpenInsert',
      isOpenSpeech: 'room/isOpenSpeech'
    }),
    showPpt () {
      return this.isOpenSpeech && this.isOpenLive || this.isOpenInsert
    }
  },
  methods: {
    handlePlace () {
      this.placeType = this.placeType === 1 ? 2 : 1
    },
    transPlaceType (isOpenLive, isOpenSpeech, isOpenInsert) {
      if (this.liveStatus !== 2) {
        return 2
      }
      if (isOpenLive) {
        if (isOpenSpeech) {
          if (isOpenInsert) {
            return 1
          } else {
            return 1
          }
        } else {
          if (isOpenInsert) {
            return 1
          } else {
            return 2
          }
        }
      } else {
        if (isOpenSpeech) {
          if (isOpenInsert) {
            return 1
          } else {
            return 2
          }
        } else {
          if (isOpenInsert) {
            return 1
          } else {
            return 2
          }
        }
      }
    }
  },
  created () {
    // this.$EventBus.$on('changePlaceType', (type) => {
    //   this.placeType = type
    // })
  },
  mounted () {
    this.placeType = this.transPlaceType(this.isOpenLive, this.isOpenSpeech, this.isOpenInsert)
  },
  watch: {
    // placeType === 2 直播视频在左
    isOpenSpeech (val) {
      this.placeType = this.transPlaceType(this.isOpenLive, val, this.isOpenInsert)
    },
    isOpenInsert (val) {
      this.placeType = this.transPlaceType(this.isOpenLive, this.isOpenSpeech, val)
      console.log(this.placeType)
    },
    isOpenLive (val) {
      this.placeType = this.transPlaceType(val, this.isOpenSpeech, this.isOpenInsert)
    }
  }
}
</script>

<style lang="scss">
.live-box {
  position: relative;
  width: 820px;
  height: 460px;
}
.place-change {
  position: absolute;
  right: 312px;
  top: 38px;
  width: 28px;
  height: 28px;
  border-radius: 28px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 12;
  text-align: center;
  line-height: 28px;
  cursor: pointer;

  &::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    background: url(../../assets/switch_icon2.png) no-repeat;
    background-size: contain;
    vertical-align: middle;
  }
}

.live_control {
  position: absolute;
  left: 0;
  top: 0;
  width: 820px;
  height: 460px;
  z-index: 7;

  ul {
    position: absolute;
    left: 0;
    top: 0;
    width: 80px;
    height: 100%;
    background: #424242;

    li {
      text-align: center;
      margin-top: 30px;

      &:first-child {
        margin-top: 26px;
      }

      span {
        display: block;
        font-size: 14px;
        color: #fff;
        margin-top: 13px;
      }
    }
    .pointer_li {
      cursor: pointer;

      img {
        height: 22px;
      }

      span {
        margin-top: 10px;
      }
    }
  }
}
.speech_control {
  position: absolute;
  left: 335px;
  bottom: 10px;
  // transform: translateX(-50%);
  // width: 150px;
  height: 32px;
  padding: 0 10px;
  line-height: 32px;
  text-align: center;
  color: #1F1F1F;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.5);
  user-select: none;

  .speech_next, .speech_prev {
    font-size: 16px;
    padding: 5px;
    cursor: pointer;
  }
  .speech_page {
    display: inline-block;
    font-size: 18px;
    min-width: 70px;
  }

  &.place-small {
    left: 945px;
    bottom: 277px;
  }
}
.close_speech {
  position: absolute;
  right: 20px;
  top: 20px;
  display: inline-block;
  min-width: 58px;
  height: 28px;
  padding: 0 11px;
  font-size: 14px;
  color: #fff;
  line-height: 28px;
  text-align: center;
  border-radius: 28px;
  border: 1px solid #E65E50;
  background: #E65E50;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &.place-small {
    right: -360px;
  }
}
</style>
