<template>
  <div class="">
    <div class="imgtext_control_wrap" v-show="user.role === 1 || user.role === 2">
      <textarea class="imgtext_textarea" rows="10" v-model="imgtxt"></textarea>
      <div class="clearfix imgtext_control">
        <p class="fl"><i>!</i>{{ $t('imgText.redHint') }}</p>
        <div class="fr">
          <span class="grey_btn" @click="dialogVisible = true">{{ $t('imgText.upload') }}</span>
          <span @click="showPreview">{{ $t('imgText.preview') }}</span>
          <span @click="issueFn">{{ $t('imgText.issue') }}</span>
        </div>
      </div>
    </div>

    <ul id="height_ul" class="img_text">
      <li v-for="(item, index) of data" :key="index">
        <div class="img_text_time clearfix">
          <span>{{ formatDate(item.createDate, 'hh:mm:ss YYYY-MM-DD') }}</span>
          <div class="fr" v-show="user.role === 1 || item.senderId == user.imAccount">
            <i class="el-icon-edit" @click="showEditDialog(item)"></i>
            <i class="el-icon-delete" @click="imgtextDelete(item)"></i>
          </div>
        </div>
        <div class="img_text_con">
          <div v-if="item.imageVoList.length > 0">
            <img v-for="(imgItem, index) of item.imageVoList" :key="index" class="img_text_img" :src="imgItem.imageUrl" alt="">
          </div>
          <p v-if="item.text.length > 0" v-html="item.text.replace(/\n/g,'<br>')"></p>
        </div>
      </li>
    </ul>
    <p class="no_data_tip" v-show="data.length < 1 && user.role != 1 && user.role != 2">{{ $t('imgText.noData') }}！</p>
    <p class="chat-icon-loading" v-if="isLoading && !isOver" v-loading="isLoading"></p>
    <p class="over_data_tip" v-show="data.length > 1 && isOver">{{ $t('imgText.loadOver') }}...</p>

    <!-- 上传图片 -->
    <el-dialog
      :title="$t('imgText.upload')"
      v-model="dialogVisible"
      width="50%">
      <p style="margin-bottom: 20px;">{{ `已选择${fileList.length}张，还能选择${9 - fileList.length}张` }}</p>
      <el-upload
        ref="imgTextUpload"
        :action="uploadSrc"
        :data="uploadImgData"
        accept=".jpg,.jpeg,.png,.JPG,.JPEG"
        :limit="9"
        list-type="picture-card"
        :on-success="uploadSuccess"
        :on-remove="handleRemove"
        :class="{hideAdd: fileList.length >= 9}">
        <i class="el-icon-plus"></i>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showPreview()">{{ $t('common.finish') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览 -->
    <el-dialog
      :title="$t('imgText.previewTitle')"
      v-model="dialogVisible2"
      width="50%">
      <div class="imgtext_preview">
        <p v-show="imgtxt.length > 0">{{ imgtxt }}</p>
        <img v-show="fileList.length > 0" v-for="(item, index) of fileList" :key="index" :src="item.url" alt="">
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible2 = false">{{ $t('imgText.btnEdit') }}</el-button>
          <el-button type="primary" @click="issueFn">{{ $t('imgText.btnIssue') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改图文 -->
    <el-dialog
      :title="$t('imgText.changeTitle')"
      v-model="dialogVisible3"
      width="50%">
      <textarea class="imgtext_textarea" style="margin-bottom: 20px; margin-top: 0;" rows="5" v-model="updateImgtxt"></textarea>
      <el-upload
        :action="uploadSrc"
        :data="uploadImgData"
        accept=".jpg,.jpeg,.png,.JPG,.JPEG"
        :limit="9"
        :file-list="updateImgList"
        list-type="picture-card"
        :on-success="uploadSuccess2"
        :on-remove="handleRemove2"
        :class="{hideAdd: fileList2.length >= 9}">
        <i class="el-icon-plus"></i>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="imagetextUpdateFn">{{ $t('imgText.btnChange') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { imagetextSendmsg, imagetextUpdate, imagetextDeletemsg } from '../../services/room/index.js'
import { formatDate } from '../../utils/tool'
import { VITE_baseUrl } from '../../constants.js'
const baseUrl = process.env.NODE_ENV === 'development'?'https://a.ofweek.com:8081/uploadImg' : `https://${VITE_baseUrl}/api/fileremote`
export default {
  name: 'imgTextList',
  data () {
    return {
      dialogVisible: false,
      dialogVisible2: false,
      dialogVisible3: false,
      uploadSrc: baseUrl + '/file/uploadfile2',
      fileList: [],
      imgtxt: '',
      uploadImgData: {
        filetype: '0',
        module: 'msgpictext'
      },
      updateImgtxt: '',
      fileList2: [],
      updateImgList: [],
      updateMsgid: ''
    }
  },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
      imAccount: 'user/imAccount',
      user: 'user/user'
    })
  },
  props: {
    data: {
      type: Array
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isOver: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatDate,
    handleRemove (file) {
      this.fileList.forEach((item, index) => {
        if (file.response.data === item.url) {
          this.fileList.splice(index, 1)
        }
      })
      console.log(this.fileList)
    },
    handleRemove2 (file) {
      this.fileList2.forEach((item, index) => {
        if (file.url === item) {
          this.fileList2.splice(index, 1)
        }
      })
      console.log(this.fileList2)
    },
    uploadSuccess (response, file, fileList) {
      console.log(file)
      this.fileList.push({
        url: response.data
      })
      console.log(this.fileList)
    },
    uploadSuccess2 (response, file, fileList) {
      this.fileList2.push(response.data)
      console.log(this.fileList2)
    },
    tranFileId () {
      var idArr = []
      this.fileList.forEach(item => {
        idArr.push(item.url)
      })
      return idArr.join(',')
    },
    showPreview () {
      if (this.fileList.length == 0 && this.imgtxt.length == 0) {
        this.$message.error('请添加图片或者文字')
        return
      }
      this.dialogVisible = false
      this.dialogVisible2 = true
    },
    showEditDialog (item) {
      this.updateMsgid = item.msgId
      this.updateImgtxt = item.text
      this.updateImgList = []
      this.fileList2 = []
      item.imageVoList.forEach(item => {
        this.updateImgList.push({
          url: item.imageUrl
        })
        this.fileList2.push(item.imageUrl)
      })
      this.dialogVisible3 = true
    },
    // 发布图文
    issueFn () {
      let param = {
        fileUrl: '',
        roomId: this.roomId,
        senderId: this.imAccount,
        text: encodeURI(this.imgtxt),
        type: 1
      }

      if (this.fileList.length == 0 && this.imgtxt.length == 0) {
        this.$message.error('请添加图片或者文字')
        return
      } else if (this.fileList.length > 0 && this.imgtxt.length == 0) {
        param.type = 2
        param.fileUrl = this.tranFileId()
      } else if (this.fileList.length > 0 && this.imgtxt.length > 0) {
        param.type = 3
        param.fileUrl = this.tranFileId()
      }

      imagetextSendmsg(param).then(({ data }) => {
        let res = data
        if (res.code === 0) {
          this.$message.success('发送成功')
          this.imgtxt = ''
          this.fileList = []
          this.$refs['imgTextUpload'].clearFiles()
          this.dialogVisible2 = false
        } else {
          this.$message.error(res.message)
        }
      })
    },
    // 删除图文
    imgtextDelete (item) {
      this.$confirm('确认删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        imagetextDeletemsg({
          msgId: item.msgId,
          roomId: item.roomId
        }).then(({ data }) => {
          let res = data
          if (res.code === 0) {
            this.$message.success('删除成功')
          } else {
            this.$message.error(res.message)
          }
        })
      })
    },
    imagetextUpdateFn () {
      let param = {
        fileUrl: '',
        msgId: this.updateMsgid,
        text: encodeURI(this.updateImgtxt),
        type: 1
      }

      if (this.fileList2.length == 0 && this.updateImgtxt.length == 0) {
        this.$message.error('请添加图片或者文字')
        return
      } else if (this.fileList2.length > 0 && this.updateImgtxt.length == 0) {
        param.type = 2
        param.fileUrl = this.fileList2.join(',')
      } else if (this.fileList2.length > 0 && this.updateImgtxt.length > 0) {
        param.type = 3
        param.fileUrl = this.fileList2.join(',')
      }

      imagetextUpdate(param).then(({ data }) => {
        let res = data
        if (res.code === 0) {
          this.$message.success('修改成功')
          this.dialogVisible3 = false
        } else {
          this.$message.error(res.message)
        }
      })
    }
  },
  created () {

  },
  mounted () {

  }
}
</script>

<style lang="scss" scoped>
.hideAdd {
  >>> .el-upload--picture-card {
    display: none;
  }
}

.img_text {
  margin-left: 5px;
  border-left: 1px dashed #2691E9;

  li {
    padding-left: 25px;
    padding-bottom: 20px;
    color: #808080;
    line-height: 1.5em;

    .img_text_time {
      position: relative;
      margin-bottom: 10px;

      &::after {
        position: absolute;
        left: -30px;
        top: 5px;
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 10px;
        background: #2691E9;
        visibility: visible;
      }

      i {
        margin-right: 10px;
        font-size: 20px;
        font-style: normal;
        cursor: pointer;
      }
    }

    .img_text_img {
      max-width: 100%;
    }

    .img_text_con {
      padding: 22px 25px;
      background: #F9F9F9;
      border-radius:4px;

      h3 {
        font-size: 14px;
        color: #1F1F1F;
        font-weight: 500;
        margin-bottom: 12px;
      }

      p {
        margin-top: 10px;

        &:first-child {
          margin-top: 0;
        }
      }

      .img_text_img {
        display: block;
        max-width: 100%;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
.no_data_tip {
  text-align: center;
  color: #808080;
  padding: 100px 0;
}
.over_data_tip {
  text-align: center;
  color: #808080;
}

.imgtext_textarea {
  width: 100%;
  border: 0;
  margin-top: 20px;
  padding: 10px;
  background: #fff;
  border: 1px solid #E5E5E5;
  border-radius: 4px;
  resize: none;
  outline: none;
}
.imgtext_control_wrap {

  .imgtext_control {
    padding: 10px 0;

    .fl {
      color: #E65E50;
      line-height: 32px;

      i {
        display: inline-block;
        width: 14px;
        height: 14px;
        font-size: 12px;
        text-align: center;
        line-height: 14px;
        font-style: normal;
        border: 1px solid #E65E50;
        border-radius: 14px;
        margin-right: 10px;
        vertical-align: middle;
      }
    }
    .fr {
      font-size: 0;
      text-align: right;

      span {
        display: inline-block;
        height: 32px;
        padding: 0 16px;
        font-size: 14px;
        color: #fff;
        line-height: 32px;
        border-radius: 4px;
        background: #2691E9;
        margin-left: 10px;
        cursor: pointer;
        user-select: none;
      }
    }
  }
}

.imgtext_preview {
  p {
    font-size: 14px;
    color: #808080;
    line-height: 1.5em;
    margin-bottom: 10px;
  }
  img {
    max-width: 100%;
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
