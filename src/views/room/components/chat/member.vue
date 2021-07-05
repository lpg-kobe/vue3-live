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
              },
            ]"
          >
            <label>
              <span>{{ item.nick }}</span>
              <span>{{
                item.role === 1 || item.role === 2 ? `[${item.identity}]` : ''
              }}</span>
            </label>
            <div class="member-control">
              <i
                class="icon icon-speaker"
                v-show="+item.memberId === +live.liveSpeaker.userId"
              ></i>
              <i
                v-show="
                  live.liveStreamList.some(
                    ({ userId_ }) => +userId_ === +item.memberId
                  )
                "
                class="icon icon-online"
              ></i>
              <i
                v-show="
                  !live.liveStreamList.some(
                    ({ userId_ }) => +userId_ === +item.memberId
                  )
                "
                class="icon icon-offline"
              ></i>
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
                        live.liveStreamList.some(
                          ({ userId_ }) => +item.memberId === +userId_
                        ) &&
                        user.user.role === 1 &&
                        +item.memberId !== +live.liveSpeaker.userId
                      "
                      >设为主讲</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="invite"
                      v-if="
                        +user.user.role === 1 &&
                        +user.user.imAccount !== +item.memberId &&
                        !live.liveStreamList.some(
                          ({ userId_ }) => +item.memberId === +userId_
                        )
                      "
                      >邀请上麦</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="apply"
                      v-if="
                        user.user.role === 2 &&
                        +user.user.imAccount === +item.memberId &&
                        !live.liveStreamList.some(
                          ({ userId_ }) => +item.memberId === +userId_
                        )
                      "
                      >申请上麦</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="live"
                      v-if="
                        live.liveStreamList.some(
                          ({ userId_ }) => +item.memberId === +userId_
                        ) && user.user.role === 1
                          ? +item.memberId !== +user.user.imAccount
                          : +item.memberId === +user.user.imAccount
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
import { mapState } from 'vuex'
import { eventEmitter } from '../../../../utils/event'
import { loopToInterval } from '../../../../utils/tool'
export default {
  name: 'member',
  data() {
    return {
      timer: null,
    }
  },

  created() {
    this.init()
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
    async init() {
      const { status, data: members } = await this.fetchMembers()

      if (status) {
        // init room speaker
        const speaker = members.find(({ isMainSpeaker }) => isMainSpeaker)
        this.$store.commit('live/setState', {
          key: 'liveSpeaker',
          value: {
            ...speaker,
            userId: speaker.memberId,
          },
        })
      }

      // interval to get memberlist in order to update online status & other
      loopToInterval(this.fetchMembers, this.timer, 6 * 1000)
    },

    fetchMembers() {
      return this.$store.dispatch({
        type: 'live/getMembers',
        payload: {
          roomid: this.roomId,
        },
      })
    },

    memberHasMenu(member) {
      const isAnchor = +this.user.user.role === 1
      const targetIsAnchor = +member.role === 1
      const targetIsSelf = +member.memberId === +this.user.user.imAccount
      const targetIsSpeaker = +member.memberId === +this.live.liveSpeaker.userId
      if (!member.online) {
        return false
      }
      if (isAnchor) {
        return targetIsAnchor ? !targetIsSpeaker : true
      } else {
        return targetIsAnchor ? false : targetIsSelf
      }
    },

    handleMemberClick(member, menu) {
      const actionMap = {
        speaker: () => {
          eventEmitter.emit(eventEmitter.event.anchor.setSpeaker, {
            userId: member.memberId,
            nick: member.nick,
          })
        },
        invite: () => {
          eventEmitter.emit(eventEmitter.event.anchor.invite, {
            userId: member.memberId,
          })
        },
        apply: () => {
          eventEmitter.emit(eventEmitter.event.guest.apply)
        },
        live: () => {
          eventEmitter.emit(eventEmitter.event.live.stopLive, {
            ...member,
            userId: member.memberId,
          })
        },
      }
      actionMap[menu]?.()
    },
  },
}
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
      content: '';
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
