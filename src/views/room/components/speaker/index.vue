<template>
  <div
    class="ofweek-speaker live-speaker-container"
    ref="speakerRef"
    @mouseenter="onLiveStreamMouseEnter"
    @mouseleave="onLiveStreamMouseLeave"
    v-if="speaker"
  >
    <div id="speakerId"></div>
    <!--default cover-->
    <div class="stream-cover" v-show="!speaker.isOpenCamera">
      <Img :src="speaker.headUrl" alt="cover" />
    </div>
    <div class="controll-layer">
      <!-- <i class="icon icon-switch" @click="handleIconClick('switch')"></i> -->
      <i
        class="icon icon-full-screen"
        @click="handleIconClick('screen')"
        title="全屏"
      ></i>
    </div>
    <div class="stream-label">
      <label class="label-name">{{ speaker.nick }}</label>
    </div>
    <stream-mask
      v-show="speaker.maskShow"
      :member="speaker"
      @menu-click="handleSpeakerMaskClick"
    />
  </div>
  <div class="speaker-empty" v-show="!speaker">
    <p>暂无主讲人</p>
  </div>
</template>

<script>
/** 互动直播主讲人控件 */
import { mapState } from "vuex";
import { eventEmitter } from "../../../../utils/event";
import { exitFullScreen, fullScreenEle } from "../../../../utils/tool";
import Img from "../../../../components/img/index.vue";
import streamMask from "../streamMask.vue";

export default {
  name: "mainSpeaker",
  components: {
    streamMask,
    Img,
  },
  created() {
    this.unbindEvent();
    this.bindEvent();
  },
  data() {
    return {
      isFullScreen: false,
    };
  },
  computed: {
    speaker: ({ live }) =>
      live.liveMembers?.find(({ isMainSpeaker }) => isMainSpeaker),
    ...mapState({
      live: ({ live }) => live,
      user: ({ user }) => user,
    }),
  },

  methods: {
    unbindEvent() {
      eventEmitter.off(eventEmitter.event.live.toggleMedia, this.onToggleMedia);
      this.$nextTick(() => {
        this.$refs.speakerRef?.removeEventListener(
          "fullscreenchange",
          this.onFullScreenChange
        );
      });
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event.live.toggleMedia, this.onToggleMedia);
      this.$nextTick(() => {
        this.$refs.speakerRef?.addEventListener(
          "fullscreenchange",
          this.onFullScreenChange
        );
      });
    },

    /**
     * @desc 直播间切换媒体设备开关 1、用户自行切换 2、主播推送嘉宾切换
     * @param {type:String,userId:String,isOpenMike:Boolean,isOpenCamera:Boolean} Object
     */
    onToggleMedia({ data: { type, userId, isOpenMike, isOpenCamera } }) {
      const isMicToggle = type === "mic";
      const targetIsSpeaker =
        String(userId) === String(this.live.liveSpeaker.userId);
      if (!targetIsSpeaker) {
        return;
      }
      this.speaker = Object.assign(this.speaker, {
        isOpenMike: isMicToggle ? isOpenMike : this.speaker.isOpenMike,
        isOpenCamera: !isMicToggle ? isOpenCamera : this.speaker.isOpenCamera,
      });
    },

    onLiveStreamMouseEnter() {
      const { role, imAccount } = this.user.user;
      const isSelf = +imAccount === +this.speaker.memberId;

      if ((role !== 1 && !isSelf) || this.isFullScreen) {
        return;
      }

      this.speaker.maskShow = true;
    },

    onLiveStreamMouseLeave() {
      this.speaker.maskShow = false;
    },

    onFullScreenChange() {
      this.isFullScreen =
        document.fullscreenElement || document.mozFullScreenElement;
    },

    handleIconClick(menu) {
      const actionMap = {
        screen: () => {
          if (!this.isFullScreen) {
            this.isFullScreen = true;
            this.speaker.maskShow = false;
            fullScreenEle(this.$refs.speakerRef);
          } else {
            this.isFullScreen = false;
            exitFullScreen(this.$refs.speakerRef);
          }
        },
        switch: () => {},
      };
      actionMap[menu]?.();
    },

    handleSpeakerMaskClick({ type }) {
      const isLiveToggle = type === "live";
      // 主讲人下麦屏蔽遮罩
      isLiveToggle && (this.speaker.maskShow = false);
    },
  },
};
</script>

<style lang="scss" scoped>
.ofweek-speaker {
  position: relative;
  width: 100%;
  height: 100%;

  .stream-cover {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: url(../../../../assets/img/live/live_default_avatar.png)
      no-repeat center/100px;
    img {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      object-fit: cover;
    }
  }
  .stream-label {
    font-size: 14px;
    color: #fff;
    position: absolute;
    left: 10px;
    bottom: 10px;
  }
  .controll-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .icon {
      z-index: 10;
      cursor: pointer;
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      background: url(../../../../assets/img/live/i-full.png) no-repeat
        center/100%;
      &.icon-switch {
        background: url(../../../../assets/img/live/i-switch.png) no-repeat
          center/100%;
        right: unset;
        left: 10px;
        bottom: unset;
        top: 10px;
      }
    }
  }
}
.speaker-empty {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url(../../../../assets/img/live/bg-nospeaker.png) no-repeat center;
  p {
    color: #797878;
    font-size: 14px;
    text-align: center;
    margin-top: 155px;
  }
}
</style>