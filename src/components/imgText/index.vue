<template>
  <div class="wrap-container">
    <div class="tabs">
      <ul>
        <li
          v-for="(item, index) in tab"
          :class="{ active: active === item.menuType }"
          @click="clickTab(item.menuType)"
          :key="index"
          :title="tabTransEn(item.menuType)"
        >
          {{ tabTransEn(item.menuType) }}
        </li>
      </ul>
      <div
        class="fr questionnaire_btn"
        @click="showQuesListDialog"
        v-show="questionnaireBtnShow"
      >
        <span class="dot">{{ $t('questionnaire.survey') }}</span>
      </div>
    </div>

    <div v-show="active === 6" class="tabs_con">
      <introduce />
    </div>

    <div v-show="active === 2" class="tabs_con">
      <img-text-list
        :data="imgTextDataList"
        :isLoading="imgTextLoading"
        :isOver="imgTextIsover"
      />
    </div>

    <div v-show="active === 4" class="tabs_con">
      <product />
    </div>

    <div v-show="active === 5" class="tabs_con">
      <download
        :data="downloadDataList"
        :isLoading="downloadLoading"
        :isOver="downloadIsover"
      />
    </div>
  </div>
</template>

<script>
import { IM_EVENT } from '../../sdk/imLive'
import imgTextList from './imgText.vue'
import product from './product.vue'
import download from './download.vue'
import introduce from './introduce.vue'
// import question from './components/question'
import { mapState, mapGetters, mapMutations } from 'vuex'
import {
  imagetextGetmoremsg,
  getroomdata,
  getQuestionnaireOne,
  getRoomQuestionnaireList,
} from '../../services/room/index.js'
export default {
  name: 'imgText',
  data() {
    return {
      defineTab: [
        { menuType: 6, name: '活动介绍', sort: 0 },
        { menuType: 2, name: '图文直播', sort: 0 },
        { menuType: 4, name: '产品展示', sort: 0 },
        { menuType: 5, name: '资料下载', sort: 0 },
      ],
      tab: [],
      active: 0,
      imgTextDataList: [],
      imgTextMsgId: '',
      imgTextLoading: false,
      imgTextIsover: false,
      downloadDataList: [],
      downloadLoading: false,
      downloadIsover: false,
      downloadQuery: {
        roomid: '',
        pagenum: 1,
        pagesize: 50,
      },
      quesListDialog: false,
      quesListData: [],
      quesListRequireData: [],
      questionDialog: false,
      questionData: {},
      questionnaireBtnShow: false,
    }
  },
  computed: {
    ...mapState({
      imClient: ({ imClient }) => imClient,
    }),
    ...mapGetters({
      roomId: 'room/roomId',
      room: 'room/room',
      isVisitorLogin: 'user/isVisitorLogin',
      liveStatus: 'room/liveStatus',
      phoneRegisterShow: 'user/phoneRegisterShow',
      user: 'user/user',
    }),
  },
  components: {
    imgTextList,
    product,
    download,
    introduce,
    // question
  },
  methods: {
    ...mapMutations([
      // 'setDialogShopVideo',
      'openLogin',
      'openCard',
    ]),
    clickTab(index) {
      this.active = index
    },
    tabTransEn(type) {
      switch (type) {
        case 2:
          return this.$t('menu.type2')
          break
        case 4:
          return this.$t('menu.type4')
          break
        case 5:
          return this.$t('menu.type5')
          break
        case 6:
          if (this.roomId === '211') {
            return 'Presentation'
          } else {
            return this.$t('menu.type6')
          }
          break
      }
    },
    getImgTextData() {
      if (this.imgTextIsover) return
      return new Promise((resolve) => {
        this.imgTextLoading = true
        imagetextGetmoremsg({
          msgId: this.imgTextMsgId,
          roomId: this.roomId,
          size: 20,
        }).then(({ data }) => {
          let res = data
          let _arr = res.data
          if (_arr.length < 20) {
            this.imgTextIsover = true
          }
          if (_arr.length > 0) {
            this.imgTextMsgId = _arr[_arr.length - 1].msgId
          }

          this.imgTextDataList = this.imgTextDataList.concat(_arr)
          this.imgTextLoading = false
          resolve()
        })
      })
    },
    getDownloadData() {
      if (this.downloadIsover) return
      return new Promise((resolve) => {
        this.downloadLoading = true
        getroomdata(this.downloadQuery).then(({ data }) => {
          let res = data
          if (
            res.data.totalPage === this.downloadQuery.pagenum ||
            res.data.totalPage === 0
          ) {
            this.downloadIsover = true
          } else {
            this.downloadQuery.pagenum++
          }
          this.downloadDataList = this.downloadDataList.concat(res.data.items)
          this.downloadLoading = false
          resolve()
        })
      })
    },
    scrollTop() {
      return Math.max(
        document.body.scrollTop,
        document.documentElement.scrollTop
      )
    },
    documentHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      )
    },
    windowHeight() {
      return document.compatMode == 'CSS1Compat'
        ? document.documentElement.clientHeight
        : document.body.clientHeight
    },
    compare(property) {
      return function (a, b) {
        var value1 = a[property]
        var value2 = b[property]
        return value2 - value1
      }
    },
    showQuesListDialog() {
      if (this.isVisitorLogin) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
        return
      }
      if (this.quesListData.length == 1) {
        this.showQuestion(this.quesListData[0].questionnaireId)
      } else if (this.quesListData.length > 1) {
        this.quesListDialog = true
        if (this.quesListRequireData.includes(1)) {
          // this.setDialogShopVideo(true)
        }
      }
    },
    beforeCloseQuesList(done) {
      // 列表中有必填问卷
      if (this.quesListRequireData.includes(1)) {
        this.$confirm(this.$t('common.closeQuit'), this.$t('common.hint'), {
          confirmButtonText: this.$t('common.affirm'),
          cancelButtonText: this.$t('common.cancel'),
          type: 'warning',
        })
          .then(() => {})
          .catch((action) => {
            if (action === 'cancel') {
              window.location.href = 'https://live.ofweek.com/'
            }
          })
      } else {
        // this.setDialogShopVideo(false)
        done()
      }
    },
    showQuestion(id) {
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
        return
      }
      getQuestionnaireOne({ roomid: this.roomId, questionnaireid: id }).then(
        ({ data }) => {
          let res = data
          this.questionData = res.data
          if (this.questionData.questionnaireType === 1) {
            // this.setDialogShopVideo(true)
          }
          this.quesListDialog = false
          this.questionDialog = true
        }
      )
    },
    closeQuestionDialog() {
      this.questionDialog = false
      // this.setDialogShopVideo(false)
      if (this.quesListRequireData.includes(1)) {
        this.showQuesListDialog()
      }
      if (this.quesListData && this.quesListData.length > 0) {
        this.questionnaireBtnShow = true
      }
    },
    quesChange(val) {
      this.quesListData.forEach((item, index) => {
        if (item.questionnaireId == val) {
          this.quesListData.splice(index, 1)
          this.quesListRequireData.splice(index, 1)
        }
      })
      if (this.quesListData && this.quesListData.length < 1) {
        this.questionnaireBtnShow = false
      }
    },
    bindEvent() {
      if (!this.imClient) {
        return
      }
      this.imClient.on(IM_EVENT?.msgReceive, this.onMsgReceive)
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i]
          const payloadData = JSON.parse(msg.payload?.data)
          let msgCode = payloadData.msgCode
          if (payloadData.roomId != this.roomId) {
            return
          }
          switch (String(msgCode)) {
            // 广播图文直播消息
            case '1001':
              console.log('广播图文直播消息1001')
              console.log(payloadData)
              this.imgTextDataList.unshift(payloadData)
              break

            // 删除图文消息
            case '1016':
              console.log('删除图文消息1016')
              console.log(payloadData)
              this.imgTextDataList = this.imgTextDataList.filter((item) => {
                return item.msgId == payloadData.msgId ? false : true
              })
              break

            // 更新图文消息
            case '1022':
              console.log('更新图文消息1022')
              console.log(payloadData)
              this.imgTextDataList.forEach((item, index) => {
                if (item.msgId == payloadData.msgId) {
                  let time = item.createDate
                  this.imgTextDataList.splice(index, 1, payloadData)
                  this.$set(this.imgTextDataList[index], 'createDate', time)
                }
              })
              break
            // 发送直播间问卷
            case '1026':
              console.log('发送直播间问卷1026')
              console.log(payloadData)
              // 已答过该问卷
              if (
                payloadData.alreadyMemberIds.includes(
                  Number(this.user.imAccount)
                )
              ) {
                return
              }
              // 如果登录了且已经完善名片直接显示问卷
              if (this.user.role === 3 && this.user.isCompletedInfo === 1) {
                this.showQuestion(payloadData.questionnaireDto.questionnaireId)
              }
              // 判断列表中是否已存在
              let _arr = this.quesListData.some((item, index) => {
                return (
                  item.questionnaireId ==
                  payloadData.questionnaireDto.questionnaireId
                )
              })
              if (!_arr) {
                this.quesListData.push({
                  isSend: 1,
                  questionnaireId: payloadData.questionnaireDto.questionnaireId,
                  questionnaireIntroduction:
                    payloadData.questionnaireDto.questionnaireIntroduction,
                  questionnaireTitle:
                    payloadData.questionnaireDto.questionnaireTitle,
                  questionnaireType:
                    payloadData.questionnaireDto.questionnaireType,
                })
                this.quesListRequireData.push(
                  payloadData.questionnaireDto.questionnaireType
                )
              }
              break
          }
        }
      } catch (err) {
        console.warn('fail to pass msg of im')
      }
    },
  },
  created() {
    this.bindEvent()
    // 显示后台配置的tab菜单
    this.room.menulist.forEach((item) => {
      this.defineTab.forEach((item2) => {
        if (item.menuType === item2.menuType) {
          item.sort = item2.sort
          this.tab.push(item)
        }
      })
    })
    // this.tab.sort(this.compare('sort'))
    this.active = this.tab[0].menuType

    // 问卷
    if (this.user.role !== 1 && this.user.role !== 2) {
      let _questionnaireDtoList = this.room.questionnaireDtoList

      if (this.isVisitorLogin) {
        getRoomQuestionnaireList({ roomid: this.roomId }).then((res) => {
          let list = res.data.filter((item) => {
            return item.isSend === 1
          })
          if (list.length > 0) {
            this.questionnaireBtnShow = true
          }
        })
      } else {
        if (_questionnaireDtoList.length > 0) {
          _questionnaireDtoList.forEach((item, index) => {
            if (item.isSend === 1) {
              this.quesListData.push(item)
              this.quesListRequireData.push(item.questionnaireType)
            }
          })

          if (this.quesListData.length > 0) {
            this.questionnaireBtnShow = true
          }

          if (
            this.quesListData.length == 1 &&
            this.user.isCompletedInfo === 1 &&
            !this.phoneRegisterShow
          ) {
            this.showQuestion(this.quesListData[0].questionnaireId)
          } else if (this.quesListData.length > 1) {
            this.showQuesListDialog()
          }
        }
      }
    }

    this.downloadQuery.roomid = this.roomId

    this.getImgTextData()
    this.getDownloadData()

    setTimeout(() => {
      window.onscroll = () => {
        // console.log(this.scrollTop(),this.windowHeight(),this.documentHeight())
        if (
          this.scrollTop() + this.windowHeight() >=
          this.documentHeight() - 50
        ) {
          // console.log('bottom')
          if (this.active === 2) {
            if (this.imgTextIsover || this.imgTextLoading) {
              return
            } else {
              this.getImgTextData()
            }
          } else if (this.active === 5) {
            if (this.downloadIsover || this.downloadLoading) {
              return
            } else {
              this.getDownloadData()
            }
          }
        }
      }
    }, 1)
  },
}
</script>

<style lang="scss" scoped>
.questionnaire_btn {
  max-width: 160px;
  height: 34px;
  margin-top: 8px;
  border: 1px solid #2691e9;
  border-radius: 4px;
  font-size: 0;
  text-align: center;
  cursor: pointer;

  span {
    display: inline-block;
    width: 100%;
    font-size: 14px;
    color: #2691e9;
    line-height: 32px;
    padding: 0 5px 0 30px;
    background: url(../../assets/wj_icon.png) no-repeat 6px center;
    box-sizing: border-box;
    -webkit-box-sizing: border-box;
  }
}

.tabs_con {
  padding: 20px 50px 20px 45px;
}

.ques-list-dialog {
  li {
    margin-bottom: 10px;
    span {
      line-height: 32px;

      .ques-list-require {
        color: #e65e50;
      }
    }
  }
}
</style>
