<template>
  <div class="ofweek-live-wrap flex-column">
    <media-check
      :visible="mediaSelVisible"
      :client="trtcClient"
      :user="user.userInfo"
      @btn-click="handleMediaSetEmit"
    />
    <div
      v-if="
        live.liveMembers?.filter(
          ({ isMainSpeaker, isLiving }) => !isMainSpeaker && isLiving
        )?.length
      "
      class="remote-view flex"
    >
      <div
        class="wrap-item live-small-view"
        v-for="item in live.liveMembers?.filter(
          ({ isMainSpeaker, isLiving }) => !isMainSpeaker && isLiving
        )"
        :key="item.memberId"
        @mouseenter="onLiveStreamMouseEnter(item)"
        @mouseleave="onLiveStreamMouseLeave(item)"
      >
        <div :id="`live_stream_${item.memberId}`" class="stream-player"></div>
        <div class="stream-label">
          <label>{{ item.nick }}</label>
        </div>
        <!--default cover-->
        <div class="stream-cover" v-show="!item.isOpenCamera">
          <Img :src="item.headUrl" alt="cover" />
        </div>

        <stream-mask
          v-show="item.maskShow"
          :member="item"
          @menu-click="handleStreamMaskClick($event, item)"
        />
      </div>
    </div>
    <div class="live-main-view flex-center">
      <ppt />
    </div>
    <el-dialog
      title="提示"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      v-model="applyShow"
    >
      <p>{{ applyMsg.auditerNick }}申请上麦</p>
      <template #footer>
        <el-button @click="handleGuestApply(0)">拒绝</el-button>
        <el-button type="primary" @click="handleGuestApply(1)">同意</el-button>
      </template>
    </el-dialog>
    <el-dialog
      title="提示"
      v-model="inviteShow"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <p>{{ inviteMsg.inviterNick }}邀请您上麦</p>
      <template #footer>
        <el-button @click="handleInvite(0)">拒绝</el-button>
        <el-button type="primary" @click="handleInvite(1)">同意</el-button>
      </template>
    </el-dialog>
  </div>
</template> 

<script>
import { mapState } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { IM_EVENT } from "../../../../sdk/imLive";
import MediaCheck from "../mediaCheck.vue";
import StreamMask from "../streamMask.vue";
import Ppt from "../ppt/index.vue";
import Img from "../../../../components/img/index.vue";
import { eventEmitter } from "../../../../utils/event";
import { loopToInterval } from "../../../../utils/tool";

export default {
  name: "live",

  components: {
    MediaCheck,
    Img,
    Ppt,
    StreamMask,
  },

  data() {
    return {
      mediaSelVisible: true,
      mainStreamList: [],
      applyShow: false,
      applyMsg: {},
      applyTimer: null,
      inviteShow: false,
      inviteMsg: {},
      inviteTimer: null,
      // 远端流获取时间
      getStreamTime: null,
      // 直播画面检测定时器
      liveCheckTimer: null,
    };
  },

  created() {
    this.joinTrtc();
    this.unbindEvent();
    this.bindEvent();
    this.checkLive();
  },

  computed: {
    ...mapState({
      user: ({ user }) => user,
      live: ({ live }) => live,
      room: ({ room }) => room,
      imClient: ({ imClient }) => imClient,
      trtcClient: ({ trtcClient }) => trtcClient,
      roomId: ({ router: { params } }) => params?.roomId,
    }),
  },

  watch: {
    // 直播socket连接状态检测
    "live.liveSocketStatus": {
      handler: function (connected, prevStatus) {
        if (connected) {
          // 断开之后重连
          !prevStatus && this.reconnectLive();
        } else {
          // 连接中断开
        }
      },
    },
  },

  methods: {
    // join trtc room after get private key
    joinTrtc() {
      return new Promise((resolve) => {
        this.$store.dispatch({
          type: "live/getPrivateKey",
          payload: {
            roomid: this.roomId,
          },
          callback: ({ data: { trtcPrivateSig } }) => {
            this.$store.commit("live/setState", {
              key: "liveToggleLoading",
              value: true,
            });
            this.trtcClient.client
              .join({
                roomId: Number(this.roomId),
                role: "anchor",
                privateMapKey: trtcPrivateSig,
              })
              .then(
                () => {
                  console.log("success to join trtc-room~~");

                  this.$store.commit("live/setState", [
                    {
                      key: "liveJoinStatus",
                      value: 1,
                    },
                    {
                      key: "liveToggleLoading",
                      value: false,
                    },
                  ]);
                  resolve(true);
                },
                (err) => {
                  console.error("fail to join trtc-room", err);
                  this.$store.commit("live/setState", [
                    {
                      key: "liveJoinStatus",
                      value: 0,
                    },
                    {
                      key: "liveToggleLoading",
                      value: false,
                    },
                  ]);
                  ElMessageBox.alert(
                    "网络异常导致进入直播间超时，请重新试试",
                    "温馨提示",
                    {
                      confirmButtonText: "好的",
                      callback: () => window.location.reload(),
                    }
                  );
                  resolve(false);
                }
              );
          },
        });
      });
    },

    // ready to mix stream of all users in live
    startMixStream() {
      const videoRate = 9 / 16;
      const videoHeight = 468;
      const videoSpace = 10;
      const thumbHeight = 120;
      const videoWidth = 468 / videoRate;
      const thumbWidth = (videoWidth - videoSpace * 6) / 5;
      const speakerHeight = videoHeight - thumbHeight - videoSpace * 2;
      // 主讲人占大画面，其余人依次排列在下方
      const mixUsers = [
        {
          width: videoWidth,
          height: speakerHeight,
          locationX: 0,
          locationY: 0,
          pureAudio: false,
          // streamType: 'main', // 远端主流
          userId: String(this.live.liveSpeaker.userId), // 主讲人占位
          zOrder: 1,
        },
        ...this.mainStreamList.map(({ userId_ }, index) => ({
          width: thumbWidth,
          height: thumbHeight,
          locationX: index * thumbWidth + videoSpace * (index + 1),
          locationY: speakerHeight + videoSpace, // 从上至下
          pureAudio: false,
          // streamType: 'auxiliary', // 远端辅流
          userId: "$PLACE_HOLDER_REMOTE$", // 其余人小窗口占位
          zOrder: 2,
        })),
      ];
      const mixConfig = {
        mode: "preset-layout",
        streamId: this.room.room?.myStreamIdMix,
        videoWidth,
        videoHeight,
        videoBitrate: 1500,
        videoFramerate: 20,
        videoGOP: 2,
        audioSampleRate: 48000,
        audioBitrate: 64,
        audioChannels: 2,
        mixUsers,
      };
      return new Promise((resolve) => {
        this.trtcClient.client.startMixTranscode(mixConfig).then(
          () => {
            console.log("混流成功~~");
            resolve(true);
          },
          (err) => {
            console.error("混流失败~~", err);
            resolve(false);
          }
        );
      });
    },

    /**
     * @desc 停止混流
     * @description 注意事项: 停止混流必须在混流发起者leave trtc之前, 否则会导致异常
     */
    stopMixStream() {
      return new Promise((resolve) => {
        this.trtcClient.client.stopMixTranscode().then(
          () => {
            console.log("success to stop mixstream~~");
            resolve(true);
          },
          (err) => {
            console.warn("fail to stop mixstream", err);
            resolve(false);
          }
        );
      });
    },

    unbindEvent() {
      eventEmitter.off(eventEmitter.event?.live?.setMedia, this.onMediaSetting);
      eventEmitter.off(
        eventEmitter.event?.live?.toggleMedia,
        this.onMediaToggle
      );
      eventEmitter.off(eventEmitter.event?.live?.playStream, this.onPlayStream);
      eventEmitter.off(eventEmitter.event?.live?.stopLive, this.onLiveStop);
      eventEmitter.off(eventEmitter.event?.anchor?.start, this.onAnchorStart);
      eventEmitter.off(eventEmitter.event?.anchor?.online, this.onAnchorOnline);
      eventEmitter.off(eventEmitter.event?.anchor?.stop, this.onAnchorStop);
      eventEmitter.off(
        eventEmitter.event?.anchor?.offline,
        this.onAnchorOffline
      );
      eventEmitter.off(eventEmitter.event?.guest?.start, this.onGuestStart);
      eventEmitter.off(eventEmitter.event?.guest?.stop, this.onGuestStop);
      this.imClient?.off(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.stream?.off("*");
      this.trtcClient?.client?.off("*");
    },

    bindEvent() {
      eventEmitter.on(eventEmitter.event?.live?.setMedia, this.onMediaSetting);
      eventEmitter.on(
        eventEmitter.event?.live?.toggleMedia,
        this.onMediaToggle
      );
      eventEmitter.on(eventEmitter.event?.live?.playStream, this.onPlayStream);
      eventEmitter.on(eventEmitter.event?.live?.stopLive, this.onLiveStop);
      eventEmitter.on(eventEmitter.event?.anchor?.start, this.onAnchorStart);
      eventEmitter.on(eventEmitter.event?.anchor?.online, this.onAnchorOnline);
      eventEmitter.on(eventEmitter.event?.anchor?.stop, this.onAnchorStop);
      eventEmitter.on(
        eventEmitter.event?.anchor?.offline,
        this.onAnchorOffline
      );
      eventEmitter.on(eventEmitter.event?.guest?.start, this.onGuestStart);
      eventEmitter.on(eventEmitter.event?.guest?.stop, this.onGuestStop);
      this.imClient?.on(IM_EVENT?.msgReceive, this.onMsgReceive);
      this.trtcClient?.client?.on("stream-added", this.onStreamAdded);
      this.trtcClient?.client?.on("stream-subscribed", this.onGetRemoteStream);
      this.trtcClient?.client?.on("stream-removed", this.onStreamRemoved);
    },

    onMsgReceive({ data }) {
      try {
        for (let i = 0, len = data.length; i < len; i++) {
          const msg = data[i];

          if (!msg.payload?.data) {
            return;
          }

          const payloadData = JSON.parse(msg.payload?.data);
          const { msgCode } = payloadData;
          const userIsAnchor = this.user.user.role === 1;
          console.log(payloadData);

          if (String(payloadData.roomId) !== String(this.roomId)) {
            return;
          }

          const codeAction = {
            // 直播间结束
            1027: () => {
              // 后台结束流会自动断开，直播间trtc所有操作无需干预，只管清空页面状态
              ElMessageBox.alert("直播间已结束", "温馨提示", {
                confirmButtonText: "好的",
                callback: () => window.location.reload(),
              });
            },

            // 邀请直播消息
            1706: () => {
              this.inviteMsg = payloadData;
              this.inviteShow = true;
              // 30秒内不处理上麦消息自动决绝并关闭弹窗
              this.inviteTimer = setTimeout(() => {
                this.handleInvite(0);
              }, 30 * 1000);
            },

            // 申请上麦消息
            1710: () => {
              this.applyMsg = payloadData;
              this.applyShow = true;
              // 30秒内不处理上麦消息自动决绝并关闭弹窗
              this.applyTimer = setTimeout(() => {
                this.handleGuestApply(0);
              }, 30 * 1000);
            },

            // 处理上麦申请消息
            1712: () => {
              if (
                String(payloadData.auditerId) !==
                String(this.user?.userInfo?.imAccount)
              ) {
                return;
              }
              if (payloadData.isAgree) {
                ElMessage.success(
                  `${payloadData.anthorNick}同意了您的上麦申请`
                );
                this.$store.dispatch({
                  type: "live/guestStartLive",
                  payload: {
                    roomid: this.roomId,
                  },
                  callback: () => {},
                });
              } else {
                ElMessage.error(`${payloadData.anthorNick}拒绝了您的上麦申请`);
              }
            },

            // 处理上麦邀请消息
            1714: () => {
              if (
                String(payloadData.adminId) !==
                String(this.user?.userInfo?.imAccount)
              ) {
                return;
              }
              ElMessage[payloadData.isAgree ? "success" : "error"](
                `${payloadData.guestNick}${
                  payloadData.isAgree ? "同意" : "拒绝"
                }了您的上麦邀请`
              );
            },

            // 主播开始直播消息
            1722: () => {
              const isAnchorSelf =
                +payloadData.anthorId === +this.user.user.imAccount;
              isAnchorSelf &&
                eventEmitter.emit(eventEmitter.event.anchor.start);
            },

            // 主播设置主讲人消息
            1724: () => {
              this.$store.commit("live/setState", {
                key: "liveSpeaker",
                value: {
                  ...payloadData,
                  userId: payloadData.mainSpeakerId,
                },
              });
              this.mainStreamList = this.filterLiveStream();
            },

            // 主播结束直播
            1723: () => {
              const isAnchorSelf =
                +payloadData.handlerId === +this.user.user.imAccount;
              if (isAnchorSelf) {
                eventEmitter.emit(eventEmitter.event.anchor.stop);
              } else {
                this.destroyRoom();
              }
            },

            // 上麦推送
            1726: () => {
              const isSelf =
                +payloadData.memberId === +this.user.user.imAccount;

              if (isSelf) {
                userIsAnchor
                  ? eventEmitter.emit(eventEmitter.event.anchor.online)
                  : eventEmitter.emit(eventEmitter.event.guest.start);
              }
            },

            // 下麦推送
            1727: () => {
              const isSelf =
                +payloadData.memberId === +this.user.user.imAccount;

              if (isSelf) {
                // local下麦
                userIsAnchor
                  ? eventEmitter.emit(eventEmitter.event.anchor.offline)
                  : eventEmitter.emit(eventEmitter.event.guest.stop);
              } else {
                // 收到下麦消息后移除尚在展示的下麦流
              }
            },

            // 直播中媒体设备开关消息
            1728: () => {
              const { isOpenCamera, isOpenMike } = payloadData;
              const isMicToggle = isOpenMike !== null;
              eventEmitter.emit(eventEmitter.event.live.toggleMedia, {
                type: isMicToggle ? "mic" : "camera",
                userId: payloadData.memberId,
                isOpenMike: isMicToggle ? isOpenMike : null,
                isOpenCamera: isMicToggle ? null : isOpenCamera,
              });
            },
          };
          codeAction[msgCode]?.();
        }
      } catch (err) {
        console.warn("fail to pass msg of im", err);
      }
    },

    /** remote stream publish */
    onStreamAdded(event) {
      this.trtcClient.client
        .subscribe(event.stream, { audio: true, video: true })
        .then(
          () => {
            console.log(
              "some one publish stream & will be subscribed by yourself !!!"
            );
          },
          () => {
            console.error("failed to subscribe remoteStream");
          }
        );
    },

    /** success to get remote stream to play */
    async onGetRemoteStream(event) {
      console.warn("远端流添加~~~", event);

      const { stream } = event;
      this.$store.commit("live/setState", {
        key: "liveMembers",
        value: this.live.liveMembers.map((member) => ({
          ...member,
          stream:
            +member.memberId === +stream.getUserId() ? stream : member.stream,
        })),
      });

      this.$store.commit("live/setState", [
        {
          key: "liveStart",
          value: true,
        },
      ]);

      this.$nextTick(() => {
        const remoteMember = this.live.liveMembers?.find(
          ({ memberId }) => +memberId === +stream.getUserId()
        );
        // !(stream.isPlaying?.() && stream.videoPlayer_)
        if (remoteMember.isLiving) {
          this.tryToPlayStream(
            remoteMember.isMainSpeaker
              ? "speakerId"
              : `live_stream_${stream.userId_}`
          );
        }
      });
    },

    onStreamRemoved(event) {
      const { stream } = event;
    },

    // 嘉宾处理上麦邀请
    handleInvite(isagree) {
      window.clearTimeout(this.inviteTimer);
      this.$store.dispatch({
        type: "live/handleInviteLive",
        payload: {
          roomid: this.roomId,
          adminid: this.inviteMsg.inviterId,
          isagree,
        },
      });
      isagree &&
        this.$store.dispatch({
          type: "live/guestStartLive",
          payload: {
            roomid: this.roomId,
          },
          callback: () => {},
        });
      this.inviteShow = false;
    },

    // 处理上麦申请
    handleGuestApply(isagree) {
      window.clearTimeout(this.applyTimer);
      this.$store.dispatch({
        type: "live/handleApplyLive",
        payload: {
          roomid: this.roomId,
          auditerid: this.applyMsg.auditerId,
          isagree,
        },
      });
      this.applyShow = false;
    },

    /** filter live stream by id */
    filterLiveStream(filterId = this.live.liveSpeaker?.userId) {
      return this.live.liveStreamList
        .filter(({ userId_ }) => String(userId_) !== String(filterId))
        .map((stream) =>
          Object.assign(
            stream,
            {
              ...this.live.liveMembers.find(
                ({ memberId }) => String(memberId) === String(stream.userId_)
              ),
            },
            {
              isOpenMike: stream.isOpenMike,
              isOpenCamera: stream.isOpenCamera,
            }
          )
        );
    },

    /** 打开媒体设置 */
    onMediaSetting() {
      this.mediaSelVisible = !this.mediaSelVisible;
    },

    /**
     * @desc 直播间切换媒体设备开关 1、用户自行切换 2、主播推送嘉宾切换
     * @param {type:String,userId:String,isOpenMike:Boolean,isOpenCamera:Boolean} Object
     */
    onMediaToggle({ data: { type, userId, isOpenMike, isOpenCamera } }) {
      const isMicToggle = type === "mic";
      const isSelf = +userId === +this.user.user.imAccount;
      this.$store.commit("live/setState", {
        key: "liveMembers",
        value: this.live.liveMembers.map((member) => ({
          ...member,
          isOpenMike:
            isMicToggle && +userId === +member.memberId
              ? isOpenMike
              : member.isOpenMike,
          isOpenCamera:
            !isMicToggle && +userId === +member.memberId
              ? isOpenCamera
              : member.isOpenCamera,
        })),
      });
      isSelf &&
        this.trtcClient.stream?.[
          isMicToggle
            ? [isOpenMike ? "unmuteAudio" : "muteAudio"]
            : [isOpenCamera ? "unmuteVideo" : "muteVideo"]
        ]?.();
    },

    /**
     * @desc on play stream event emit
     * @param {Object} stream 直播流 target 播放元素
     **/
    onPlayStream({ data: { stream, target } }) {
      this.tryToPlayStream(stream, target);
    },

    /**
     * @desc 下麦当前用户
     * @description 1.主播推送嘉宾下麦 2.主播 | 嘉宾自行推送下麦消息,主播下麦不结束直播，仅仅停止发布流
     **/
    async onLiveStop({ data: payload }) {
      const isSelf =
        String(payload.userId) === String(this.user.user.imAccount);
      const targetIsAnchor = payload.role === 1;
      let result = {};
      if (isSelf && targetIsAnchor) {
        result = await this.$store.dispatch({
          type: "live/anchorOffline",
          payload: {
            roomid: this.roomId,
            memberid: payload.userId,
          },
        });
      } else {
        result = await this.$store.dispatch({
          type: "live/guestStopLive",
          payload: {
            roomid: this.roomId,
            memberid: payload.userId,
          },
        });
      }
      result.status && payload.callback?.();
    },

    /** 主播开始直播，主播上麦默认主讲人 */
    async onAnchorStart() {
      if (this.live.liveJoinStatus !== 1) {
        await this.joinTrtc();
      }

      this.$store.commit("live/setState", {
        key: "liveToggleLoading",
        value: true,
      });

      // publish & mix
      this.trtcClient.client.publish(this.trtcClient.stream).then(
        () => {
          console.log("success for anchor to publish stream~~~~~");
          ElMessage.success("直播已开始");

          this.$store.commit("live/setState", [
            {
              key: "liveToggleLoading",
              value: false,
            },
            {
              key: "liveStart",
              value: true,
            },
            {
              key: "livePublishing",
              value: true,
            },
            {
              key: "liveSpeaker",
              value: {
                stream: this.trtcClient.stream,
                userId: this.trtcClient.stream.userId_,
              },
            },
            {
              key: "liveStreamList",
              value: [
                ...this.live.liveStreamList,
                Object.assign(this.trtcClient.stream, {
                  isOpenMike: true,
                  isOpenCamera: true,
                  maskShow: false,
                }),
              ],
            },
          ]);
          // 上麦默认开启摄像头麦克风
          this.trtcClient.stream.unmuteAudio();
          this.trtcClient.stream.unmuteVideo();
          // this.startMixStream()
        },
        (err) => {
          this.$store.commit("live/setState", [
            {
              key: "liveToggleLoading",
              value: false,
            },
          ]);
          ElMessage.error("开始直播失败，请重试");
          console.warn("fail for anchor to publish stream", err);
        }
      );
    },

    /** 主播上麦，仅当前主播用户可操作 */
    async onAnchorOnline() {
      this.trtcClient.client.publish(this.trtcClient.stream).then(
        async () => {
          console.log("success for anchor to publish stream~~~~~");

          ElMessage.success("上麦成功");
          const isSpeaker =
            String(this.user.user.imAccount) ===
            String(this.live.liveSpeaker.userId);
          const memberData = Object.assign(this.trtcClient.stream, {
            userId: this.user.user.imAccount,
            nick: this.user.user.nick,
            isOpenMike: true,
            isOpenCamera: true,
            maskShow: false,
          });

          this.$store.commit("live/setState", [
            {
              key: "liveStart",
              value: true,
            },
            {
              key: "livePublishing",
              value: true,
            },
            {
              key: "liveStreamList",
              value: [...this.live.liveStreamList, memberData],
            },
          ]);
          this.mainStreamList = this.filterLiveStream();
          // 主播上麦默认开启摄像头麦克风，并重新绘制主讲人画面
          this.trtcClient.stream.unmuteAudio();
          this.trtcClient.stream.unmuteVideo();
          await this.trtcClient.stream.stop();
          this.$nextTick(() => {
            if (isSpeaker) {
              this.tryToPlayStream(this.trtcClient.stream, "speakerId");
            } else {
              this.tryToPlayStream(
                this.trtcClient.stream,
                `live_stream_${this.user.user.imAccount}`
              );
            }
          });
        },
        (err) => {
          ElMessage.error("上麦失败，请重试");
          console.warn("fail for anchor to publish stream", err);
        }
      );
    },

    /** 主播下麦，仅当前主播用户可操作 */
    async onAnchorOffline() {
      const userIsSpeaker =
        +this.live.liveSpeaker.userId === +this.user.user.imAccount;
      userIsSpeaker &&
        this.$store.commit("live/setState", {
          key: "liveSpeaker",
          value: {
            userId: "",
          },
        });

      if (this.live.livePublishing) {
        const result = await this.trtcClient.cancelPublish();
        result &&
          this.$store.commit("live/setState", {
            key: "livePublishing",
            value: false,
          });
        this.trtcClient.stream.stop();
      }

      this.$store.commit("live/setState", [
        {
          key: "liveStreamList",
          value: this.filterLiveStream(this.trtcClient.stream.userId_),
        },
      ]);
      this.mainStreamList = this.filterLiveStream();
    },

    /** 主播结束直播，仅当前主播用户可操作 */
    async onAnchorStop() {
      this.$store.commit("live/setState", {
        key: "liveToggleLoading",
        value: true,
      });
      this.clearLiveDataOfUser(true);
    },

    /** 嘉宾开始上麦，仅当前嘉宾用户可操作 */
    async onGuestStart() {
      if (this.live.liveJoinStatus !== 1) {
        await this.joinTrtc();
      }

      this.trtcClient.client.publish(this.trtcClient.stream).then(
        async () => {
          console.log("success for guest to publish stream~~~~~");

          ElMessage.success("上麦成功");
          const isSpeaker =
            String(this.user.user.imAccount) ===
            String(this.live.liveSpeaker.userId);
          const memberData = Object.assign(this.trtcClient.stream, {
            userId: this.user.user.imAccount,
            nick: this.user.user.nick,
            isOpenMike: true,
            isOpenCamera: true,
            maskShow: false,
          });

          this.$store.commit("live/setState", [
            {
              key: "liveStart",
              value: true,
            },
            {
              key: "livePublishing",
              value: true,
            },
            {
              key: "liveStreamList",
              value: [...this.live.liveStreamList, memberData],
            },
          ]);

          this.mainStreamList = this.filterLiveStream();
          // 嘉宾上麦默认开启摄像头麦克风
          this.trtcClient.stream.unmuteAudio();
          this.trtcClient.stream.unmuteVideo();
          await this.trtcClient.stream.stop();
          this.$nextTick(() => {
            if (isSpeaker) {
              this.tryToPlayStream(this.trtcClient.stream, "speakerId");
            } else {
              this.tryToPlayStream(
                this.trtcClient.stream,
                `live_stream_${this.user.user.imAccount}`
              );
            }
          });
        },
        (err) => {
          ElMessage.error("上麦失败");
          console.warn("fail for guest to publish stream", err);
        }
      );
    },

    /** 嘉宾下麦，仅当前嘉宾用户可操作 */
    async onGuestStop() {
      this.$store.commit("live/setState", {
        key: "liveToggleLoading",
        value: true,
      });

      this.clearLiveDataOfUser(false);
    },

    /** handle click btn of media setting */
    async handleMediaSetEmit() {
      const member = this.live.liveMembers.find(
        ({ memberId }) => +memberId === +this.user.user.imAccount
      );

      await this.trtcClient.stream.stop();
      member.isLiving &&
        this.trtcClient.stream.play(
          member.isMainSpeaker
            ? "speakerId"
            : `live_stream_${this.user.user.imAccount}`
        );
      this.mediaSelVisible = false;
    },

    /** click event of mask in stream */
    handleStreamMaskClick({ type }, item) {
      const isLiveToggle = type === "live";
      item.maskShow = !isLiveToggle;
    },

    /**mouse event of mask in stream  */
    onLiveStreamMouseEnter(item) {
      const { role, imAccount } = this.user.user;
      const isSelf = String(imAccount) === String(item.memberId);
      if (role !== 1 && !isSelf) {
        return;
      }
      item.maskShow = true;
    },

    /**mouse event of mask in stream  */
    onLiveStreamMouseLeave(item) {
      item.maskShow = false;
    },

    /** clear data of user after user stop live */
    clearLiveDataOfUser(isAnchor) {
      return new Promise(async (resolve) => {
        const userIsSpeaker =
          +this.live.liveSpeaker.userId === +this.user.user.imAccount;
        // 清空当前下麦主讲人
        userIsSpeaker &&
          this.$store.commit("live/setState", {
            key: "liveSpeaker",
            value: {
              userId: "",
            },
          });

        if (this.live.livePublishing) {
          const result = await this.trtcClient.cancelPublish();
          result &&
            this.$store.commit("live/setState", {
              key: "livePublishing",
              value: false,
            });
          this.trtcClient.stream.stop();
        }

        if (isAnchor) {
          // await this.stopMixStream()
          this.$store.commit("live/setState", [
            {
              key: "liveStreamList",
              value: [],
            },
            {
              key: "liveStart",
              value: false,
            },
          ]);
        } else {
          this.$store.commit("live/setState", [
            {
              key: "liveStreamList",
              value: this.filterLiveStream(this.trtcClient.stream.userId_),
            },
          ]);
        }

        this.mainStreamList = this.filterLiveStream();
        this.$store.commit("live/setState", [
          {
            key: "liveToggleLoading",
            value: false,
          },
        ]);
        resolve("success to clear live data of user...");
      });
    },

    /** destroy room & clear store of live */
    async destroyRoom() {
      if (this.live.livePublishing) {
        const result = await this.trtcClient.cancelPublish();
        result &&
          this.$store.commit("live/setState", {
            key: "livePublishing",
            value: false,
          });
        this.trtcClient.stream?.stop();
      }
      this.$store.commit("live/setState", [
        {
          key: "liveStart",
          value: false,
        }
      ]);
    },

    /** 直播中断网重连 */
    async reconnectLive() {
      // todo.....
    },

    /** 直播间轮询检测，维持直播间稳定性 */
    checkLive() {
      this.liveCheckTimer = loopToInterval(
        async () => {
          // 已接口成员为准同步当前直播界面
          const { status, data: members } = await this.$store.dispatch({
            type: "live/getMembers",
            payload: {
              roomid: this.roomId,
            },
          });
          if (status) {
            // 更新主讲人
            const speaker = members.find(({ isMainSpeaker }) => isMainSpeaker);
            this.$store.commit("live/setState", {
              key: "liveSpeaker",
              value: speaker
                ? {
                    ...speaker,
                    userId: speaker.memberId,
                  }
                : {
                    userId: "",
                  },
            });
            // 检测主视频区成员画面
            this.mainStreamList.forEach(async (stream) => {
              const streamIsPlay = stream.videoPlayer_ && stream.isPlaying();
              if (stream.isOpenCamera && !streamIsPlay) {
                console.warn(
                  `检测到当前账号${stream.userId_}异常，正在尝试恢复播放......`,
                  stream
                );
                await stream?.stop?.();
                this.tryToPlayStream(stream, `live_stream_${stream.userId_}`);
              }
            });
          }
          return true;
        },
        this.liveCheckTimer,
        2 * 1000
      );
    },

    /** custom stream attribute before create */
    customStream(stream, config) {
      // can i use __proto__ here ?
      Object.entries(config).forEach(([key, value]) => {
        stream.__proto__[key] = value;
      });
      return stream;
    },

    /** try to play & handle error */
    tryToPlayStream(stream, target, options = {}) {
      return new Promise((resolve) => {
        if (!document.getElementById(target)) {
          resolve(false);
          return;
        }
        stream.play(target, options).then(
          () => {
            resolve(true);
            console.log("yes!!! success to play remote stream");
          },
          (err) => {
            resolve(false);
            console.warn("ohh~~ fail to play remote video");
            const errorCode = err?.getCode?.();
            if (errorCode === 0x4043) {
              // TODO PLAY_NOT_ALLOWED,引导用户手势操作并调用 stream.resume 恢复音视频播放
              // stream.resume()
            }
          }
        );
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.ofweek-live-wrap {
  .remote-view {
    background: #2c2c2c;
    .wrap-item {
      position: relative;
      overflow: hidden;
      margin: 10px 0 10px 10px;
      width: calc((100% - 10px * 6) / 5);
      .stream-player {
        height: 100%;
      }
      .stream-label {
        position: absolute;
        z-index: 2;
        overflow: hidden;
        white-space: nowrap;
        word-break: keep-all;
        text-overflow: ellipsis;
        top: 10px;
        left: 10px;
        width: calc(100% - 10px);
        font-size: 14px;
        color: #fff;
      }
      .stream-cover {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: url(../../../../assets/img/live/live_default_avatar.png)
          no-repeat center/80px;

        img {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
  .live-main-view {
    min-height: 600px;
    position: relative;
    // height: calc(100% * 9 / 16);
    background: #000;
  }
}
</style>
