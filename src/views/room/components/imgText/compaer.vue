<template>
  <div class="chat-wrap">
    <!-- <div class="chat_notice_bar"><p>公告：本场直播至下午5点结束</p></div> -->
    <div class="chat_block">
      <chatScroll
        ref="chatscroll"
        :wrapClass="'chat_block'"
        @maxTop="handleReachTop"
      >
        <ul class="chat_list" ref="height_ul" id="height_ul">
          <li
            class="chat-icon-loading"
            v-if="loading && !loadOver"
            v-loading="loading"
          ></li>
          <li class="loading_over" v-if="loadOver && dataList.length > 5">
            {{ $t("common.loadOver") }}
          </li>
          <!-- compere 主持人样式 -->
          <li class="chat_item" v-for="(item, index) of dataList" :key="index">
            <div class="chat_user_box">
              <span
                :class="[
                  'chat_user_name',
                  { compere: item.role === 1 || item.role === 2 },
                ]"
                v-if="user.role !== 1 && user.role !== 2"
              >
                {{ item.nick }}
                <span v-if="item.role === 1 || item.role === 2">{{
                  "[" + item.identity + "]"
                }}</span>
              </span>
              <el-dropdown
                class="black-dropdown"
                trigger="click"
                @command="handleCommand"
                v-if="user.role === 1 || user.role === 2"
              >
                <span class="el-dropdown-link">
                  <span
                    :class="[
                      'chat_user_name',
                      'point_style',
                      { compere: item.role === 1 || item.role === 2 },
                    ]"
                  >
                    {{ item.nick }}
                    <span v-if="item.role === 1 || item.role === 2">{{
                      "[" + item.identity + "]"
                    }}</span>
                  </span>
                </span>
                <el-dropdown-menu slot="dropdown" class="chat-el-dropdown">
                  <el-dropdown-item
                    :command="commandPara(item, 'a')"
                    v-show="item.senderId !== Number(imAccount)"
                    >{{ $t("chart.replyChart") }}</el-dropdown-item
                  >
                  <el-dropdown-item
                    :command="commandPara(item, 'b')"
                    v-show="
                      item.senderId === Number(imAccount) || user.role === 1
                    "
                    >{{ $t("chart.deleteChart") }}</el-dropdown-item
                  >
                  <el-dropdown-item
                    :command="commandPara(item, 'c')"
                    v-show="
                      item.senderId !== Number(imAccount) &&
                      item.isForbit === 2 &&
                      user.role === 1
                    "
                    >{{ $t("chart.onForbit") }}</el-dropdown-item
                  >
                  <el-dropdown-item
                    :command="commandPara(item, 'd')"
                    v-show="
                      item.senderId !== Number(imAccount) &&
                      item.isForbit === 1 &&
                      user.role === 1
                    "
                    >{{ $t("chart.offForbit") }}</el-dropdown-item
                  >
                  <el-dropdown-item
                    :command="commandPara(item, 'e')"
                    v-show="
                      item.senderId !== Number(imAccount) &&
                      user.role === 1 &&
                      item.role !== 6
                    "
                    >{{ $t("chart.tickOut") }}</el-dropdown-item
                  >
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <p
              v-if="item.type === 1"
              v-html="faceToHTML(item.content.replace(/\n/g, '<br>'))"
              v-on:mousedown="banDragImage"
            ></p>
            <img
              v-if="item.type === 2"
              :src="item.content"
              alt=""
              @click="showChartImg(item.content)"
            />
          </li>
        </ul>
        <p class="no_data_tip" v-show="dataList.length < 1">
          {{ $t("chart.noData") }}~
        </p>
      </chatScroll>
    </div>

    <div class="chat_input">
      <div class="chat_input_box">
        <p
          class="chat_other_tip"
          v-show="isVisitorLogin"
          v-on:click="openLogin(false)"
        >
          <!-- 请登录后发言 -->
          {{ $t("chart.loginHint1")
          }}<a href="javascript:"> {{ $t("common.login") }} </a
          >{{ $t("chart.loginHint2") }}
        </p>
        <p class="chat_other_tip" v-show="isForbit && !isVisitorLogin">
          {{ $t("chart.forbitHint") }}
        </p>
        <textarea
          rows="2"
          class="chat_con"
          ref="textarea1"
          v-model="sendData"
          :disabled="isVisitorLogin || isForbit"
          :placeholder="isVisitorLogin || isForbit ? '' : $t('chart.placehoad')"
        ></textarea>
      </div>
      <div class="clearfix">
        <i class="face_icon" @click="switchDisplayFace">
          <ul class="clear" v-show="displayFace">
            <el-scrollbar>
              <li
                v-for="item in face"
                :key="item.face_id"
                v-on:click="selectFace(item.face_name)"
              >
                <img :src="faceUrl + item.face_name + '@2x.png'" />
              </li>
            </el-scrollbar>
          </ul>
        </i>

        <el-upload
          :action="uploadSrc"
          :data="uploadImgData"
          accept=".jpg,.jpeg,.png,.JPG,.JPEG"
          :before-upload="beforeChartUpload"
          :on-success="chartUploadSuccess"
          :on-error="chartUploadError"
          :show-file-list="false"
        >
          <i
            class="upload_img_icon"
            v-show="user.role === 1 || user.role === 2"
          ></i>
        </el-upload>

        <el-button class="chat-btn" size="small" type="primary" @click="send">{{
          $t("common.send")
        }}</el-button>
      </div>
    </div>

    <!-- 互动区图片预览弹框 -->
    <el-dialog v-model="chartImgDialogShow" width="30%">
      <img :src="chartImgSrc" alt="" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script>
import TIM from "tim-js-sdk";
import { mapGetters, mapMutations, mapState } from "vuex";
import {
  groupGetmoremsg,
  groupSendmsg,
  groupDeletemsg,
  forbitchat,
  forbitchatvisitor,
  shotoff,
} from "@/api";
import { emoji } from ".././../../assets/js/emoji";
import chatScroll from "../chat/chatScroll";
import { BASE_URL, FILE_URL } from "@/utils/buildVar";
const baseUrl =
  process.env.NODE_ENV === "development"
    ? "https://a.ofweek.com:8081/admina"
    : `https://${FILE_URL}/api/fileremote`;
export default {
  name: "chatList",
  data() {
    return {
      uploadSrc: baseUrl + "/file/uploadfile2",
      uploadImgData: {
        filetype: "0",
        module: "msgpictext",
      },
      dataList: [],
      loading: false,
      loadOver: false,
      sendData: "",
      msgId: "",
      faceUrl: `https://${BASE_URL}/file/static/img/face/emoji/`,
      displayFace: false,
      face: emoji,
      faceRegExp: /\[[a-zA-Z0-9\/\u4e00-\u9fa5]+\]/g,
      chartImgSrc: "",
      chartImgDialogShow: false,
    };
  },
  components: { chatScroll },
  methods: {
    ...mapMutations(["openLogin", "openCard", "setIsForbit"]),
    getData() {
      if (this.loadOver) return;
      this.loading = true;
      return new Promise((resolve) => {
        groupGetmoremsg({
          msgId: this.msgId,
          roomId: this.roomId,
          size: 50,
        }).then((res) => {
          console.log(res);
          if (res.data.length < 50) {
            this.loadOver = true;
          }
          let _arr = res.data.reverse();

          if (_arr.length > 0) {
            this.msgId = _arr[0].msgId;
          }

          this.dataList = _arr.concat(this.dataList);
          this.loading = false;
          this.$nextTick(() => {
            resolve(_arr.length);
          });
        });
      });
    },
    handleReachTop() {
      if (this.loadOver) return;
      this.loading = true;
      setTimeout(() => {
        this.getData().then((val) => {
          this.$refs.chatscroll.toLi(val);
        });
      }, 1000);
    },
    faceToHTML(value) {
      if (!value) return "";
      const url = this.faceUrl;
      value = value.replace(this.faceRegExp, function (word) {
        return '<img width="24" src="' + url + word + '@2x.png" />';
      });
      return value;
    },
    switchDisplayFace() {
      if (this.isVisitorLogin) {
        this.openLogin(false);
        return;
      }
      if (this.isForbit) {
        return;
      }
      if (this.isVisitor || this.isShutup) {
        //
      } else {
        this.displayFace = !this.displayFace;
      }
    },
    selectFace(face) {
      this.sendData += face;
      document.querySelector(".chat_con").focus();
    },
    // 禁止拖动表情图片
    banDragImage(e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
      }
    },
    beforeChartUpload(file) {
      const isMax = file.size / 1024 / 1024 < 2;
      if (!isMax) {
        this.$message.error("图片大小不能超过 " + 2 + "MB!");
      }
      return isMax;
    },
    chartUploadSuccess(res) {
      if (res.code === 0) {
        groupSendmsg({
          content: {
            content: encodeURI(res.data),
            msgType: 2,
          },
          roomId: this.roomId,
          senderId: this.imAccount,
        }).then((res) => {});
      }
    },
    chartUploadError(err) {
      this.$message.error(JSON.parse(String(err).split(": ")[1]));
    },
    send() {
      if (this.isVisitorLogin) {
        this.openLogin(false);
        return;
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false);
        return;
      }

      if (this.sendData.length === 0) {
        console.log("请输入发送的内容！");
        return;
      }

      groupSendmsg({
        content: {
          content: encodeURI(this.sendData),
          msgType: 1,
        },
        roomId: this.roomId,
        senderId: this.imAccount,
      }).then((res) => {
        console.log(res);
        if (res.code === 0) {
          this.sendData = "";
        }
      });
    },
    commandPara(item, type) {
      return {
        info: item,
        type,
      };
    },
    toBottomFn() {
      this.$refs.chatscroll.toBottom();
    },
    handleCommand(command) {
      console.log(command);
      switch (command.type) {
        case "a":
          this.sendData = `@${command.info.nick} `;
          this.$refs.textarea1.focus();
          break;
        case "b":
          this.$confirm("确认删除?", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }).then(() => {
            groupDeletemsg({
              msgId: command.info.msgId,
              roomId: command.info.roomId,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("删除成功");
              } else {
                this.$message.error(res.message);
              }
            });
          });
          break;
        case "c":
          if (command.info.role === 6) {
            forbitchatvisitor({
              visitorId: command.info.visitorId,
              roomId: command.info.roomId,
              type: 1,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("禁言成功");
              } else {
                this.$message.error(res.message);
              }
            });
          } else {
            forbitchat({
              memberId: command.info.senderId,
              roomId: command.info.roomId,
              type: 1,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("禁言成功");
              } else {
                this.$message.error(res.message);
              }
            });
          }
          break;
        case "d":
          if (command.info.role === 6) {
            forbitchatvisitor({
              visitorId: command.info.visitorId,
              roomId: command.info.roomId,
              type: 2,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("取消禁言成功");
              } else {
                this.$message.error(res.message);
              }
            });
          } else {
            forbitchat({
              memberId: command.info.senderId,
              roomId: command.info.roomId,
              type: 2,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("取消禁言成功");
              } else {
                this.$message.error(res.message);
              }
            });
          }
          break;
        case "e":
          this.$confirm(`是否把 ${command.info.nick} 踢出房间?`, "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }).then(() => {
            shotoff({
              memberId: command.info.senderId,
              roomId: command.info.roomId,
            }).then((res) => {
              if (res.code === 0) {
                this.$message.success("踢出成功");
              } else {
                this.$message.error(res.message);
              }
            });
          });
          break;
      }
    },
    showChartImg(src) {
      this.chartImgSrc = src;
      this.chartImgDialogShow = true;
    },
  },
  computed: {
    ...mapGetters(["isForbit", "imAccount", "room", "user", "isVisitorLogin"]),
    ...mapState({
      room: ({ room }) => room,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },
  created() {
    this.tim.on(TIM.EVENT.MESSAGE_RECEIVED, (event) => {
      // 收到推送的单聊、群聊、群提示、群系统通知的新消息，可通过遍历 event.data 获取消息列表数据并渲染到页面
      // event.name - TIM.EVENT.MESSAGE_RECEIVED
      // event.data - 存储 Message 对象的数组 - [Message]
      event.data.forEach((eventItem) => {
        const payloadData = JSON.parse(eventItem.payload.data);
        let msgCode = payloadData.msgCode;

        if (payloadData.roomId != this.roomId) {
          return;
        }

        switch (String(msgCode)) {
          // 广播群互动消息
          case "1000":
            console.log("广播群互动消息1000");
            // console.log(payloadData)
            payloadData.isForbit = 2;
            this.dataList.push(payloadData);
            this.$nextTick(() => {
              setTimeout(() => {
                this.$refs.chatscroll.scrollToBottom();
              }, 1);
            });
            break;

          // 审核通过互动聊天消息
          case "1010":
            console.log("审核通过互动聊天消息1010");
            console.log(payloadData);
            this.dataList.push(payloadData);
            this.$nextTick(() => {
              setTimeout(() => {
                this.$refs.chatscroll.scrollToBottom();
              }, 1);
            });
            break;

          // 审核不通过互动聊天消息
          case "1011":
            console.log("审核不通过互动聊天消息1011");
            break;

          // 删除群互动消息
          case "1014":
            console.log("删除群互动消息1014");
            console.log(payloadData);
            this.dataList = this.dataList.filter((item) => {
              return item.msgId == payloadData.msgId ? false : true;
            });
            break;

          // 禁言/取消禁言用户消息
          case "1017":
            console.log("禁言/取消禁言用户消息1017");

            console.log(this.imAccount);
            console.log(payloadData);

            if (payloadData.memberId == this.imAccount) {
              if (payloadData.type === 1) {
                this.setIsForbit(true);
                this.$message.warning("对不起，您已被禁言");
              } else if (payloadData.type === 2) {
                this.setIsForbit(false);
                this.$message.success("您已被解除禁言");
              }
            }

            this.dataList.forEach((item) => {
              if (
                payloadData.memberId == item.senderId ||
                payloadData.visitorId === item.visitorId
              ) {
                if (payloadData.type === 1) {
                  item.isForbit = 1;
                } else if (payloadData.type === 2) {
                  item.isForbit = 2;
                }
              }
            });
            break;

          // 踢出用户消息
          case "1018":
            if (payloadData.memberId == this.imAccount) {
              this.$alert("对不起，您被踢出该直播间！", "提示", {
                type: "warning",
                showClose: false,
                confirmButtonText: "确定",
                callback: (action) => {
                  if (this.room.type === 1) {
                    location.href = "https://live.ofweek.com/";
                  } else if (this.room.type === 2) {
                    location.href = "https://webinar.ofweek.com/";
                  } else if (this.room.type === 3) {
                    location.href = "https://expo.ofweek.com/";
                  }
                },
              });
            }
            break;

          // 进入直播间广播消息
          case "1020":
            // console.log('进入直播间广播消息1020')
            break;

          // 在线用户变化广播消息
          case "1021":
            // console.log('在线用户变化广播消息1021')
            break;
        }
      });
    });
  },
  mounted() {
    // 鼠标点击任何地方都隐藏表情
    document.body.addEventListener("click", (e) => {
      if (e.target.className.indexOf("face_icon") < 0) {
        this.displayFace = false;
      }
    });

    // 获取聊天数据后滚动到最低部
    this.getData().then(() => {
      this.$refs.chatscroll.toBottom();
    });
  },
};
</script>
<style lang="scss">
.chat-btn {
  float: right;
  width: 60px;
  font-size: 14px;
}
.chat_input {
  .el-button--primary {
    color: #fff;
    background-color: #e65e50;
    border-color: #e65e50;
  }

  .el-button--primary.is-active,
  .el-button--primary:active,
  .el-button--primary:focus,
  .el-button--primary:hover {
    background: #e04435;
    border-color: #e04435;
    color: #fff;
  }

  .el-button--primary:active {
    outline: 0;
  }
  .el-button--primary.is-disabled,
  .el-button--primary.is-disabled:active,
  .el-button--primary.is-disabled:focus,
  .el-button--primary.is-disabled:hover {
    color: #fff;
    background-color: #e68080;
    border-color: #e68080;
  }
}

.el-dropdown-menu.chat-el-dropdown {
  background: rgba($color: #000000, $alpha: 0.8);
  border: none;
}
.chat-el-dropdown.el-popper[x-placement^="bottom"] .popper__arrow::after {
  border-bottom-color: rgba($color: #000000, $alpha: 0.8);
}
.chat-el-dropdown.no-dropdown.el-popper[x-placement^="bottom"]
  .popper__arrow::after {
  border-bottom-color: #fff;
}
.chat-el-dropdown .el-dropdown-menu__item {
  color: #999;
}
.chat-el-dropdown .el-dropdown-menu__item:focus,
.chat-el-dropdown .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: rgba($color: #000000, $alpha: 0.9);
  color: #fff;
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
</style>
<style lang="scss" scoped>
.chat_notice_bar {
  padding: 0 20px;
  height: 40px;
  background: #fff6e2;

  p {
    color: $red;
    line-height: 40px;
  }
}

.chat_list {
  width: 360px;
  padding: 0 19px;

  li {
    padding: 15px 0;

    .chat_user_box {
      margin-bottom: 10px;
    }
    .chat_user_name {
      font-size: 14px;
      font-weight: bold;
    }
    .compere {
      color: $blue;
    }
    .point_style {
      cursor: pointer;
    }

    p {
      color: $font_gray;
      line-height: 1.5em;
      word-wrap: break-word;
    }

    img {
      max-width: 50%;
    }
  }
  li:first-child {
    padding-top: 5px;
  }
}

.chat_input {
  padding: 12px 20px 28px;

  input,
  textarea {
    width: 100%;
    padding: 7px 11px;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    margin-bottom: 12px;
    resize: none;
  }

  input:disabled,
  textarea:disabled {
    border: 1px solid #e6e6e6;
    background: #f5f7fa;
    opacity: 1;
  }

  i.face_icon {
    position: relative;
    float: left;
    width: 24px;
    height: 24px;
    background: url(../../../../assets/smile.png) no-repeat;
    cursor: pointer;

    ul {
      position: absolute;
      left: 0;
      bottom: 25px;
      width: 185px;
      border-left: 1px solid #d4d4d4;
      height: 88px;
      background: #fff;

      li {
        float: left;
        width: 29px;
        height: 29px;
        text-align: center;
        border-right: 1px solid #d4d4d4;
        border-bottom: 1px solid #d4d4d4;
        background: #fff;
      }
      li:nth-child(1),
      li:nth-child(2),
      li:nth-child(3),
      li:nth-child(4),
      li:nth-child(5),
      li:nth-child(6) {
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
    background: url(../../../../assets/imgIcon.png) no-repeat center;
    cursor: pointer;
  }
}
.loading_over {
  padding: 10px 0 0 !important;
  text-align: center;
  color: $font_gray;
}
.no_data_tip {
  text-align: center;
  padding-top: 100px;
  color: $font_gray;
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
      color: $blue;
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
