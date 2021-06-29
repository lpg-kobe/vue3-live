<template>
  <div :class="['video-wrap', { 'small-type': placeType === 1 }]">

    <div id="video_box"></div>
    
    <div :class="['video_bg', {video_not_begin: liveStatus === 1}]">
      <img class="video_cover" :src="room.bgUrl" alt="">
      <div class="video_shadow">
        <p class="countdown" v-if="liveStatus === 1">
          <em>{{ $t('video.countdown') }}</em><br>
          <span>{{time.d}}</span>
          <i>天</i>
          <span>{{time.h}}</span>
          <i>时</i>
          <span>{{time.m}}</span>
          <i>分</i>
          <span>{{time.s}}</span>
          <i>秒</i>
        </p>
        <p v-if="liveStatus === 2">{{ $t('video.startText') }}</p>
        <p v-if="liveStatus === 3">{{ $t('video.endText') }}</p>
      </div>
    </div>

    <div :class="['video_bg', 'review_video', {has_live: false}]" v-show="reviewVideoShow">
      <img class="video_cover" :src="room.bgUrl" alt="">
      <div class="video_shadow">
        <p class="center-btn"><span @click="playReivewFn">{{ $t('video.review') }}</span></p>
      </div>
      <!-- 回顾视频播放区 -->
      <div id="review_video_box" v-show="videoShow"></div>
    </div>
  </div>
</template>

<script>
import { IM_EVENT } from "../../sdk/imLive"
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import { getReviewList } from '../../services/room/index.js'
import avatarImg from '../../assets/live_default_avatar.png'
export default {
  name: 'videos',
  data () {
    return {
      differTime: 0,
      endDifferTime: 0,
      reviewVideo: [],
      reviewVideoShow: false,
      videoShow: false
    }
  },
  props: {
    placeType: {
      type: Number
    }
  },
  computed: {
    ...mapState({
      imClient: ({ imClient }) => imClient
    }),
    ...mapGetters({
      roomId: 'room/roomId',
      room: 'room/room',
      user: 'user/user',
      liveStatus: 'room/liveStatus'
    }),
    time () {
      let d = Math.floor(this.differTime / 3600 / 24) || 0
      let h = Math.floor((this.differTime / 3600) % 24) || 0
      let m = Math.floor((this.differTime / 60) % 60) || 0
      let s = Math.floor(this.differTime % 60) || 0
      d = d < 10 ? '0' + d : d
      h = h < 10 ? '0' + h : h
      m = m < 10 ? '0' + m : m
      s = s < 10 ? '0' + s : s
      return { d, h, m, s }
    }
  },
  methods: {
    // 倒计时
    countDown () {
      console.log(this.room)
      this.differTime = Math.floor((this.room.startTime - this.room.curTime) / 1000)
      this.endDifferTime = Math.floor((this.room.realEndTime - this.room.curTime) / 1000)
      let hasShowTip = false;
      if (this.liveStatus === 1) {
        let timer = setInterval(() => {
          this.differTime -= 1
          if (this.differTime <= 0) {
            clearInterval(timer)
            this.liveTimeStartFn()
          }
        }, 1000)
      } else if (this.liveStatus === 2) {
        if (this.endDifferTime > 0) {
          let timer2 = setInterval(() => {
            this.endDifferTime -= 1
            if (this.endDifferTime <= 0) {
              clearInterval(timer2)
              this.liveTimeEndFn()
            } else if (this.endDifferTime <= 300 && this.endDifferTime > 0) {
              if (this.user.role === 1 && !hasShowTip) {
                hasShowTip = true;
                let timeText = this.endDifferTime < 60 ? `${this.endDifferTime}秒`:`${parseInt(this.endDifferTime/60)}分钟`
                this.$alert(`距离直播结束时间还有${timeText}，如需继续请联系客服`, '提示', {
                  confirmButtonText: '确定'
                });
              }
            }
          }, 1000)
        }
      }
    },
    // 到结束直播时间
    liveTimeEndFn () {
      location.reload()
    },
    // 到开始直播时间
    liveTimeStartFn () {
      location.reload()
    },
    // 获取回顾视频
    getReviewVideoInfo () {
      getReviewList({roomid: this.roomId}).then(res => {
        this.reviewVideo = res.data
        if (this.reviewVideo && this.reviewVideo.length > 0) {
          this.reviewVideoShow = true
        }
      })
    },
    playReivewFn () {
      // 播放回顾视频
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

          if (payloadData.roomId != this.roomId) {
            return
          }

          switch (payloadData.msgCode) {
            // 上麦消息
            case 1702:
              console.log('上麦消息1702')
              break;

            // 下麦消息
            case 1704:
              console.log('下麦消息1704')
              break;

            // 后台结束直播状态消息
            case 1027:
              console.log('后台结束直播状态消息')
              break;
            }
        }
      } catch (err) {
        console.warn("fail to pass msg of im");
      }
    }
  },
  created () {
    this.countDown()
    this.bindEvent()
  },
  mounted () {
    // 请求回放视频
    if (this.liveStatus === 3 && this.room.isViewVideo === 1) {
      this.getReviewVideoInfo()
    }
  },
  watch: {
    
  }
}
</script>
<style lang="scss">
.vcp-player {
  width: 100% !important;
  height: 100% !important;

  video {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
<style lang="scss" scoped>
.video-wrap {
  position: relative;
  width: 820px;
  height: 460px;
  font-size: 16px;

  .video_play_icon {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4.5em;
    height: 4.5em;
    transform: translateX(-50%) translateY(-50%);
    background: url(../../assets/icon_play.png) no-repeat;
    background-size: 100% 100%;
    z-index: 9;
    cursor: pointer;
  }

  .video-full-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 28px;
    height: 28px;
    border-radius: 28px;
    background: rgba(0, 0, 0, 0.3);
    text-align: center;
    line-height: 28px;
    z-index: 10;
    cursor: pointer;

    &::after {
      content: '';
      display: inline-block;
      width: 16px;
      height: 16px;
      background: url(../../assets/full.png) no-repeat;
      background-size: contain;
      vertical-align: middle;
    }
  }

  .video_bg {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 3;
    width: 100%;
    height: 100%;

    .video_cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video_shadow {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, .5);

      p {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        font-size: 2.5em;
        color: #fff;
        text-align: center;

        img {
          width: 2em;
        }
      }
      .countdown {
        i {
          font-size: .5em;
          font-style: normal;
        }
        em {
          display: inline-block;
          margin-bottom: 15px;
          font-size: .6em;
          font-style: normal;
        }
      }

      .subscribe_live_btn {
        display: block;
        width: 140px;
        height: 54px;
        font-size: 18px;
        color: #fff;
        line-height: 54px;
        font-weight: 500;
        border-radius: 54px;
        background: #EE4242;
        cursor: pointer;
        user-select: none;
        margin: 20px auto 0;
      }
      .center-btn {
        font-size: 0;

        span {
          display: inline-block;
          min-width: 120px;
          height: 54px;
          padding: 0 20px;
          font-size: 18px;
          color: #fff;
          line-height: 54px;
          border-radius: 54px;
          background: #EE4242;
          cursor: pointer;
          user-select: none;
        }
      }
    }
  }
  .video_not_begin {
    z-index: 5;
  }

  .video_bg_top {
    text-align: center;
    z-index: 5;

    .video_shadow {
      background: #fefefe;
    }
  }

  .review_video {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 8;

    #review_video_box {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      z-index: 3;
    }

    &.has_live {
      z-index: 3;
    }
  }
}
.video-wrap.small-type {
  position: absolute;
  right: -380px;
  top: 0px;
  width: 360px;
  height: 203px;
  font-size: 12px;
}
#video_box {
  position: relative;
  z-index: 4;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
#media-video {
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
}
</style>
