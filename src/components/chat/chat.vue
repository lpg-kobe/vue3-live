<template>
  <div class="chat-wrap">
    <!-- <div class="chat_notice_bar"><p>公告：本场直播至下午5点结束</p></div> -->
    <div class="chat_block">
      <chatScroll ref="chatscroll" :wrapClass="'chat_block'" @maxTop="handleReachTop">
        <ul class="chat_list" ref="height_ul" id="height_ul">
          <li class="chat-icon-loading" v-if="loading && !loadOver" v-loading="loading"></li>
          <li class="loading_over" v-if="loadOver && dataList.length > 5">{{ $t('common.loadOver') }}</li>
          <!-- compere 主持人样式 -->
          <li class="chat_item" v-for="(item, index) of dataList" :key="index">
            <div class="chat_user_box">
              <span class="chat_user_name compere" v-if="item.identity === 'enterMsg'">
                {{ item.nick }}{{ $t('chat.enter') }}
              </span>
              <span class="chat_user_name chat_error_msg" v-if="item.identity === 'errorMsg'">
                {{ item.content }}
              </span>
              <span :class="['chat_user_name', {compere: item.role === 1 || item.role === 2}]" v-if="item.identity !== 'enterMsg' && item.identity !== 'errorMsg'">
                <!-- {{ item.nick }} -->
                {{item.nick.replace(/^游客/, $t('head.visitor'))}}
                <!-- identity -->
                <span v-if="item.role === 1 || item.role === 2">{{ `[${ langToIdentity(item.identity) }]` }}</span>
              </span>
            </div>
            <p v-if="item.type === 1" v-html="faceToHTML(item.content.replace(/\n/g,'<br>'))" v-on:mousedown="banDragImage"></p>
            <el-image
              v-if="item.type === 2"
              :src="item.content"
              :preview-src-list="[item.content]">
            </el-image>
          </li>
        </ul>
        <p class="no_data_tip" v-show="dataList.length < 1">{{ $t('chat.noData') }}~</p>
      </chatScroll>
    </div>

    <div class="chat_input">
      <div class="chat_input_box">
        <p class="chat_other_tip" v-show="isVisitorLogin && !visitorChat" v-on:click="openLogin(false)">
          <!-- 请登录后发言 -->
          {{ $t('chat.loginHint1') }}<a href="javascript:"> {{ $t('common.login') }} </a>{{ $t('chat.loginHint2') }}
        </p>
        <p class="chat_other_tip" v-show="visitorChat ? isForbit : isForbit && !isVisitorLogin">{{ $t('chat.forbitHint') }}</p>
        <textarea rows="2" class="chat_con" ref="textarea1" v-model="sendData" :disabled="(isVisitorLogin && !visitorChat) || isForbit" v-on:keypress="keyDown" :placeholder="(isVisitorLogin && !visitorChat) || isForbit ? '' : $t('chat.placehoad')"></textarea>
      </div>
      <div class="clearfix">
        <i class="face_icon" @click="switchDisplayFace">
          <ul class="clear" v-show="displayFace">
            <el-scrollbar>
              <li v-for="item in face" :key="item.face_id" v-on:click="selectFace(item.face_name)">
                <img :src="faceUrl + item.face_name + '@2x.png'">
              </li>
            </el-scrollbar>
          </ul>
        </i>
        <el-upload
          :action="uploadSrc"
          :data="uploadImgData"
          accept=".jpg,.jpeg,.png,.JPG,.JPEG"
          :before-upload="beforeChatUpload"
          :on-success="chatUploadSuccess"
          :on-error="chatUploadError"
          :show-file-list="false"
          class="upload_img_icon_box">
          <i class="upload_img_icon" v-show="user.role === 1 || user.role === 2"></i>
        </el-upload>

        <el-button class="chat-btn" size="small" type="primary" @click="send">{{ $t('common.send') }}</el-button>
      </div>
    </div>

  </div>
</template>

<script>
import { IM_EVENT } from "../../sdk/imLive"
import { mapState, mapGetters, mapMutations } from 'vuex'
import { groupGetmoremsg, groupSendmsg, groupDeletemsg, forbitchat, shotoff, leaveroom } from '../../services/room/index.js'
import { emoji } from '../../assets/js/emoji'
import chatScroll from './chatScroll.vue'
import Cookies from 'js-cookie'
import { VITE_baseUrl } from '../../constants.js'
const baseUrl = process.env.NODE_ENV === 'development'?'https://a.ofweek.com:8081/uploadImg' : `https://${VITE_baseUrl}/api/fileremote`
export default {
  name: 'chatList',
  data () {
    return {
      uploadSrc: baseUrl + '/file/uploadfile2',
      uploadImgData: {
        filetype: '0',
        module: 'msgpictext'
      },
      dataList: [],
      loading: false,
      loadOver: false,
      sendData: '',
      msgId: '',
      faceUrl: `https://${VITE_baseUrl}/file/static/img/face/emoji/`,
      displayFace: false,
      face: emoji,
      faceRegExp: /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g
    }
  },
  computed: {
    ...mapState({
      imClient: ({ imClient }) => imClient
    }),
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      user: 'user/user',
      imAccount: 'user/imAccount',
      isForbit: 'user/isForbit',
      liveStatus: 'room/liveStatus',
      pv: 'room/pv',
      isVisitorLogin: 'user/isVisitorLogin'
    }),
    visitorChat () {
      return this.room.watchMode === 1
    }
  },
  components: { chatScroll },
  methods: {
    ...mapMutations([
      'openLogin',
      'openCard',
      'setIsForbit'
    ]),
    getData () {
      if (this.loadOver) return
      this.loading = true
      return new Promise(resolve => {
        groupGetmoremsg({ msgId: this.msgId, roomId: this.roomId, size: 50 }).then(({ data }) => {
          let res = data
          if (res.data.length < 50) {
            this.loadOver = true
          }
          let _arr = res.data.reverse()

          if (_arr.length > 0) {
            this.msgId = _arr[0].msgId
          }

          this.dataList = _arr.concat(this.dataList)
          this.loading = false
          this.$nextTick(() => {
            resolve(_arr.length)
          })
        })
      })
    },
    handleReachTop () {
      if (this.loadOver) return
      this.loading = true
      setTimeout(() => {
        this.getData().then((val) => {
          this.$refs.chatscroll.toLi(val)
        })
      }, 1000)
    },
    faceToHTML (value) {
      if (!value) return ''
      const url = this.faceUrl
      value = value.replace(this.faceRegExp, word => {
        let includeFace = this.face.filter(item => {
          return item.face_name === word
        })
        if (includeFace.length > 0) {
          return '<img width="24" src="' + url + word + '@2x.png" />'
        } else {
          return word
        }
      })
      return value
    },
    switchDisplayFace () {
      if (this.isVisitorLogin && !this.visitorChat) {
        this.openLogin(false)
        return
      }
      if (this.isForbit) {
        return
      }
      this.displayFace = !this.displayFace
    },
    selectFace (face) {
      this.sendData += face
      document.querySelector('.chat_con').focus()
    },
    // 禁止拖动表情图片
    banDragImage (e) {
      if (e.target.tagName === 'IMG') {
        e.preventDefault()
      }
    },
    beforeChatUpload (file) {
      const isMax = file.size / 1024 / 1024 < 2;
      if (!isMax) {
        this.$message.error(this.$t('chat.oversize') +'2MB!');
      }
      return isMax
    },
    chatUploadSuccess (res) {
      if (res.code === 0) {
        groupSendmsg({
          content: {
            content: encodeURI(res.data),
            msgType: 2
          },
          roomId: this.roomId,
          senderId: this.imAccount
        }).then(({ data }) => {

        })
      }
    },
    chatUploadError (err) {
      this.$message.error(JSON.parse(String(err).split(': ')[1]))
    },
    send () {
      if (this.isVisitorLogin && !this.visitorChat) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0 && !this.visitorChat) {
        this.openCard(false)
        return
      }

      if (this.sendData.length === 0) {
        return
      } else if (this.sendData.length > 1000) {
        this.$message.error(this.$t('chat.overlength') + '!')
        return
      }

      groupSendmsg({
        content: {
          content: encodeURI(this.sendData),
          msgType: 1
        },
        roomId: this.roomId,
        senderId: this.isVisitorLogin ? '94' : this.imAccount,
        userType: this.isVisitorLogin ? 2 : 1,
        visitor: this.isVisitorLogin ? this.imAccount : ''
      }).then(({ data }) => {
        let res = data
        if (res.code === 0) {
          this.sendData = ''
        }
      })
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
    toBottomFn () {
      this.$refs.chatscroll.toBottom()
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
    chatAddErrorMsg (msg) {
      let obj = {
        roomId: this.roomId,
        msgCode: 1000,
        nick: 'system',
        identity: "errorMsg",
        content: msg,
        isForbit: 1,
        role: 3,
        memberId: '',
      };

      this.dataList.push(obj);

      this.$nextTick(() => {
        this.$refs.chatscroll.toBottom()
      })
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
            // 广播群互动消息
            case "1000":
              console.log('广播群互动消息1000')
              // console.log(payloadData)
              this.dataList.push(payloadData)
              this.$nextTick(() => {
                setTimeout(() => {
                  this.$refs.chatscroll.toBottom()
                }, 1)
              })
              break

            // 审核通过互动聊天消息
            case "1010":
              console.log('审核通过互动聊天消息1010')
              this.dataList.push(payloadData)
              this.$nextTick(() => {
                setTimeout(() => {
                  this.$refs.chatscroll.toBottom()
                }, 1)
              })
              break

            // 审核不通过互动聊天消息
            case "1011":
              console.log('审核不通过互动聊天消息1011')
              break

            // 删除群互动消息
            case "1014":
              console.log('删除群互动消息1014')
              this.dataList = this.dataList.filter(item => {
                return item.msgId == payloadData.msgId ? false : true
              })
              break

            // 禁言/取消禁言用户消息
            case "1017":
              console.log('禁言/取消禁言用户消息1017')
              console.log(payloadData)

              if (payloadData.memberId == this.imAccount || payloadData.visitorId === this.imAccount) {
                if (payloadData.type === 1) {
                  this.setIsForbit(true)
                  this.$message.warning(this.$t('chat.deny'))
                } else if (payloadData.type === 2) {
                  this.setIsForbit(false)
                  this.$message.success(this.$t('chat.clearDeny'))
                }
              }

              this.dataList.forEach(item => {
                if (payloadData.memberId == item.senderId || payloadData.visitorId === item.visitorId) {
                  if (payloadData.type === 1) {
                    item.isForbit = 1
                  } else if (payloadData.type === 2) {
                    item.isForbit = 2
                  }
                }
              })
              break

            // 踢出用户消息
            case "1018":
              console.log('踢出用户消息1018')
              if (payloadData.memberId == this.imAccount) {
                this.$EventBus.$emit('timKickOut') // 停止发送心跳 & 停止播放视频
                this.$alert(this.$t('chat.kickout') + '！', this.$t('common.hint'), {
                  type: 'warning',
                  showClose: false,
                  confirmButtonText: this.$t('common.affirm'),
                  callback: action => {
                    location.href = 'https://live.ofweek.com/'
                  }
                })
                // 没有点确定3秒后自动退到列表
                setTimeout(() => {
                  location.href = 'https://live.ofweek.com/'
                }, 3000)
              }
              break

            // 1005广播直播间统计数据
            case "1005":
              this.$store.commit({
                type: "room/setState",
                key: 'pv',
                value: payloadData.pv
              });
              break

            // 进入直播间广播消息
            case "1020":
              console.log('进入直播间广播消息1020')
              console.log(payloadData)
              if (payloadData.isEntry === 1) {
                return
              } else if (payloadData.isEntry === 0) {
                let obj = {
                  roomId: payloadData.roomId,
                  msgCode: payloadData.msgCode,
                  nick: payloadData.nick,
                  identity: "enterMsg",
                  isForbit: payloadData.isForbit,
                  role: payloadData.role,
                  memberId: payloadData.memberId,
                };

                this.dataList.push(obj);

                this.$nextTick(() => {
                  this.$refs.chatscroll.toBottom()
                })
              }
              break
            }

        }
      } catch (err) {
        console.warn("fail to pass msg of im");
      }
    }
  },
  created () {
    this.bindEvent()
  },
  mounted () {
    // 鼠标点击任何地方都隐藏表情
    document.body.addEventListener('click', (e) => {
      if (e.target.className.indexOf('face_icon') < 0) {
        this.displayFace = false
      }
    })

    // 获取聊天数据后滚动到最低部
    this.getData().then(() => {
      this.$refs.chatscroll.toBottom()
    })

    // 提示错误信息
    // this.$EventBus.$on('chatAddErrorMsg', this.chatAddErrorMsg)
  }
}
</script>
<style lang="scss">
  .chat-btn {
    float: right;
    min-width: 60px;
    font-size: 14px;
  }
  .chat_input {
    .el-button--primary {
      color: #fff;
      background-color: #e65e50;
      border-color: #e65e50
    }

    .el-button--primary.is-active,
    .el-button--primary:active,
    .el-button--primary:focus,
    .el-button--primary:hover {
      background: #e04435;
      border-color: #e04435;
      color: #fff
    }

    .el-button--primary:active {
      outline: 0
    }
    .el-button--primary.is-disabled,
    .el-button--primary.is-disabled:active,
    .el-button--primary.is-disabled:focus,
    .el-button--primary.is-disabled:hover {
      color: #fff;
      background-color: #e68080;
      border-color: #e68080
    }
  }

  .el-dropdown-menu.chat-el-dropdown {
    background: rgba($color: #000000, $alpha: 0.8);
    border: none;
  }
  .chat-el-dropdown.el-popper[x-placement^=bottom] .popper__arrow::after {
    border-bottom-color: rgba($color: #000000, $alpha: 0.8);
  }
  .chat-el-dropdown.no-dropdown.el-popper[x-placement^=bottom] .popper__arrow::after {
    border-bottom-color: #fff;
  }
  .chat-el-dropdown .el-dropdown-menu__item {
    color: #999;
  }
  .chat-el-dropdown .el-dropdown-menu__item:focus,.chat-el-dropdown .el-dropdown-menu__item:not(.is-disabled):hover {
    background-color: rgba($color: #000000, $alpha: 0.9);
    color: #fff
  }

  .face_icon {
    .el-scrollbar {
      height: 100%;
    }
    .el-scrollbar__bar.is-vertical {
      width: 4px;
    }
    .el-scrollbar__wrap {
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
  .upload_img_icon_box {
    float: left;
    width: 24px;
    height: 24px;
  }
  .el-image-viewer__close {
    color: #fff;
  }
  .el-image-viewer__mask {
    opacity: .7;
  }
</style>
<style lang="scss" scoped>
.chat_notice_bar {
  padding: 0 20px;
  height: 40px;
  background: #FFF6E2;

  p {
    color: #E65E50;
    line-height: 40px;
  }
}

.chat_list {
  width: 360px;
  padding: 0 19px;

  li {
    padding: 15px 0;

    .chat_user_name {
      font-size: 14px;
      font-weight: bold;
    }
    .compere {
      color: #2691E9;
    }
    .chat_error_msg {
      color: #E65E50;
    }
    .point_style {
      cursor: pointer;
    }

    p {
      margin-top: 10px;
      color: #808080;
      line-height: 1.5em;
      word-wrap: break-word;
    }

    >>> img {
      margin-top: 10px;
      max-width: 50%;
    }

  }
  li:first-child {
    padding-top: 5px;
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

  i.face_icon {
    position: relative;
    float: left;
    width: 24px;
    height: 24px;
    background: url(../../assets/smile.png) no-repeat;
    cursor: pointer;

    ul {
      position: absolute; left: 0; bottom: 25px; width: 185px; border-left: 1px solid #d4d4d4;
      height: 88px;
      background: #fff;

      li {
        float: left; width: 29px; height: 29px; text-align: center; border-right: 1px solid #d4d4d4; border-bottom: 1px solid #d4d4d4; background: #fff;
      }
      li:nth-child(1),li:nth-child(2),li:nth-child(3),li:nth-child(4),li:nth-child(5),li:nth-child(6) {
        border-top: 1px solid #d4d4d4;
      }

      img {
        width: 24px;
        height: 24px;
        margin-top: 3px;
      }
    }
  }
  .upload_img_icon {
    float: left;
    width: 24px;
    height: 24px;
    margin-left: 20px;
    background: url(../../assets/imgIcon.png) no-repeat center;
    cursor: pointer;
  }
}
.loading_over {
  padding: 10px 0 0 !important;
  text-align: center;
  color: #808080;
}
.no_data_tip {
  text-align: center;
  padding-top: 100px;
  color: #808080;
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

.chat_block {
  // height: calc(100% - 252px);
  height: 350px;

  .vue2-scroll-bar {
    width: 100%;
    height: 100%;
  }
}
</style>
