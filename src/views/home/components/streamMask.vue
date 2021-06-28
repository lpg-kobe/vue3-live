<template>
  <div class="stream-mask flex-center">
    <div class="mask-menu flex-center">
      <i
        class="icon icon-user"
        title="设为主讲"
        v-if="
          user.user.role === 1 &&
          String(stream.userId_) !== String(user.user.imAccount)
        "
        @click="handleIconClick('speaker', stream)"
      ></i>
      <i
        :class="`icon icon-${stream.isOpenCamera ? 'camera' : 'uncamera'}`"
        v-if="judgeAnchorOrSelf(stream)"
        :title="`${stream.isOpenCamera ? '关闭' : '开启'}摄像头`"
        @click="handleIconClick('camera', stream)"
      ></i>
      <i
        :class="`icon icon-${stream.isOpenMic ? 'mic' : 'unmic'}`"
        v-if="judgeAnchorOrSelf(stream)"
        :title="`${stream.isOpenMic ? '关闭' : '开启'}麦克风`"
        @click="handleIconClick('mic', stream)"
      ></i>
      <i
        class="icon icon-hand"
        v-if="judgeAnchorOrSelf(stream)"
        title="下麦"
        @click="handleIconClick('live', stream)"
      ></i>
    </div>
  </div>
</template>
<script>
/** 互動直播流菜單 */

import { mapState } from 'vuex'
import { eventEmitter } from '../../../utils/event'

export default {
  name: 'streamMask',
  computed: {
    ...mapState({
      user: ({ user }) => user,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  props: {
    stream: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    /** handle menu click of user live stream */
    handleIconClick(type, payload) {
      const actionMap = {
        speaker: () => {
          eventEmitter.emit(eventEmitter.event.anchor.setSpeaker, payload)
        },
        mic: () => {
          if (payload.isOpenMic) {
            payload.muteAudio()
            payload.isOpenMic = false
          } else {
            payload.unmuteAudio()
            payload.isOpenMic = true
          }
        },
        camera: () => {
          if (payload.isOpenCamera) {
            payload.muteVideo()
            payload.isOpenCamera = false
          } else {
            payload.unmuteVideo()
            payload.isOpenCamera = true
          }
        },
        live: () => {
          const isSelf =
            String(payload.userId_) === String(this.user.user.imAccount)
          const targetIsAnchor = payload.role === 1
          if (isSelf) {
            targetIsAnchor
              ? eventEmitter.emit(eventEmitter.event.anchor.stop)
              : eventEmitter.emit(eventEmitter.event.guest.stop)
          } else {
            this.$store.dispatch({
              type: 'live/guestStopLive',
              payload: {
                roomid: this.roomId,
                memberid: payload.userId_,
              },
            })
          }
        },
      }
      actionMap[type]?.()
    },

    judgeAnchorOrSelf(payload) {
      return (
        String(payload.userId_) === String(this.user.user.imAccount) ||
        this.user.user.role === 1
      )
    },
  },
}
</script>
<style lang="scss" scoped>
.stream-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: rgba(0, 0, 0, 0.75);
  transition: all 0.3s ease;
  .mask-header {
    overflow: hidden;
    white-space: nowrap;
    word-break: keep-all;
    text-overflow: ellipsis;
    margin: 10px 0 25px 0;
    color: #fff;
    font-size: 14px;
  }
  .mask-menu {
    flex: 1;
    padding: 0 10px;
  }
  .icon {
    cursor: pointer;
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-left: 10px;
    background-color: #333333;
    transition: all 0.3s ease;
    &:first-child {
      margin-left: 0;
    }
    &.active,
    &:hover {
      background-color: #e65e50;
    }
  }
}
</style>
