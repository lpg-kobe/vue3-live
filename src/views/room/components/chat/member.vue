<template>
  <div class="ofweek-member-list">
    <div class="member-block">
      <el-scrollbar>
        <ul>
          <li
            v-for="(item, index) of live.liveMembers"
            :key="index"
            :class="[
              'member-item',
              {
                self: +item.memberId === +user.user.imAccount,
                'on-line': item.online,
                'no-menu': !memberHasMenu(item),
              },
            ]"
          >
            <label>
              <span>{{ item.nick }}</span>
              <span>{{
                item.role === 1 || item.role === 2 ? `[${item.identity}]` : ""
              }}</span>
            </label>
            <div class="member-control">
              <i class="icon icon-speaker" v-show="item.isMainSpeaker"></i>
              <i v-show="item.isLiving" class="icon icon-online"></i>
              <i v-show="!item.isLiving" class="icon icon-offline"></i>
              <el-dropdown
                v-if="memberHasMenu(item)"
                class="black-dropdown align-middle"
                @command="handleMemberClick(item, $event)"
              >
                <span class="el-dropdown-link">
                  <i class="icon member-control-more pointer"></i>
                </span>
                <template #dropdown>
                  <el-dropdown-menu class="chat-el-dropdown">
                    <el-dropdown-item
                      command="speaker"
                      v-if="
                        item.isLiving &&
                        user.user.role === 1 &&
                        !item.isMainSpeaker
                      "
                      >设为主讲</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="invite"
                      v-if="
                        +user.user.role === 1 &&
                        +user.user.imAccount !== +item.memberId &&
                        !item.isLiving
                      "
                      >邀请上麦</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="apply"
                      v-if="
                        user.user.role === 2 &&
                        +user.user.imAccount === +item.memberId &&
                        !item.isLiving
                      "
                      >申请上麦</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="anchorOnLive"
                      v-if="
                        user.user.role === 1 &&
                        +user.user.imAccount === +item.memberId &&
                        !item.isLiving
                      "
                      >上麦</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="live"
                      v-if="
                        item.isLiving &&
                        (user.user.role === 1
                          ? true
                          : +item.memberId === +user.user.imAccount)
                      "
                      >下麦</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </li>
        </ul>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { ElMessage } from "element-plus";
import { eventEmitter } from "../../../../utils/event";
export default {
  name: "member",
  data() {
    return {
      timer: null,
    };
  },

  created() {
    this.init();
  },

  computed: {
    ...mapState({
      user: ({ user }) => user,
      live: ({ live }) => live,
      room: ({ room }) => room,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },

  methods: {
    init() {
      this.fetchMembers();
    },

    async fetchMembers() {
      const { status, data: members } = await this.$store.dispatch({
        type: "live/getMembers",
        payload: {
          roomid: this.roomId,
        },
      });
      if (status) {
        // init room speaker
        const speaker = members.find(({ isMainSpeaker }) => isMainSpeaker);
        this.$store.commit("live/setState", {
          key: "liveSpeaker",
          value: speaker
            ? {
                ...speaker,
                userId: speaker.memberId,
              }
            : {
                userId: "",
              },
        });
      }
      return true;
    },

    memberHasMenu(member) {
      const isAnchor = +this.user.user.role === 1;
      const targetIsAnchor = +member.role === 1;
      const targetIsSelf = +member.memberId === +this.user.user.imAccount;
      if (!member.online || !this.live.liveStart) {
        return false;
      }
      if (isAnchor) {
        return true;
      } else {
        return targetIsAnchor ? false : targetIsSelf;
      }
    },

    handleMemberClick(member, menu) {
      const actionMap = {
        speaker: () => {
          // 发送设置主讲人推送
          const lastSpeakerId = this.live.liveSpeaker.userId;
          this.$store.dispatch({
            type: "live/setMainSpeaker",
            payload: {
              roomid: this.roomId,
              memberid: member.memberId,
            },
            callback: () => {
              ElMessage.success(`${member.nick}已成为新的主讲人`);
              const lastSpeaker = this.live.liveMembers.find(
                ({ memberId }) => +memberId === +lastSpeakerId
              );
              lastSpeaker && (lastSpeaker.isMainSpeaker = 0);
              member.isMainSpeaker = 1;
            },
          });
        },

        anchorOnLive: () => {
          // 主播推送上麦消息
          this.$store.dispatch({
            type: "live/anchorOnline",
            payload: {
              roomid: this.roomId,
            },
            callback: () => {
              member.isLiving = 1;
            },
          });
        },

        invite: async () => {
          // 发送邀请推送
          await this.$store.dispatch({
            type: "live/inviteLive",
            payload: {
              roomid: this.roomId,
              anthorid: member.memberId,
            },
            callback: () => ElMessage.success("上麦邀请已发送"),
          });
        },

        apply: () => {
          // 发送申请推送
          this.$store.dispatch({
            type: "live/applyLive",
            payload: {
              roomid: this.roomId,
            },
            callback: () => ElMessage.success("上麦申请已发送"),
          });
        },

        // 下麦
        live: () => {
          eventEmitter.emit(eventEmitter.event.live.stopLive, {
            ...member,
            userId: member.memberId,
            callback: () => {
              member.isLiving = 0;
            },
          });
        },
      };
      actionMap[menu]?.();
    },
  },
};
</script>

<style lang="scss" scoped>
.ofweek-member-list {
  padding: 0 9px 0 23px;

  ul {
    padding-right: 14px;
  }

  .member-item {
    width: 100%;
    height: 57px;
    padding: 10px 13px 10px 0;
    font-size: 0;
    border-bottom: 1px solid #ebebeb;

    &.no-menu {
      padding-right: 39px;
    }

    &.self {
      > label {
        color: #e65e50;
      }
      &.on-line {
        > label {
          color: #e65e50;
        }
      }
    }

    &.on-line {
      > label {
        color: #2691e9;
      }
    }

    > label {
      font-size: 14px;
      line-height: 35px;
      color: #808080;
    }

    .member-control {
      float: right;
      height: 35px;
      line-height: 35px;

      .icon {
        position: relative;
        display: inline-block;
        margin-left: 12px;
        vertical-align: middle;
        font-style: normal;
      }
      .control_cursor {
        cursor: default;
      }
    }
  }
}

.member-control-ban {
  width: 26px;
  height: 18px;
  background: url(../../../../assets/jinyan.png) no-repeat center center;
  background-size: 100% 100%;
}

.icon {
  width: 16px;
  height: 16px;
  &.icon-online {
    background-size: 14px;
  }
  &.icon-offline {
    background-size: 20px;
  }
}
.member-control-more {
  width: 14px;
  height: 12px;
  background: url(../../../../assets/more.png) no-repeat center center;

  ul {
    position: absolute;
    top: 25px;
    right: -13px;
    padding: 5px 10px;
    background: rgba($color: #000000, $alpha: 0.8);
    border-radius: 4px;
    z-index: 2;
    cursor: default;

    li {
      min-width: 90px;
      height: 33px;
      font-size: 14px;
      color: #999999;
      line-height: 33px;
      border-top: 1px solid #999999;
      cursor: pointer;

      &:hover {
        color: #fff;
      }

      &:first-child {
        border-top: 0;
      }
    }

    &::after {
      position: absolute;
      top: -10px;
      right: 15px;
      content: "";
      width: 0;
      height: 0;
      border: 5px solid transparent;
      border-bottom-color: rgba($color: #000000, $alpha: 0.8);
    }
  }
}
.member-block {
  height: 485px;

  >>> .el-scrollbar {
    height: 475px;
  }
  >>> .el-scrollbar__bar.is-vertical {
    width: 4px;
  }
  >>> .el-scrollbar__wrap {
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
