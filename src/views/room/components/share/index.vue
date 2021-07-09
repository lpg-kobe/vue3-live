<template>
  <div class="share-bar">
    <!-- 微信二维码 -->
    <!-- <el-popover
      ref="popover1"
      placement="bottom-start"
      v-model="popover1"
      trigger="hover">
      <div class="qr-code">
        <div class="code-img" id="codePhone">
          <canvas id="qr2"></canvas>
        </div>
      </div>
    </el-popover> -->

    <!-- <el-popover
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
    </el-popover> -->

    <!-- APP下载二维码 -->
    <!-- <el-popover
      ref="popover2"
      placement="bottom-start"
      v-model="popover2"
      trigger="hover">
      <div class="qr-code">
        <div class="code-img" id="codePhone">
          <qriously value="http://a.app.qq.com/o/simple.jsp?pkgname=com.mobile.ofweek" :size="135"></qriously>
        </div>
      </div>
    </el-popover> -->
    <!-- 手机观看二维码 -->
    <!-- <el-popover
      ref="popover3"
      placement="bottom-start"
      v-model="popover3"
      trigger="hover">
      <div class="qr-code">
        <div class="code-img" id="codePhone">
          <canvas id="qr"></canvas>
        </div>
      </div>
    </el-popover> -->

    <div class="fl share-other">
      <i class="iconfont icon-a"></i>{{ $t("common.share") }}
      <div class="share-btn">
        <a
          href="javascript:"
          class="iconfont icon-weichat"
          :title="$t('common.weChat')"
        ></a>
        <a
          :href="weibo + '&pic=' + room.coverUrl"
          target="_blank"
          class="iconfont icon-xinlang"
          :title="$t('common.microblog')"
        ></a>
        <a
          :href="qzone + '&pics=' + room.coverUrl"
          target="_blank"
          class="iconfont icon-Qzone"
          :title="$t('common.Qzone')"
        ></a>
        <a
          :href="qq + '&pics=' + room.coverUrl"
          target="_blank"
          class="iconfont icon-QQ"
          title="QQ"
        ></a>
      </div>
    </div>
    <!-- <span class="share-fence">|</span>
    <div class="fl share-download-app" v-popover:popover2>
      <span class="iconfont icon-app"></span>
      <span>APP观看</span>
    </div> -->
    <span class="share-fence">|</span>
    <div class="fl share-mobile-watch">
      <span class="iconfont icon-5app"></span>
      <span>{{ $t("common.watchInMobile") }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import QRious from "qrious";
import { VITE_wapBaseUrl } from "../../constants";
export default {
  name: "share-bar",
  data() {
    return {
      pageUrl: "",
      weibo: "",
      qzone: "",
      qq: "",
      popover1: false,
      popover2: false,
      popover3: false,
    };
  },
  computed: {
    ...mapGetters({
      room: "room/room",
    }),
    ...mapState({
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  mounted() {
    this.pageUrl = `https://${VITE_wapBaseUrl}/livewap/#/live/${this.roomId}`;
    new QRious({
      element: document.getElementById("qr"),
      value: this.pageUrl,
    });
    new QRious({
      element: document.getElementById("qr2"),
      value: this.pageUrl,
    });
    let title = this.room.name;
    let url = encodeURIComponent(location.href);
    let desc = this.room.description.replace(/<br>/g, ",");
    let param = "title=" + title + "&url=" + url;
    desc = desc.length > 20 ? desc.substring(0, 20) + "..." : desc;
    this.weibo = "https://service.weibo.com/share/share.php?" + param;
    this.qzone =
      "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?" +
      param +
      "&desc=" +
      desc +
      "&summary=" +
      desc;
    this.qq = "http://connect.qq.com/widget/shareqq/index.html?" + param;
  },
};
</script>
