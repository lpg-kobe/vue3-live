<template>
  <div class="member_list">
    <div class="member_block">
      <el-scrollbar>
        <ul>
          <li v-for="(item, index) of list" :key="index" class="member_item">
            <span><span :class="{'member-red': item.role == 1, 'member-blue': item.online}">{{item.nick}}</span> {{ item.role === 1 || item.role === 2 ? `[${item.identity}]` : '' }}</span>
            <div class="member_control">
              <i class="el-icon-user-solid" v-show="item.isMainSpeaker"></i>
              <i :class="['member_control_mic', { light: item.isLiving == 1 }]"></i>
              <el-dropdown class="black_dropdown" @command="handleCommand" trigger="click">
                <span class="el-dropdown-link">
                  <i class="member_control_more"></i>
                </span>
                <template #dropdown>
                  <el-dropdown-menu class="chat-el-dropdown">
                    <el-dropdown-item :command="commandPara(item, 'a')">设为主讲</el-dropdown-item>
                    <el-dropdown-item :command="commandPara(item, 'b')">取消主讲</el-dropdown-item>
                    <el-dropdown-item :command="commandPara(item, 'c')">邀请上麦</el-dropdown-item>
                    <el-dropdown-item :command="commandPara(item, 'd')">下麦</el-dropdown-item>
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
import { mapGetters } from 'vuex'
import { getroomanthorandguestlist } from '../../services/room/index.js'
export default {
  name: 'member',
  data () {
    return {
      list: [],
      liveId: ''
    }
  },
  computed: {
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      user: 'user/user',
      imAccount: 'user/imAccount',
      liveStatus: 'room/liveStatus'
    })
  },
  methods: {
    getData () {
      getroomanthorandguestlist({roomid: this.roomId}).then(({ data }) => {
        let res = data
        this.list = res.data
      })
    },
    compareProp (prop) {
      return function (a, b) {
        var val1 = a[prop];
        var val2 = b[prop];
        return val1 - val2;
      }
    },
    commandPara (item, type) {
      return {
        info: item,
        type
      }
    },
    handleCommand (command) {
      switch (command.type) {
        case 'a':
          // 设为主讲
          console.log(command.info)
          break;
      }
    }
  },
  created () {
    
  },
  mounted () {
    this.getData()
    let timer = setInterval(() => {
      this.getData()
    }, 2000);
  }
}
</script>

<style lang="scss" scoped>
.member_list {
  padding: 0 9px 0 23px;

  ul {
    padding-right: 14px;
  }

  .member_item {
    width: 100%;
    height: 57px;
    padding: 10px 13px 10px 0;
    font-size: 0;
    border-bottom: 1px solid #EBEBEB;

    > span {
      font-size: 14px;
      line-height: 35px;
      > span {
        color: grey;
      }

      .member-blue {
        color: #53a8ff;
      }
      .member-red {
        color: #E65E50;
      }
    }

    .member_control {
      float: right;
      height: 35px;
      line-height: 35px;

      i {
        position: relative;
        display: inline-block;
        margin-left: 12px;
        cursor: pointer;
        vertical-align: middle;
        font-style: normal;
      }
      .control_cursor {
        cursor: default;
      }
    }
  }
}

.member_control_ban {
  width: 26px;
  height: 18px;
  background: url(../../assets/jinyan.png) no-repeat center center;
  background-size: 100% 100%;
}

.member_control_mic {
  width: 22px;
  height: 22px;
  background: url(../../assets/mic_ban.png) no-repeat center center;
}
.member_control_mic.light {
  background: url(../../assets/mic.png) no-repeat center center;
}

.member_control_more {
  width: 14px;
  height: 12px;
  background: url(../../assets/more.png) no-repeat center center;

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
.member_block {
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
