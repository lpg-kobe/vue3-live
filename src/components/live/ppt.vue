<template>
  <div :class="['ppt-list', { 'small-type': placeType === 2 }]">
    <img :src="speechPageUrl" alt="">
    <div class="ppt_num">
      <span>{{speechPageNum}}</span>
    </div>

    <div class="ppt-full-btn" @click="fullOn" v-show="placeType === 1"></div>

    <div class="ppt-full-wrap" v-show="pptIsFull">
      <i class="el-icon-close" @click="fullOff"></i>
      <div class="ppt-full-block">
        <img :src="speechPageUrl" alt="">
      </div>
    </div>

    <!-- 插播视频 -->
    <div class="insert_video_box" v-show="isOpenInsert">
      <img class="video_cover" :src="room.bgUrl" alt="">
      <div id="insert_video_box" v-show="insertVideoShow"></div>
    </div>
    <!-- 播放按钮 -->
    <div class="insert_video_play_icon" v-if="showInsertVideoPlayIcon && insertVideoShow" @click="videoPlayFn"></div>
  </div>
</template>

<script>
import TIM from 'tim-js-sdk'
import { mapGetters, mapMutations } from 'vuex'
import { getroominstallvideo } from '../../services/room/index.js'
export default {
  name: 'livePpt',
  data () {
    return {
      speechPageNum: -1,
      speechPageUrl: '',
      pptIsFull: false,
      insertVideoPlayer: null, // 插播视频播放器实例
      insertVideoShow: false, // 显示插播视频
      showInsertVideoPlayIcon: false
    }
  },
  props: {
    placeType: {
      type: Number
    }
  },
  computed: {
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      liveStatus: 'room/liveStatus',
      isOpenLive: 'room/isOpenLive',
      isOpenInsert: 'room/isOpenInsert',
      isOpenSpeech: 'room/isOpenSpeech',
      dialogShopVideo: 'user/dialogShopVideo'
    })
  },
  methods: {
    ...mapMutations([
      'setIsOpenInsert'
    ]),
    fullOn () {
      this.pptIsFull = true
      document.getElementsByTagName("body")[0].style.cssText='height:100%;overflow:hidden;'
    },
    fullOff () {
      this.pptIsFull = false
      document.getElementsByTagName("body")[0].style.cssText=''
    },
    /**
     * @method creatVideoPlayer 创建回顾视频
     * @param {Number} playType 0:顺序播放，1：列表循环
     */
    creatVideoPlayer (options) {
      let {videoList, curIndex = 0, playType = 1} = options
      let playerOption = {
        "mp4": videoList[curIndex],
        "width": 820,
        "height": 460,
        "autoplay": true,
        "listener": (msg) => {
          if (msg.type == "ended") {
            if (curIndex >= videoList.length - 1) {
              if (playType === 1) {
                curIndex = 0
                this.insertVideoPlayer.load(videoList[curIndex])
              } else {
                curIndex = 0
                this.insertVideoPlayer.load(videoList[curIndex])
                this.insertVideoPlayer.pause()
              }
            } else {
              curIndex++
              this.insertVideoPlayer.load(videoList[curIndex])
            }
          }
          if (msg.type == "loadeddata") {
            console.log('insert loadeddata')
            this.showInsertVideoPlayIcon = true
          }
          if (msg.type == "play") {
            console.log('play')
            this.showInsertVideoPlayIcon = false
          }
          if (msg.type == "playing") {
            console.log('playing')
            this.showInsertVideoPlayIcon = false
          }
        }
      }
      this.insertVideoShow = true
      this.insertVideoPlayer =  new TcPlayer('insert_video_box', playerOption)

      if (this.dialogShopVideo) {
        this.insertVideoShow = false;
        this.insertVideoPlayer.pause();
      }
    },
    videoPlayFn () {
      if (this.showInsertVideoPlayIcon) {
        this.insertVideoPlayer.play()
        this.showInsertVideoPlayIcon = false
        this.$EventBus.$emit('insertVideoPlay')
      }
    },
    destroyInsertPlayer () {
      if (this.insertVideoPlayer !== null) {
        this.insertVideoShow = false
        this.insertVideoPlayer.destroy()
        this.insertVideoPlayer = null
        $('#insert_video_box').html('')
      }
    },
  },
  mounted () {
    // this.$EventBus.$on('liveVideoPlay', this.videoPlayFn)
    if (this.isOpenSpeech === 1) {
      this.speechPageNum = this.room.speechDataDto.speechPageNum
      this.speechPageUrl = this.room.speechDataDto.speechPageUrl
    }

    const pptMsgEvent = event => {
      event.data.forEach(eventItem => {
        const payloadData = JSON.parse(eventItem.payload.data)
        if (payloadData.roomId != this.roomId) {
          return
        }
        switch (payloadData.msgCode) {
          // 演讲稿翻页消息
          case 1023:
            console.log('演讲稿翻页消息1023')
            console.log(payloadData)
            if (this.isOpenSpeech === 0) {
              this.$store.commit('setIsOpenSpeech', 1)
            }
            this.speechPageNum = payloadData.pageNum
            this.speechPageUrl = payloadData.pageUrl
            break

          // 结束演讲稿消息
          case 1024:
            console.log('结束演讲稿消息1024')
            this.$store.commit('setIsOpenSpeech', 0)
            break

          // 播放插播视频消息
          case 1717:
            console.log('播放插播视频消息1717')
            console.log(payloadData)

            this.destroyInsertPlayer()

            let urlList = []
            payloadData.videoUrlDtoList.forEach(item => {
              urlList.push(item.url)
            })

            this.setIsOpenInsert(1)
            this.creatVideoPlayer({
              videoList: urlList,
              curIndex: 0,
              playType: payloadData.type
            })
            break;

          // 停止插播视频广播消息
          case 1718:
            console.log('停止插播视频广播消息1718')
            console.log(payloadData)

            this.destroyInsertPlayer()
            this.setIsOpenInsert(0)
            break;
        }
      })
    }
    // this.tim.on(TIM.EVENT.MESSAGE_RECEIVED, pptMsgEvent)

    // 是否开启插播视频
    if (this.isOpenInsert === 1 && this.liveStatus === 2) {
      getroominstallvideo(this.roomId).then(res => {
        let urlList = []
        res.data.videoUrlDtoList.forEach(item => {
          urlList.push(item.url)
        })

        // this.creatVideoPlayer({
        //   videoList: urlList,
        //   curIndex: 0,
        //   playType: res.data.type
        // })
      })
    }

    // 结束插播视频
    // this.$EventBus.$on('insertVideoEnd',() => {
    //   this.destroyInsertPlayer()
    //   this.setIsOpenInsert(0)
    // })
  },
  watch: {
    dialogShopVideo (val) {
      if (this.insertVideoPlayer) {
        if (val) {
          this.insertVideoShow = false;
          this.insertVideoPlayer.pause();
        } else {
          this.insertVideoPlayer.play();
          this.insertVideoShow = true;
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ppt-list {
  position: relative;
  width: 820px;
  height: 460px;
  background: grey;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ppt_num {
    position: absolute;
    bottom: 20px;
    left: 50%;
    height: 20px;
    padding: 0 15px;
    font-size: 14px;
    line-height: 20px;
    border-radius: 20px;
    background: rgba(255, 255, 255, .6);
    transform: translateX(-50%);
    user-select: none;
  }
  .ppt-full-btn {
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

  .insert_video_box {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    overflow: hidden;
    background: #000;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    #insert_video_box {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  }

  .insert_video_play_icon {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4.5em;
    height: 4.5em;
    transform: translateX(-50%) translateY(-50%);
    background: url(../../assets/icon_play.png) no-repeat;
    background-size: 100% 100%;
    z-index: 12;
    cursor: pointer;
  }
}
.ppt-list.small-type {
  position: absolute;
  right: -380px;
  top: 0px;
  width: 360px;
  height: 203px;
}

.ppt-full-wrap {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba($color: #000000, $alpha: 0.8);
  z-index: 1000;
  padding: 50px;

  .el-icon-close {
    position: absolute;
    right: 20px;
    top: 20px;
    font-size: 26px;
    color: #fff;
    cursor: pointer;
  }
  .ppt-full-block {
    width: 100%;
    height: 100%;
  }

  .speech_control {
    position: absolute;
    left: 50%;
    bottom: 10px;
    transform: translateX(-50%);
    height: 32px;
    padding: 0 10px;
    line-height: 32px;
    text-align: center;
    color: #1F1F1F;
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.5);
    user-select: none;

    .speech_next, .speech_prev {
      font-size: 16px;
      padding: 5px;
      cursor: pointer;
    }
    .speech_page {
      font-size: 18px;
      margin: 0 10px;
    }
  }
}
</style>
