<template>
  <div class="prod-shadow">
    <div class="prod-dialog">
      <div class="prod-dialog-scroll">
          <div class="prod-title-wrap">
          <div class="prod-dialog-title">{{ `${$t('product.show')} > ${title == '推荐产品' ? $t('product.recommend') : title}` }}</div>
          <div class="iconfont prod-dialog-close" @click="closeDialogFn">&#xe615;</div>
        </div>
        <div class="prod-bd">
          <div class="info-wrap clearfix">
            <div class="product-left fl">
              <div class="img-pro">
                <!-- <pic-zoom :url="productInfo.imageUrlList[curImgIndex]"></pic-zoom> -->
              </div>
              <ul class="img-tab">
                <li v-for="(item, index) of productInfo.imageUrlList" :key="index" :class="{active: curImgIndex === index}" @mouseover="curImgIndex = index">
                  <img :src="item" alt="">
                </li>
              </ul>
            </div>
            <div class="product-right fl">
              <div class="name">{{ productInfo.productName }}</div>
              <div class="price" v-if="productInfo.price > 0"><i>{{ $t('product.price') }}</i>￥<span>{{ productInfo.price }}</span></div>
              <div class="price" v-if="productInfo.price == 0"><span>{{ $t('product.free') }}</span></div>
              <div class="price" v-if="productInfo.price < 0"><span>{{ $t('product.personally') }}</span></div>
              <div class="apply-btn">
                <div @click="applyFn">{{ $t('product.sample') }}</div>
                <div @click="leaveMsgFn">{{ $t('product.message') }}</div>
              </div>
              <div class="clearfix">
                <div class="share-other fr">
                  <i class="iconfont icon-a"></i>{{ $t('common.share') }}
                  <div class="share-btn">
                    <!-- <a href="javascript:" class="iconfont icon-weichat" :title="$t('common.weChat')" v-popover:popover1></a> -->
                    <a :href="weibo + '&pic=' + productInfo.imageUrlList[0]" target="_blank" class="iconfont icon-xinlang" :title="$t('common.microblog')"></a>
                    <a :href="qzone + '&pics=' + productInfo.imageUrlList[0]" target="_blank" class="iconfont icon-Qzone" :title="$t('common.Qzone')"></a>
                    <a :href="qq + '&pics=' + productInfo.imageUrlList[0]" target="_blank" class="iconfont icon-QQ" title="QQ"></a>
                  </div>
                  <!-- 微信二维码 -->
                  <!-- <el-popover
                    ref="popover1"
                    placement="bottom-start"
                    v-model="popover1"
                    trigger="hover">
                    <div class="qr-code">
                      <div class="code-img" id="codePhone">
                        <canvas id="qr4"></canvas>
                      </div>
                    </div>
                  </el-popover> -->
                </div>
              </div>
              <div class="file-list" v-show="productInfo.productDataDtos.length > 0">
                <p>{{ $t('product.downloadFile') }}：</p>
                <ul>
                  <li class="clearfix" v-for="(item, index) of fileList[currentPage - 1]" :key="index">
                    <p>{{ item.productName }}</p>
                    <a class="download" target="_blank" :href="`//${baseUrl}/api/web/download/roomdata?dataid=${item.dataId}&roomid=${roomId}&devType=3`" :download="item.productName">{{ $t('product.download') }}</a>
                  </li>
                </ul>
                <el-pagination
                  layout="prev, pager, next"
                  :hide-on-single-page="true"
                  :current-page="currentPage"
                  :page-size="pageSize"
                  :total="listTotal"
                  @current-change="pageChange">
                </el-pagination>
              </div>
            </div>
          </div>
          <div class="intro" v-show="productInfo.summary.length > 0">
            <div class="intro-title">{{ $t('product.introduce') }}</div>
            <el-scrollbar>
              <p class="intro-con" v-html="productInfo.summary.replace(/\n/g,'<br>')"></p>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PicZoom from './picZoom.vue'
import QRious from 'qrious'
import { mapGetters } from 'vuex'
import { productGetone, answerQuestionnaire } from '../../services/room/index.js'
import { VITE_baseUrl } from '../../constants.js'
export default {
  name: "question",
  data() {
    return {
      baseUrl: VITE_baseUrl,
      productInfo: {
        imageUrlList: [''],
        productDataDtos: [],
        summary: ''
      },
      loading: false,
      curImgIndex: 0,
      pageUrl: '',
      weibo: '',
      qzone: '',
      qq: '',
      popover1: false,
      fileList: [],
      pageSize: 1,
      currentPage: 1,
      listTotal: 0
    }
  },
  components: { PicZoom },
  props: {
    productId: {
      type: Number
    },
    title: {
      type: String
    }
  },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
      room: 'room/user'
    })
  },
  methods: {
    closeDialogFn () {
      this.$emit('hideDetial')
    },
    applyFn () {
      // this.$emit('applyFn', this.productId)
    },
    leaveMsgFn () {
      // this.$emit('leaveMsgFn', this.productId)
    },
    initShare () {
      this.pageUrl = `https://room.ofweek.com/livewap/#/live/${this.roomId}`
      new QRious({
        element: document.getElementById('qr4'),
        value: this.pageUrl
      })
      let title = this.productInfo.productName
      let url = encodeURIComponent(location.href)
      let desc = `我在${this.room.name}展会上发现了一个不错的展品，赶快来看看吧。`
      title = title.length > 20 ? title.substring(0, 20) + '...' : title
      desc = desc.length > 120 ? desc.substring(0, 120) + '...' : desc
      let param = 'title=' + title + '&url=' + url
      this.weibo = 'https://service.weibo.com/share/share.php?' + param
      this.qzone = 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?' + param + '&desc=' + desc + '&summary=' + desc
      this.qq = 'http://connect.qq.com/widget/shareqq/index.html?' + param
    },
    group (array, subGroupLength) {
      let index = 0;
      let newArray = [];
      while(index < array.length) {
          newArray.push(array.slice(index, index += subGroupLength));
      }
      return newArray;
    },
    pageChange (val) {
      this.currentPage = val
    }
  },
  created () {

  },
  mounted () {

  },
  watch: {
    productId (val) {
      if (val) {
        this.loading = true
        productGetone({productid: val}).then(({ data }) => {
          let res = data
          if (res.code === 0) {
            this.productInfo = res.data
            this.curImgIndex = 0
            this.fileList = this.group(res.data.productDataDtos, 5)
            this.listTotal = this.fileList.length
            this.initShare()
          }
        })
      }
    }
  }
};
</script>
<style lang="scss">
.intro {
  .el-scrollbar {
    height: 180px;
  }
  .el-scrollbar__bar.is-vertical {
    width: 4px;
  }
  .el-scrollbar__wrap {
    overflow-y: auto;
    overflow-x: hidden;
  }
}
.file-list {
  .el-pagination {
    text-align: center;
    color: #1F1F1F;
  }
}
</style>
<style lang="scss" scoped>
.prod-shadow {
  display: block;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}
.prod-dialog {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 1000px;
  margin: 0 0 0 -500px;
  transform: translateY(-50%);
  font: normal 14px/1.5 "Microsoft Yahei";
  letter-spacing: 1px;
  background: #fff;
}
.prod-dialog-scroll {
  max-height: 90vh;
  overflow-y: auto;
}

.prod-title-wrap {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 60px;
  background: #fff;
  z-index: 5;
}
.prod-dialog-close {
  position: absolute;
  right: 28px;
  top: 12px;
  width: 24px;
  height: 24px;
  text-align: center;
  line-height: 24px;
  font-size: 18px;
  color: #1f1f1f;
  cursor: pointer;
  user-select: none;
}
.prod-dialog-title {
  position: absolute;
  left: 50px;
  top: 10px;
  font-size: 20px;
  color: #1F1F1F;
}

.prod-bd {
  padding: 60px 20px 50px 50px;
}
.info-wrap {
  .product-left {
    width: 335px;
    margin-right: 35px;

    .img-pro {
      width: 335px;
      height: 335px;
      border: 1px solid #E6E6E6;
    }

    .img-tab {
      font-size: 0;
      text-align: left;
      margin-top: 10px;

      li {
        display: inline-block;
        width: 60px;
        height: 60px;
        margin-left: 8px;
        border: 1px solid #E6E6E6;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        &:first-child {
          margin-left: 0;
        }
        &.active {
          border: 1px solid #2691E9;
        }
      }
    }
  }
  .product-right {
    width: 500px;

    .name {
      font-size: 18px;
      font-weight: 400;
      color: #1F1F1F;
      line-height: 1.5em;
    }

    .price {
      font-size: 16px;
      color: #C82126;
      margin-top: 10px;

      i {
        font-size: 16px;
        color: #808080;
        font-style: normal;
        margin-right: 5px;
      }
      span {
        font-size: 24px;
        font-weight: bold;
        margin-left: 5px;
      }
    }

    .apply-btn {
      font-size: 0;
      margin-top: 22px;

      div {
        display: inline-block;
        min-width: 130px;
        height: 40px;
        font-size: 16px;
        color: #808080;
        line-height: 40px;
        text-align: center;
        background: #E6E6E6;
        border-radius: 4px;
        margin-right: 20px;
        padding: 0 15px;
        user-select: none;
        cursor: pointer;

        &:hover {
          background: #d6d6d6;
        }

        &:first-child {
          color: #fff;
          background: #e65e50;
        }

        &:first-child:hover {
          background: #e04435;
        }
      }
    }

    .file-list {
      margin-top: 10px;

      > p {
        font-size: 16px;
        color: #1F1F1F;
      }

      ul {
        height: 162px;
      }

      li {
        margin-top: 8px;

        > p {
          float: left;
          width: 360px;
          line-height: 26px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        > .download {
          float: right;
          max-width: 120px;
          height: 24px;
          font-size: 14px;
          color: #2691E9;
          text-align: center;
          line-height: 24px;
          border: 1px solid #2691E9;
          border-radius: 4px;
          user-select: none;
          padding: 0 10px;
          cursor: pointer;
        }
      }
    }
  }
}

.intro {
  margin-top: 35px;

  .intro-title {
    position: relative;
    font-size: 16px;
    color: #1F1F1F;
    padding-left: 10px;
    font-weight: bold;
    line-height: 1;
    margin-bottom: 20px;

    &::after {
      position: absolute;
      left: 0;
      top: 0;
      content: '';
      width: 3px;
      height: 16px;
      background: #2691E9;
    }
  }

  .intro-con {
    color: #808080;
  }
}

.share-other {
  height: 40px;
  line-height: 40px;
  text-align: right;
}
</style>
