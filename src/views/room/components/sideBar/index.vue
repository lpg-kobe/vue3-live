<template>
  <div class="container_tiem">
    <div class="live-box">
      <live-ppt
        v-show="showPpt"
        :placeType="placeType"
        :speechCurrentIndex="speechCurrentIndex"
        :speechDetailData="speechDetailData"
        @speechPrev="turnSpeechFn('prev')"
        @speechNext="turnSpeechFn('next')"
      />

      <div class="live_control" @click="controlClick">
        <ul>
          <li>
            <el-switch
              v-model="openCamera"
              active-color="#4BC949"
              inactive-color="#D9D9D9"
            >
            </el-switch>
            <span>{{ $t('live.camera') }}</span>
          </li>
          <li>
            <el-switch
              v-model="openMicrophone"
              active-color="#4BC949"
              inactive-color="#D9D9D9"
            >
            </el-switch>
            <span>{{ $t('live.microphone') }}</span>
          </li>
          <li class="pointer_li" @click="showSpeechDialog">
            <img src="../../../../assets/speech_icon.png" alt="" />
            <span>{{ $t('live.speech') }}</span>
          </li>
          <li class="pointer_li" @click="showVideoDialog">
            <img src="../../../../assets/play_icon.png" alt="" />
            <span>插播视频</span>
          </li>
          <li
            class="pointer_li"
            v-if="user.role === 1 && room.isOpenQuestionnaire"
            @click="showQuesDialog"
          >
            <img src="../../../../assets/question.png" alt="" />
            <span>{{ $t('live.questionnaireSurvey') }}</span>
          </li>
        </ul>
        <div :class="['speech_control', { 'place-small': placeType === 2 }]">
          <span class="speech_prev" @click="turnSpeechFn('prev')"
            ><i class="el-icon-arrow-left"></i
          ></span>
          <span class="speech_page">{{
            `${speechCurrentIndex + 1}/${speechDetailData.length}`
          }}</span>
          <span class="speech_next" @click="turnSpeechFn('next')"
            ><i class="el-icon-arrow-right"></i
          ></span>
        </div>
        <div
          :class="['close_speech', { 'place-small': placeType === 2 }]"
          v-show="auchorStartRoom && isOpenSpeech"
          @click="choseSpeechFn"
        >
          {{ $t('live.closeSpeech') }}
        </div>
      </div>
      <input id="speech_control_input" type="text" />

      <!-- 演讲稿 -->
      <el-dialog
        width="50%"
        :title="$t('live.speech')"
        :visible.sync="speechDialog"
      >
        <el-table
          :data="speechList"
          v-loading="speechDialogLoading"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="name"
            :label="$t('live.docName')"
          ></el-table-column>
          <el-table-column
            prop="fileSize"
            :label="$t('live.size')"
            class="tc"
          ></el-table-column>
          <el-table-column prop="date" :label="$t('live.operation')" class="tc">
            <template slot-scope="scope">
              <el-button size="mini" @click="handleSpeech(scope.row.id)">{{
                $t('live.demo')
              }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <!-- 录播视频 -->
      <el-dialog width="30%" title="录播视频" :visible.sync="videoDialog">
        <el-form ref="form" :model="videoForm" label-width="80px">
          <el-form-item label="视频名称">
            <el-select v-model="videoForm.id">
              <el-option
                v-for="(item, index) of videoList"
                :key="index"
                :label="item.questionnaireTitle"
                :value="item.questionnaireId"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="循环播放">
            <el-switch v-model="videoForm.loop"></el-switch>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="show2 = false">保存</el-button>
        </div>
      </el-dialog>

      <!-- 问卷调查 -->
      <el-dialog
        width="30%"
        :title="$t('live.questionnaireSurvey')"
        :visible.sync="quesDialog"
      >
        <el-form ref="form" :model="quesForm" label-width="80px">
          <el-form-item :label="$t('live.questionnaireName')">
            <el-select v-model="quesForm.id">
              <el-option
                v-for="(item, index) of quesList"
                :key="index"
                :label="item.questionnaireTitle"
                :value="item.questionnaireId"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="quesDialogSand">{{
            $t('common.send')
          }}</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import videos from '@/components/live/video'
import livePpt from '@/components/live/ppt'
import shareBar from '@/components/live/shareBar'
import { mapGetters } from 'vuex'
import {
  getRoomQuestionnaireList,
  sendQuestionnaire,
  speechGetlist,
  speechGetdetail,
  turnSpeech,
  stopSpeech,
} from '@/api'
export default {
  name: 'liveBox',
  data() {
    return {
      placeType: 2,
      openCamera: true,
      openMicrophone: true,
      videoDialog: false,
      quesDialog: false,
      speechDialog: false,
      speechDialogLoading: false,
      quesForm: {
        id: '',
      },
      videoForm: {
        id: '',
        loop: false,
      },
      quesList: [],
      videoList: [],
      speechList: [],
      speechDetailData: [],
      curSpeechId: '',
      speechCurrentIndex: 0,
    }
  },
  components: {
    videos,
    shareBar,
    livePpt,
  },
  computed: {
    ...mapGetters([
      'roomId',
      'room',
      'user',
      'isOpenLive',
      'isOpenSpeech',
      'auchorOpenLive',
      'auchorStartRoom',
      'anchorWatch',
      'settingLiveType',
    ]),
    showPpt() {
      if (this.user.role === 1 && this.user.role === 2) {
        if (anchorWatch) {
          return this.isOpenSpeech && this.isOpenLive
        } else {
          return this.isOpenSpeech && this.auchorStartRoom
        }
      } else {
        console.log(this.isOpenSpeech)
        console.log(this.isOpenLive)

        return this.isOpenSpeech && this.isOpenLive
      }
    },
  },
  methods: {
    showQuesDialog() {
      if (!this.room.isOpenQuestionnaire) {
        this.$message.error('主播未开启问卷')
        return
      }
      this.quesDialog = true
      getRoomQuestionnaireList({ roomid: this.roomId }).then((res) => {
        this.quesList = res.data
      })
    },
    quesDialogSand() {
      if (this.quesForm.id.length < 1) {
        this.$message.error('请选择需要发送的问卷')
        return
      }
      sendQuestionnaire({
        roomid: this.roomId,
        questionnaireid: this.quesForm.id,
      }).then((res) => {
        this.quesForm.id = ''
        this.quesDialog = false
        this.$message.success('问卷发送成功')
      })
    },
    showSpeechDialog() {
      this.speechDialog = true
      this.speechDialogLoading = true
      speechGetlist({ roomid: this.roomId }).then((res) => {
        this.speechDialogLoading = false
        this.speechList = res.data
      })
    },
    handleSpeech(val) {
      this.curSpeechId = val
      this.speechCurrentIndex = 0
      speechGetdetail({ speechid: val }).then((res) => {
        console.log(res)
        this.speechDetailData = res.data.pages
        this.turnSpeechFn()
        this.speechDialog = false
        document.getElementById('speech_control_input').style.display = 'block'
        document.getElementById('speech_control_input').focus()
      })
    },
    turnSpeechFn(type) {
      if (type === 'prev') {
        if (this.speechCurrentIndex <= 0) {
          return
        } else {
          this.speechCurrentIndex--
        }
      } else if (type === 'next') {
        if (this.speechCurrentIndex >= this.speechDetailData.length - 1) {
          return
        } else {
          this.speechCurrentIndex++
        }
      }
      turnSpeech({
        pageNum: this.speechDetailData[this.speechCurrentIndex].page,
        pageUrl: this.speechDetailData[this.speechCurrentIndex].url,
        roomId: this.roomId,
        speechId: this.curSpeechId,
      }).then((res) => {
        console.log(res)
      })
    },
    choseSpeechFn() {
      stopSpeech({ roomid: this.roomId, speechid: this.curSpeechId }).then(
        (res) => {
          console.log(res)
          this.speechCurrentIndex = 0
          document.getElementById('speech_control_input').style.display = 'none'
        }
      )
    },
    showVideoDialog() {
      this.videoDialog = true
    },
    controlClick() {
      document.getElementById('speech_control_input').focus()
    },
  },
  created() {
    if (this.isOpenSpeech) {
      if (this.isOpenLive) {
        this.placeType = 1
      } else {
        this.placeType = 2
      }

      this.curSpeechId = this.room.speechDataDto.speechId
      this.speechCurrentIndex = this.room.speechDataDto.speechPageNum - 1

      if (this.user.role === 1 || this.user.role === 2) {
        speechGetdetail({ speechid: this.curSpeechId }).then((res) => {
          console.log(res)
          this.speechDetailData = res.data.pages
        })
      }
    }
  },
  mounted() {
    document.getElementById('speech_control_input').onkeydown = (e) => {
      if (e.keyCode === 37) {
        this.turnSpeechFn('prev')
      } else if (e.keyCode === 39) {
        this.turnSpeechFn('next')
      }
    }
  },
  watch: {
    isOpenSpeech(newVal, oldVal) {
      if (oldVal == 1 && this.placeType === 1) {
        this.placeType = 2
      }
      if (oldVal == 0 && this.placeType === 2) {
        this.placeType = 1
      }
    },
  },
}
</script>

<style lang="scss">
.live-box {
  position: relative;
  width: 820px;
  height: 460px;
}
.place-change {
  position: absolute;
  right: 312px;
  top: 38px;
  width: 28px;
  height: 28px;
  border-radius: 28px;
  background: rgba(0, 0, 0, 0.3);
  z-index: 5;
  text-align: center;
  line-height: 28px;
  cursor: pointer;

  &::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    background: url(../../../../assets/switch_icon2.png) no-repeat;
    background-size: contain;
    vertical-align: middle;
  }
}

.live_control {
  position: absolute;
  left: 0;
  top: 0;
  width: 820px;
  height: 460px;
  z-index: 7;

  ul {
    position: absolute;
    left: 0;
    top: 0;
    width: 80px;
    height: 100%;
    background: #424242;

    li {
      text-align: center;
      margin-top: 30px;

      &:first-child {
        margin-top: 26px;
      }

      span {
        display: block;
        font-size: 14px;
        color: #fff;
        margin-top: 13px;
      }
    }
    .pointer_li {
      cursor: pointer;

      img {
        height: 22px;
      }

      span {
        margin-top: 10px;
      }
    }
  }
}
.speech_control {
  position: absolute;
  left: 335px;
  bottom: 10px;
  // transform: translateX(-50%);
  // width: 150px;
  height: 32px;
  padding: 0 10px;
  line-height: 32px;
  text-align: center;
  color: #1f1f1f;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.5);
  user-select: none;

  .speech_next,
  .speech_prev {
    font-size: 16px;
    padding: 5px;
    cursor: pointer;
  }
  .speech_page {
    display: inline-block;
    font-size: 18px;
    min-width: 70px;
  }

  &.place-small {
    left: 945px;
    bottom: 277px;
  }
}
.close_speech {
  position: absolute;
  right: 20px;
  top: 20px;
  display: inline-block;
  min-width: 58px;
  height: 28px;
  padding: 0 11px;
  font-size: 14px;
  color: #fff;
  line-height: 28px;
  text-align: center;
  border-radius: 28px;
  border: 1px solid #e65e50;
  background: #e65e50;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &.place-small {
    right: -360px;
  }
}
#speech_control_input {
  display: none;
  width: 1px;
  height: 1px;
  border: 0;
  outline: none;
  opacity: 0;
}
</style>
