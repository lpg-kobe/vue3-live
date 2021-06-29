<template>
  <div class="product_wrap">
    <div v-for="(item, index) of list" :key="index" v-show="item.productlist.length > 0">
      <h3>{{ item.name == '推荐产品' ? $t('product.recommend') : item.name }}</h3>
      <div class="product_list">
        <div class="product_item" v-for="(item2, index2) of item.productlist" :key="index2">
          <div class="product-img-box">
            <img :src="item2.imageUrl" alt="" @click="showDetailFn(item, item2)">
            <div class="free-apply-btn" v-if="item2.price == '0'" @click="applyFn(item2.productId)">{{ $t('product.freeApply') }}</div>
          </div>
          <p @click="showDetailFn(item, item2)" :title="item2.productName">{{ item2.productName.length > 20 ? item2.productName.substring(0, 20) + '...' : item2.productName }}</p>
        </div>
      </div>
    </div>

    <productDetial v-show="showDetail" :productId="detailProductId" :title="detailTitle" @hideDetial="hideDetailFn" @applyFn="applyFn" @leaveMsgFn="leaveMsgFn"></productDetial>

    <!-- 样品申请 -->
    <el-dialog
      :title="$t('product.sampleApply')"
      :visible.sync="applyDialogShow"
      :before-close="applyDialogclose"
      width="45%">
      <p class="apply-dialog-p"><span>*</span> {{ $t('product.purpose') }}</p>
      <el-form :model="applyForm" ref="applyForm" label-width="0px" :rules="applyRules">
        <el-form-item label="" prop="applyMsg">
          <el-input type="textarea" :rows="6" resize="none" v-model="applyForm.applyMsg"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailSubmit(1)">{{ $t('card.submit') }}</el-button>
      </span>
    </el-dialog>

    <!-- 留言 -->
    <el-dialog
      :title="$t('product.leaveword')"
      :visible.sync="leaveMsgDialogShow"
      :before-close="leaveDialogclose"
      width="45%">
      <el-form :model="leaveMsgForm" ref="leaveMsgForm" label-width="60px" :rules="leaveRules">
        <el-form-item :label="$t('product.theme') + ':'" prop="title">
          <el-input v-model="leaveMsgForm.title"></el-input>
        </el-form-item>
        <el-form-item :label="$t('product.content') + ':'" prop="message">
          <el-input type="textarea" :rows="6" resize="none" v-model="leaveMsgForm.message"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="detailSubmit(2)">{{ $t('card.submit') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import productDetial from './productDetial.vue'
import { getroomproductlist, commitproductmessage } from '../../services/room/index.js'
export default {
  name: 'product',
  data () {
    return {
      list: [],
      showDetail: false,
      detailTitle: '',
      detailProductId: 0, // 详情的产品id
      dialogProductId: 0, // 弹框的产品id
      applyForm: {
        applyMsg: ''
      },
      leaveMsgForm: {
        title: '',
        message: ''
      },
      applyDialogShow: false,
      leaveMsgDialogShow: false,
    }
  },
  components: { productDetial },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
      user: 'user/user',
      isVisitorLogin: 'user/isVisitorLogin'
    }),
    applyRules () {
      return {
        applyMsg: [
          { required: true, message: this.$t('product.purposeErr1'), trigger: 'change' },
          { max: 300, message: this.$t('product.purposeErr2'), trigger: 'change' }
        ]
      }
    },
    leaveRules () {
      return {
        title: [
          { required: true, message: this.$t('product.themeErr1'), trigger: 'change' },
          { max: 30, message: this.$t('product.themeErr2'), trigger: 'change' }
        ],
        message: [
          { required: true, message: this.$t('product.contentErr1'), trigger: 'change' },
          { max: 300, message: this.$t('product.contentErr2'), trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    ...mapMutations([
      'openLogin',
      'room',
      'openCard'
    ]),
    getData () {
      getroomproductlist({roomid: this.roomId}).then(({ data }) => {
        let res = data
        this.list = res.data
      })
    },
    showDetailFn (item, item2) {
      if (this.isVisitorLogin) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
        return
      }
      this.detailProductId = item2.productId
      this.detailTitle = item.name
      this.showDetail = true
      if (document.body.scrollHeight > (window.innerHeight || document.documentElement.clientHeight)) {
        document.body.style.cssText = 'overflow:hidden;padding:0 17px 0 0;'
      }
    },
    hideDetailFn () {
      this.showDetail = false
      document.body.style.cssText = 'overflow:auto;padding:0;';
    },
    applyFn (id) {
      if (this.isVisitorLogin) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
        return
      }
      this.dialogProductId = id
      this.applyDialogShow = true
    },
    applyDialogclose (done) {
      this.$refs['applyForm'].resetFields()
      done()
    },
    leaveMsgFn (id) {
      this.dialogProductId = id
      this.leaveMsgDialogShow = true
    },
    leaveDialogclose (done) {
      this.$refs['leaveMsgForm'].resetFields()
      done()
    },
    detailSubmit (type) {
      if (type === 1) {
        this.$refs['applyForm'].validate((valid) => {
          if (valid) {
            commitproductmessage({
              message: this.applyForm.applyMsg,
              productId: this.dialogProductId,
              roomId: this.roomId,
              title: '',
              type: 1
            }).then(({ data }) => {
              let res = data
              this.$message.success(this.$t('product.applySucceed'))
              this.applyForm.applyMsg = ''
              this.applyDialogShow = false
            })
          }
        })
      } else if (type === 2) {
        this.$refs['leaveMsgForm'].validate((valid) => {
          if (valid) {
            commitproductmessage({
              message: this.leaveMsgForm.message,
              productId: this.dialogProductId,
              roomId: this.roomId,
              title: this.leaveMsgForm.title,
              type: 2
            }).then(({ data }) => {
              let res = data
              this.$message.success(this.$t('product.sendSucceed'))
              this.leaveMsgForm.title = this.$t('product.interest')
              this.leaveMsgForm.message = ''
              this.leaveMsgDialogShow = false
            })
          }
        })
      }
    }
  },
  mounted () {
    this.leaveMsgForm.title = this.$t('product.interest')
    this.getData()
  }
}
</script>

<style lang="scss" scoped>
.product_wrap {
  h3 {
    font-size: 16px;
    margin-top: 10px;
  }

  .product_list {
    font-size: 0;
    padding: 10px 0;
  }
}

.product_item {
  display: inline-block;
  width: 160px;
  margin-right: 28px;
  margin-bottom: 20px;
  vertical-align: top;

  &:nth-child(4n) {
    margin-right: 0;
  }

  .product-img-box {
    position: relative;
    width: 160px;
    height: 160px;
    border: 1px solid #E6E6E6;
    border-radius: 4px;
    margin-bottom: 10px;
    font-size: 0;
    overflow: hidden;

    .free-apply-btn {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 32px;
      font-size: 14px;
      color: #fff;
      text-align: center;
      line-height: 32px;
      background: #2691E9;
      user-select: none;
      cursor: pointer;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      cursor: pointer;
    }
  }

  p {
    font-size: 14px;
    color: #808080;
    cursor: pointer;
  }
}

.apply-dialog-p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #2691E9;

  span {
    color: #C82126;
  }
}
</style>
