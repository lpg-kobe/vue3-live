<template>
  <div class="stream-mask flex-center" v-if="judgeAnchorOrSelf(member)">
    <div class="mask-menu flex-center">
      <i
        class="icon icon-user"
        title="设为主讲"
        v-if="user.user.role === 1 && !member.isMainSpeaker"
        @click="handleIconClick('speaker', member)"
      ></i>
      <i
        :class="`icon icon-${member.isOpenCamera ? 'camera' : 'uncamera'}`"
        :title="`${member.isOpenCamera ? '关闭' : '开启'}摄像头`"
        @click="handleIconClick('camera', member)"
      ></i>
      <i
        :class="`icon icon-${member.isOpenMike ? 'mic' : 'unmic'}`"
        :title="`${member.isOpenMike ? '关闭' : '开启'}麦克风`"
        @click="handleIconClick('mic', member)"
      ></i>
      <i
        class="icon icon-hand"
        v-if="
          user.user.role === 1
            ? +member.memberId !== +user.user.imAccount
            : +member.memberId === +user.user.imAccount
        "
        title="下麦"
        @click="handleIconClick('live', member)"
      ></i>
    </div>
  </div>
</template>
<script>
/** 互動直播流菜單 */
import { ElMessage } from "element-plus";
import { mapState } from "vuex";
import { eventEmitter } from "../../../utils/event";

export default {
  name: "streamMask",
  computed: {
    ...mapState({
      user: ({ user }) => user,
      live: ({ live }) => live,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  props: {
    member: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["menuClick"],
  methods: {
    /** handle menu click of user live stream */
    handleIconClick(type, payload) {
      const actionMap = {
        speaker: () => {
          // 发送设置主讲人推送
          this.$store.dispatch({
            type: "live/setMainSpeaker",
            payload: {
              roomid: this.roomId,
              memberid: payload?.memberId,
            },
            callback: () =>
              ElMessage.success(`${payload?.nick}已成为新的主讲人`),
          });
          this.$emit("menuClick", {
            type,
            userId: payload.memberId,
          });
        },
        mic: () => {
          this.$store.dispatch({
            type: "live/toggleMedia",
            payload: {
              roomid: this.roomId,
              memberid: payload.memberId,
              miketype: +!payload.isOpenMike,
            },
          });
          this.$emit("menuClick", {
            type,
            userId: payload.memberId,
          });
        },
        camera: () => {
          this.$store.dispatch({
            type: "live/toggleMedia",
            payload: {
              roomid: this.roomId,
              memberid: payload.memberId,
              cameratype: +!payload.isOpenCamera,
            },
          });
          this.$emit("menuClick", {
            type,
            userId: payload.memberId,
          });
        },
        live: () => {
          eventEmitter.emit(
            eventEmitter.event.live.stopLive,
            Object.assign(payload, {
              userId: payload.memberId,
            })
          );
          this.$emit("menuClick", {
            type,
            userId: payload.memberId,
          });
        },
      };
      actionMap[type]?.();
    },

    judgeAnchorOrSelf(payload) {
      return (
        +payload.memberId === +this.user.user.imAccount ||
        this.user.user.role === 1
      );
    },
  },
};
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
