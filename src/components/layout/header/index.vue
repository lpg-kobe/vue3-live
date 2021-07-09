<template>
  <header class="header">
    <div class="wrap clearfix">
      <!-- logo -->
      <a
        href="https://live.ofweek.com/"
        target="_blank"
        v-if="room.room.type === 1 || room.room.type === 4"
      >
        <img
          v-if="room.lang === 'zh'"
          class="header_logo"
          src="../../../assets/logo_zh.png"
          alt=""
        />
        <img
          v-if="room.lang === 'en'"
          class="header_logo"
          src="../../../assets/logo_en.jpg"
          alt=""
        />
        <img
          v-if="room.lang === 'ja'"
          class="header_logo"
          src="../../../assets/logo_ja.jpg"
          alt=""
        />
        <img
          v-if="room.lang === 'es'"
          class="header_logo"
          src="../../../assets/logo_es.jpg"
          alt=""
        />
      </a>
      <a
        href="https://webinar.ofweek.com/"
        target="_blank"
        v-if="room.room.type === 2"
      >
        <img class="header_logo" src="../../../assets/logo2.png" alt="" />
      </a>
      <a
        href="https://expo.ofweek.com/"
        target="_blank"
        v-if="room.room.type === 3"
      >
        <img class="header_logo" src="../../../assets/logo3.png" alt="" />
      </a>
      <!-- room name -->
      <h1 class="dot" :title="room.room.name">{{ room.room.name }}</h1>
      <!-- 公司二维码 -->
      <el-popover placement="bottom-start" trigger="hover">
        <template #reference v-if="room.room.companyQrUrl">
          <div class="company-qr">
            <span>{{ $t("head.scan") }}</span>
          </div>
        </template>
        <div class="company-qr-code">
          <img :src="room.room.companyQrUrl" alt="" />
          <p>{{ $t("head.scanFirm") }}</p>
        </div>
      </el-popover>

      <!-- 右侧 -->
      <ul class="fr">
        <li class="pointer-li">
          <el-popover placement="bottom-start" trigger="hover">
            <template #reference>
              <div>
                <span class="iconfont icon-5app"></span
                ><span>{{ $t("common.watchInMobile") }}</span>
              </div>
            </template>
            <div class="qr-code">
              <div class="code-img">
                <canvas id="qr3"></canvas>
              </div>
            </div>
          </el-popover>
        </li>
        <li>
          {{ $t("common.welcome") }}，<b class="blue_txt">{{
            user.user.nick
          }}</b
          >，
        </li>
        <li style="margin-left: 0">
          <a href="javascript:;" @click="logout">{{ $t("common.logout") }}</a>
        </li>
        <!-- 多语言切换下拉菜单 -->
        <li v-if="false">
          <el-dropdown trigger="click">
            <span class="el-dropdown-link" style="cursor: pointer">
              {{ langList[room.lang]
              }}<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(item, key) of langList"
                  :key="key"
                  @click.native="changeLang(key)"
                  >{{ item }}</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </ul>

      <ul class="fr">
        <li class="live-btn">
          <el-button
            type="danger"
            size="mini"
            round
            @click="handleBtnClick('start')"
            :loading="live.liveToggleLoading"
            v-show="!live.liveStart && room.room.status === 1"
            v-if="user.user.role === 1"
            >开始直播</el-button
          >
        </li>
        <li class="live-btn">
          <el-button
            type="primary"
            size="mini"
            round
            @click="handleBtnClick('stop')"
            v-show="live.liveStart && room.room.status === 1"
            v-if="user.user.role === 1"
            :loading="live.liveToggleLoading"
            >结束直播</el-button
          >
        </li>
        <li class="live-btn">
          <el-button
            type="danger"
            size="mini"
            round
            @click="handleBtnClick('apply')"
            v-show="
              !live.liveMembers.find(
                ({ memberId }) => +memberId === +user.user.imAccount
              )?.isLiving && live.liveStart
            "
            v-if="user.user.role === 2"
            :loading="live.liveToggleLoading"
            >申请上麦</el-button
          >
        </li>
        <li class="live-btn">
          <el-button
            type="primary"
            size="mini"
            round
            @click="handleBtnClick('offLive')"
            v-show="
              live.liveMembers.find(
                ({ memberId }) => +memberId === +user.user.imAccount
              )?.isLiving && live.liveStart
            "
            v-if="user.user.role === 2"
            :loading="live.liveToggleLoading"
            >下麦</el-button
          >
        </li>
        <li class="pointer-li">
          <div>
            <span class="icon-live"></span
            ><span @click="handleBtnClick('mediaSet')">媒体设置</span>
          </div>
        </li>
      </ul>
    </div>
  </header>
</template>

<script>
import { logout, leaveroom } from "../../../services/room/index.js";
import { mapState } from "vuex";
import { ElMessage } from "element-plus";
import QRious from "qrious";
import { VITE_wapBaseUrl } from "../../../constants.js";
import { removeUserSession } from "../../../utils/session";
import { eventEmitter } from "../../../utils/event";

export default {
  name: "heads",
  data() {
    return {
      currentUrl: "",
      langList: {
        zh: "中文",
        en: "English",
        ja: "日本語",
        es: "Español",
      },
    };
  },
  computed: {
    ...mapState({
      live: ({ live }) => live,
      user: ({ user }) => user,
      room: ({ room }) => room,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  created() {},
  methods: {
    logout() {
      leaveroom({ roomid: this.roomId });
      logout().then(({ data }) => {
        if (data?.code === 0) {
          removeUserSession();
          location.reload();
        }
      });
    },

    changeLang(lang) {
      this.setLang(lang);
      localStorage.setItem("userSetLang", lang);
    },

    handleBtnClick(menu) {
      const actionMap = {
        start: () => {
          // 主播推送开始直播消息
          this.$store.dispatch({
            type: "live/startLive",
            payload: {
              roomid: this.roomId,
              streamid: this.room.room?.myStreamIdMix,
              streamtype: 4,
            },
            callback: () => {},
          });
        },

        stop: () => {
          // 主播推送结束直播消息
          this.$store.dispatch({
            type: "live/stopLive",
            payload: {
              roomid: this.roomId,
            },
            callback: () => ElMessage.success("直播已结束"),
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

        offLive: () => {
          // 嘉宾推送下麦消息
          this.$store.dispatch({
            type: "live/guestStopLive",
            payload: {
              roomid: this.roomId,
              memberid: this.user.user.imAccount,
            },
          });
        },

        mediaSet: () => {
          eventEmitter.emit(eventEmitter.event?.live?.setMedia);
        },
      };
      actionMap[menu]?.();
    },
  },
  mounted() {
    this.currentUrl = `https://${VITE_wapBaseUrl}/livewap/#/live/${this.roomId}`;
    new QRious({
      element: document.getElementById("qr3"),
      value: this.currentUrl,
    });

    if (this.room.lang !== "zh") {
      this.$i18n.locale = this.room.lang;
    }
  },
  watch: {
    "room.lang": {
      handler: function (val) {
        this.$i18n.locale = val;
      },
    },
  },
};
</script>

<style lang="scss">
.header {
  width: 100%;
  height: 46px;
  background: #fff;

  .header_logo {
    font-size: 0;
    height: 36px;
    margin-right: 17px;
    vertical-align: middle;
  }

  h1 {
    display: inline-block;
    max-width: 350px;
    font-size: 16px;
    color: #1f1f1f;
    font-weight: 500;
    line-height: 46px;
    vertical-align: middle;
  }

  .fr {
    font-size: 0;

    li {
      display: inline-block;
      font-size: 14px;
      line-height: 46px;
      margin-left: 30px;
      vertical-align: top;
    }

    .live-btn {
      font-size: 0;

      .el-button {
        vertical-align: middle;
      }

      // span {
      //   display: inline-block;
      //   min-width: 58px;
      //   height: 28px;
      //   padding: 0 11px;
      //   font-size: 14px;
      //   color: #fff;
      //   line-height: 28px;
      //   text-align: center;
      //   border-radius: 28px;
      //   border: 1px solid #e65e50;
      //   background: #e65e50;
      //   cursor: pointer;
      //   user-select: none;
      //   vertical-align: middle;
      // }
      // .live-quit {
      //   color: #5a5a5a;
      //   border: 1px solid #d9d9d9;
      //   background: #fff;
      // }
      // .live-over {
      //   border: 1px solid #2691e9;
      //   background: #2691e9;
      // }
    }

    .pointer-li {
      cursor: pointer;
    }

    .icon-live {
      display: inline-block;
      width: 17px;
      height: 13px;
      background: url(../../../assets/icon-live.png) no-repeat center center;
      margin-right: 8px;
    }

    .iconfont {
      font-size: 18px;
      color: #e65e50;
      margin-right: 4px;
      vertical-align: middle;
    }
  }
  .qr-code {
    text-align: center;
  }
  .code-img {
    float: left;
    width: 125px;
    height: 125px;

    canvas {
      margin: 0 auto;
      width: 125px;
      height: 125px;
    }
  }
}

.company-qr {
  display: inline-block;
  height: 46px;
  padding-left: 34px;
  margin-left: 20px;
  font-size: 14px;
  color: #1f1f1f;
  line-height: 46px;
  background: url(../../../assets/qr-icon.png) no-repeat left center;
  background-size: 25px 25px;
  user-select: none;
  cursor: pointer;
}
.company-qr-code {
  text-align: center;

  img {
    width: 125px;
    height: 125px;
  }

  p {
    font-size: 14px;
    color: #212121;
    padding: 5px 0 0;
  }
}
</style>
