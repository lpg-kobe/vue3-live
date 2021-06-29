<template>
  <div>
    <div class="question_block">
      <chatScroll ref="chatscroll" :wrapClass="'question_block'" @maxBottom="handleReachTop">
        <ul class="question height_ul2" v-show="dataList.length > 0">
          <li v-for="(item, index) of dataList" :key="index">
            <div class="question_item">
              <div class="clearfix">
                <i>{{ $t('question.ask') }}</i>
                <span class="name">{{ item.nick }}</span>
                <span class="fr time">{{ formatDate(item.createDate, 'hh:mm') }}</span>
              </div>
              <div class="ques_con" v-html="item.content.replace(/\n/g,'<br>')"></div>
            </div>
            <div class="question_answer_box" v-show="item.answerList && item.answerList.length > 0">
              <div class="question_item answer" v-for="(items, index) of item.answerList" :key="index">
                <div class="clearfix">
                  <span class="name">{{`${items.nick} | `}}<span>{{`${ langToIdentity(items.identity) }${$t('question.answer')}`}}</span></span>
                  <span class="fr time">{{ formatDate(items.createDate, 'hh:mm') }}</span>
                </div>
                <div class="ques_con" v-html="items.content.replace(/\n/g,'<br>')"></div>
              </div>
            </div>
          </li>
        </ul>
        <li class="chat-icon-loading" v-if="loading && !loadOver" v-loading="loading"></li>
        <li class="loading_over" v-if="loadOver && dataList.length > 5">{{ $t('common.loadOver') }}</li>
        <p class="no_data_tip" v-show="dataList.length < 1">{{ $t('question.noData') }}~</p>
      </chatScroll>
    </div>

    <div class="chat_input">
      <div class="chat_input_box">
        <p class="chat_other_tip" v-show="isVisitorLogin" v-on:click="openLogin(false)">
          {{ $t('chat.loginHint1') }}<a href="javascript:"> {{ $t('common.login') }} </a>{{ $t('chat.loginHint2') }}
        </p>
        <p class="chat_other_tip" v-show="!isVisitorLogin && isForbit">{{ $t('chat.forbitHint') }}</p>
        <textarea rows="2" class="chat_con" v-model="sendData" maxlength="140" :disabled="isVisitorLogin || isForbit" v-on:keypress="keyDown" :placeholder="isVisitorLogin || isForbit ? '' : $t('question.placehoad')"></textarea>
      </div>
      <div class="clearfix">
        <!-- <i class="face_icon"></i> -->
        <el-button class="chat-btn" size="small" type="primary" @click="send">{{ $t('card.submit') }}</el-button>
      </div>
    </div>

  </div>
</template>

<script>
import { IM_EVENT } from "../../sdk/imLive"
import { mapState, mapGetters, mapMutations } from 'vuex'
import { questionGetmoremsg, questionSendmsg, questionDeletemsg, questionUpdateanswer } from '../../services/room/index.js'
import chatScroll from './chatScroll.vue'
import Cookies from 'js-cookie'
import { formatDate } from '../../utils/tool'
export default {
  name: 'question',
  data () {
    return {
      dataList: [],
      loading: false,
      loadOver: false,
      sendData: '',
      questionId: 0
    }
  },
  computed: {
    ...mapState({
      imClient: ({ imClient }) => imClient
    }),
    ...mapGetters({
      roomId: 'room/roomId',
      user: 'user/user',
      imAccount: 'user/imAccount',
      isForbit: 'user/isForbit',
      liveStatus: 'room/liveStatus',
      isVisitorLogin: 'user/isVisitorLogin'
    })
  },
  components: { chatScroll },
  methods: {
    ...mapMutations([
      'openLogin',
      'openCard'
    ]),
    formatDate,
    handleClose (done) {
      done()
    },
    getData () {
      if (this.loadOver) return
      this.loading = true
      return new Promise(resolve => {
        questionGetmoremsg({ questionId: this.questionId, roomId: Number(this.roomId), size: 50 }).then(({data}) => {
          let res = data
          console.log(res, 'question')
          if (res.data.length < 50) {
            this.loadOver = true
          }
          let _arr = res.data

          if (_arr.length > 0) {
            this.questionId = _arr[_arr.length - 1].msgId
          }

          this.dataList = this.dataList.concat(_arr)
          console.log(this.dataList)
          this.loading = false
          this.$nextTick(() => {
            resolve(_arr.length)
          })
        })
      })
    },
    handleReachTop () {
      if (this.loadOver || this.loading) return
      this.loading = true
      setTimeout(() => {
        this.getData()
      }, 1000)
    },
    send () {
      if (this.isVisitorLogin) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
        return
      }

      if (this.sendData.length === 0) {
        console.log('请输入发送的内容！')
        return
      }

      questionSendmsg({
        content: {
          content: encodeURI(this.sendData),
          msgType: 1
        },
        roomId: this.roomId,
        senderId: this.imAccount,
        type: 1
      }).then(({ data }) => {
        let res = data
        if (res.code === 0) {
          this.sendData = ''
        }
      })
    },
    langToIdentity (identity) {
      switch (identity) {
        case '主播':
          return this.$t('chat.anchor')
          break;
        case '嘉宾':
          return this.$t('chat.guest')
          break;
        case '主持人':
          return this.$t('chat.compere')
          break;
        case '主讲人':
          return this.$t('chat.speaker')
          break;
        case '展商':
          return this.$t('chat.exhibitor')
          break;
        case '客服':
          return this.$t('chat.service')
          break;
        case '观众':
          return this.$t('chat.audience')
          break;
        default:
          return ''
      }
    },
    keyDown(e) {
      const { keyCode, shiftKey } = e;
      if (keyCode === 13) {
        if (shiftKey) {
          return;
        } else {
          e.preventDefault();
          this.send();
        }
      }
    },
    bindEvent() {
      if (!this.imClient) {
        return;
      }
      this.imClient.on(IM_EVENT?.msgReceive, this.onMsgReceive);
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i];
          const payloadData = JSON.parse(msg.payload?.data);
          let msgCode = payloadData.msgCode
          if (payloadData.roomId != this.roomId) {
            return
          }

          switch (String(msgCode)) {
            // 广播群问答消息
            case "1002":
              console.log('广播群问答消息1002')
              console.log(payloadData)
              if (payloadData.type === 1) {
                this.dataList.unshift(payloadData)
                this.$nextTick(() => {
                  setTimeout(() => {
                    this.$refs.chatscroll.toTop()
                  }, 1)
                })
              } else if (payloadData.type === 2) {
                this.dataList.forEach((item, index) => {
                  if (item.msgId === payloadData.questionId) {
                    if (this.dataList[index].answerList == undefined) {
                      this.$set(this.dataList[index], 'answerList', [])
                    }
                    this.dataList[index].answerList.push(payloadData)
                  }
                })
              }
              break

            // 广播更新了回答消息
            case "1003":
              console.log('广播更新了回答消息1003')
              console.log(payloadData)
              this.dataList.forEach(item => {
                if (item.msgId === payloadData.questionId) {
                  item.answerList.forEach((item2, index2) => {
                    if (item2.msgId == payloadData.msgId) {
                      item.answerList[index2].content = payloadData.content
                    }
                  })
                }
              })
              break

            // 审核通过问答消息
            case "1012":
              console.log('审核通过问答消息1012')
              console.log(payloadData)
              this.dataList.push(payloadData)
              this.$nextTick(() => {
                setTimeout(() => {
                  this.$refs.chatscroll.toTop()
                }, 1)
              })
              break

            // 审核不通过问答消息
            case "1013":
              console.log('审核不通过问答消息1013')
              break

            // 删除问答消息
            case "1015":
              console.log('删除问答消息1015')
              console.log(payloadData)
              if (payloadData.type === 1) {
                this.dataList = this.dataList.filter(item => {
                  return item.msgId == payloadData.msgId ? false : true;
                })
              } else if (payloadData.type === 2) {
                this.dataList.forEach(item => {
                  if (item.msgId === payloadData.questionId) {
                    item.answerList = item.answerList.filter(item2 => {
                      return item2.msgId == payloadData.msgId ? false : true;
                    })
                  }
                })
              }
              break
          }
        }
      } catch (err) {
        console.warn("fail to pass msg of im");
      }
    },
  },
  created () {
    this.bindEvent()
  },
  mounted () {
    this.getData()
  }
}
</script>
<style lang="scss" scoped>
.question {
  width: 360px;
  padding: 20px 20px 1px;

  >li {
    margin-bottom: 20px;
    // background: #f1f1f1;

    .question_answer_box {
      position: relative;
      margin-top: 15px;
      border-radius: 4px;
      background: #f4f4f4;

      .answer {
        padding: 10px;
        border-top: 1px solid #E6E6E6;

        &:first-child {
          border-top: 0;
        }
      }

      &::after {
        position: absolute;
        top: -20px;
        left: 20px;
        content: '';
        width: 0;
        height: 0;
        border: 10px solid;
        border-color: transparent transparent #f4f4f4;
      }
    }


    .question_item {
      padding: 0;

      .clearfix {
        font-size: 0;
      }

      i {
        display: inline-block;
        width: 24px;
        height: 24px;
        font-size: 12px;
        color: #fff;
        font-style: normal;
        text-align: center;
        line-height: 26px;
        border-radius: 24px;
        background: #e65f51;
        margin-right: 10px;
      }

      .name {
        font-size: 14px;
        font-weight: bold;
        line-height: 24px;

        span {
          color: #2691E9;
        }
      }

      .time {
        font-size: 14px;
        color: #808080;
        line-height: 24px;
      }

      .ques_con {
        color: #808080;
        line-height: 1.5em;
        margin-top: 5px;
        word-wrap: break-word;
      }

      .question_control {
        text-align: right;
        font-size: 0;
        margin-top: 3px;

        span {
          display: inline-block;
          height: 21px;
          padding: 0 4px;
          margin-left: 14px;
          font-size: 12px;
          color: #2691E9;
          line-height: 21px;
          background: #EAF5FE;
          border-radius: 2px;
          cursor: pointer;
          user-select: none;
        }
        .grey_btn {
          color: #808080;
          background: #EEEEEE;
        }
      }
    }
  }
}

.chat_input {
  padding: 12px 20px 28px;

  input, textarea {
    width: 100%;
    padding: 7px 11px;
    border: 1px solid #E6E6E6;
    border-radius: 4px;
    margin-bottom: 12px;
    resize: none;
  }

  input:disabled, textarea:disabled {
    border: 1px solid #E6E6E6;
    background: #F5F7FA;
    opacity: 1;
  }

  i {
    position: relative;
    float: left;
    width: 24px;
    height: 24px;
    background: url(../../assets/smile.png) no-repeat;
    cursor: pointer;
  }
}

.chat_input_box {
  position: relative;

  .chat_other_tip {
    position: absolute;
    left: 10px;
    top: 5px;
    color: #ccc;
    width: 296px;
    height: 32px;

    a {
      color: #2691E9;
    }
  }
}
.loading_over {
  padding: 0 !important;
  text-align: center;
  color: #808080;
}
.no_data_tip {
  text-align: center;
  padding-top: 100px;
  color: #808080;
}

.question_block {
  // height: calc(100% - 252px);
  height: 350px;

  .vue2-scroll-bar {
    width: 100%;
    height: 100%;
  }
}

.question_textarea {
  width: 100%;
  border: 0;
  margin-top: 20px;
  padding: 10px;
  background: #F5F5F5;
  border-radius: 4px;
  resize: none;
  outline: none;
}
</style>
