<template>
  <div
    class="ofweek-speaker live-speaker-container"
    ref="speakerRef"
    @mouseover="onLiveStreamMouse(1)"
    @mouseout="onLiveStreamMouse(0)"
  >
    <div id="speakerId"></div>
    <div class="controll-layer">
      <!-- <i class="icon icon-switch" @click="handleIconClick('switch')"></i> -->
      <i
        class="icon icon-full-screen"
        @click="handleIconClick('screen')"
        title="全屏"
      ></i>
      <label class="label-name">{{ speaker.nick }}</label>
    </div>
    <stream-mask v-show="speakerMaskShow" :stream="speaker" />
  </div>
</template>

<script>
/** 互动直播主讲人控件 */
import { mapState } from 'vuex'
import { eventEmitter } from '../../../utils/event'
import { exitFullScreen, fullScreenEle } from '../../../utils/tool'
import StreamMask from './streamMask.vue'

export default {
  name: 'mainSpeaker',
  components: {
    StreamMask,
  },
  created() {
    this.unbindEvent()
    this.bindEvent()
  },
  data() {
    return {
      speakerMaskShow: false,
      speaker: {},
      isFullScreen: false,
    }
  },
  computed: {
    ...mapState({
      live: ({ live }) => live,
      user: ({ user }) => user,
    }),
  },
  watch: {
    'live.liveSpeaker.userId': {
      handler: async function (nVal, oVal) {
        const oldSpeaker = this.live.liveStreamList.find(
          ({ userId_ }) => String(userId_) === String(oVal)
        )
        const newSpeaker = this.live.liveStreamList.find(
          ({ userId_ }) => String(userId_) === String(nVal)
        )
        this.speaker = Object.assign(newSpeaker, {
          nick: this.live.liveMembers.find(
            ({ memberId }) => String(memberId) === String(newSpeaker?.userId_)
          )?.nick,
        })
        // old stream must stop & replay in new dom if it has been play in other dom
        await oldSpeaker?.stop()
        await newSpeaker?.stop()
        this.$nextTick(() => {
          oldSpeaker?.play(`live_stream_${oldSpeaker.userId_}`)
        })
        newSpeaker?.play('speakerId')
      },
      immediate: true,
    },
  },
  methods: {
    unbindEvent() {
      eventEmitter.off(eventEmitter.event.live.toggleMedia, this.onToggleMedia)
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event.live.toggleMedia, this.onToggleMedia)
    },

    /**
     * @desc 直播间切换媒体设备开关
     * @param {type:String,userId:String,isOpenMic:Boolean,isOpenCamera:Boolean} Object
     */
    onToggleMedia({ data: { type, userId, isOpenMic, isOpenCamera } }) {
      const isMicToggle = type === 'mic'
      const targetIsSpeaker =
        String(userId) === String(this.live.liveSpeaker.userId)
      if (!targetIsSpeaker) {
        return
      }
      this.speaker = Object.assign(this.speaker, {
        isOpenMic: isMicToggle ? isOpenMic : this.speaker.isOpenMic,
        isOpenCamera: !isMicToggle ? isOpenCamera : this.speaker.isOpenCamera,
      })
    },

    onLiveStreamMouse(visible) {
      const { role, imAccount } = this.user.user
      const isSelf = String(imAccount) === String(this.speaker.userId_)
      if ((role !== 1 && !isSelf) || this.isFullScreen) {
        return
      }
      this.speakerMaskShow = visible
    },

    handleIconClick(menu) {
      const actionMap = {
        screen: () => {
          if (!this.isFullScreen) {
            this.isFullScreen = true
            this.speakerMaskShow = false
            fullScreenEle(this.$refs.speakerRef)
          } else {
            this.isFullScreen = false
            exitFullScreen(this.$refs.speakerRef)
          }
        },
        switch: () => {},
      }
      actionMap[menu]?.()
    },
  },
}
</script>

<style lang="scss" scoped>
.ofweek-speaker {
  .controll-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .label-name {
      font-size: 14px;
      color: #fff;
      position: absolute;
      left: 10px;
      bottom: 10px;
    }

    .icon {
      z-index: 10;
      cursor: pointer;
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      background: url(../../../assets/img/live/i-full.png) no-repeat center/100%;
      &.icon-switch {
        background: url(../../../assets/img/live/i-switch.png) no-repeat
          center/100%;
        right: unset;
        left: 10px;
        bottom: unset;
        top: 10px;
      }
    }
  }
}
</style>