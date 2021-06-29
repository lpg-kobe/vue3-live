<template>
  <div class="header">
    <div class="wrap clearfix">
      <!-- logo -->
      <a href="https://live.ofweek.com/" target="_blank" v-if="room.type === 1 || room.type === 4">
        <img v-if="lang === 'zh'" class="header_logo" src="../../assets/logo_zh.png" alt="">
        <img v-if="lang === 'en'" class="header_logo" src="../../assets/logo_en.jpg" alt="">
        <img v-if="lang === 'ja'" class="header_logo" src="../../assets/logo_ja.jpg" alt="">
        <img v-if="lang === 'es'" class="header_logo" src="../../assets/logo_es.jpg" alt="">
      </a>
      <a href="https://webinar.ofweek.com/" target="_blank" v-if="room.type === 2">
        <img class="header_logo" src="../../assets/logo2.png" alt="">
      </a>
      <a href="https://expo.ofweek.com/" target="_blank" v-if="room.type === 3">
        <img class="header_logo" src="../../assets/logo3.png" alt="">
      </a>
      <!-- room name -->
      <h1 class="dot" :title="room.name">{{ room.name }}</h1>
      <!-- 公司二维码 -->
      <el-popover
        placement="bottom-start"
        trigger="hover">
        <template #reference v-if="room.companyQrUrl">
          <div class="company-qr">
            <span>{{ $t('head.scan') }}</span>
          </div>
        </template>
        <div class="company-qr-code">
          <img :src="room.companyQrUrl" alt="">
          <p>{{ $t('head.scanFirm') }}</p>
        </div>
      </el-popover>

      <!-- 右侧 -->
      <ul class="fr">
        <li class="pointer-li">
          <el-popover
            placement="bottom-start"
            trigger="hover">
            <template #reference>
              <div>
                <span class="iconfont icon-5app"></span><span>{{ $t('common.watchInMobile') }}</span>
              </div>
            </template>
            <div class="qr-code">
              <div class="code-img">
                <canvas id="qr3"></canvas>
              </div>
            </div>
          </el-popover>
        </li>
        <li>{{ $t('common.welcome') }}，<b class="blue_txt">{{userName}}</b>，</li>
        <li style="margin-left: 0;" v-if="isVisitorLogin"><a href="javascript:;" @click="openLogin(false)">{{ $t('common.login') }}</a></li>
        <li style="margin-left: 0;" v-else><a href="javascript:;" @click="logout">{{ $t('common.logout') }}</a></li>
        <!-- 多语言切换下拉菜单 -->
        <li v-if="false">
          <el-dropdown trigger="click">
            <span class="el-dropdown-link" style="cursor: pointer;">
              {{ langList[lang] }}<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="(item, key) of langList" :key="key" @click.native="changeLang(key)">{{ item }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </ul>

      <ul class="fr">
        <li class="live-btn">
          <span>开始直播</span>
        </li>
        <li class="live-btn">
          <span class="live-over">下麦</span>
        </li>
        <li class="live-btn">
          <span class="live-quit">退出直播</span>
        </li>
        <li class="pointer-li">
          <div>
            <span class="icon-live"></span><span>媒体设置</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { logout, leaveroom } from '../../services/room/index.js'
import { mapGetters } from 'vuex'
import QRious from 'qrious'
import { VITE_wapBaseUrl } from '../../constants.js'

export default {
  name: 'heads',
  data () {
    return {
      currentUrl: '',
      langList: {
        'zh': '中文',
        'en': 'English',
        'ja': '日本語',
        'es': 'Español'
      }
    }
  },
  computed: {
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      user: 'user/user',
      userName: 'user/userName',
      lang: 'room/lang',
      isVisitorLogin: 'user/isVisitorLogin'
    })
  },
  methods: {
    logout () {
      leaveroom({roomid: this.roomId})
      logout().then(res => {
        if (res.code === 0) {
          location.reload()
        }
      })
    },
    changeLang (lang) {
      this.setLang(lang)
      localStorage.setItem("userSetLang", lang)
    }
  },
  mounted () {
    console.log(this.user,11)
    console.log(this.userName,22)
    this.currentUrl = `https://${VITE_wapBaseUrl}/livewap/#/live/${this.roomId}`
    new QRious({
      element: document.getElementById('qr3'),
      value: this.currentUrl
    })

    if (this.lang !== 'zh') {
      this.$i18n.locale = this.lang
    }
  },
  watch: {
    lang (val) {
      this.$i18n.locale = val
    }
  }
}
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
    color: #1F1F1F;
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

      span {
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
        user-select: none;
        vertical-align: middle;
      }
      .live-quit {
        color: #5A5A5A;
        border: 1px solid #D9D9D9;
        background: #fff;
      }
      .live-over {
        border: 1px solid #2691E9;
        background: #2691E9;
      }
    }

    .pointer-li {
      cursor: pointer;
    }

    .icon-live {
      display: inline-block;
      width: 17px;
      height: 13px;
      background: url(../../assets/icon-live.png) no-repeat center center;
      margin-right: 8px;
    }

    .iconfont {
      font-size: 18px;
      color: #E65E50;
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
  color: #1F1F1F;
  line-height: 46px;
  background: url(../../assets/qr-icon.png) no-repeat left center;
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
