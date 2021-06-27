<template>
  <el-dialog
    title="媒体设置"
    v-model="visible"
    width="30%"
    custom-class="ofweek-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div id="mediaPreview" class="stream-view"></div>
    <el-form :model="mediaForm" label-position="right">
      <el-form-item label="音量" label-width="75px">
        <el-progress
          :stroke-width="14"
          :show-text="false"
          :percentage="voiceLevel"
          class="audio-process"
        ></el-progress>
      </el-form-item>
      <el-form-item label="摄像头" label-width="75px">
        <el-select
          v-model="mediaForm.cameraId"
          placeholder="请选择摄像头"
          @change="handleMediaChange('camera', $event)"
          class="media-select"
        >
          <el-option
            v-for="item in cameras"
            :key="item.deviceId"
            :label="item.label"
            :value="item.deviceId"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="麦克风" label-width="75px">
        <el-select
          v-model="mediaForm.micId"
          placeholder="请选择麦克风"
          class="media-select"
          @change="handleMediaChange('mic', $event)"
        >
          <el-option
            v-for="item in mics"
            :key="item.deviceId"
            :label="item.label"
            :value="item.deviceId"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleBtnClick(0)">刷新设备</el-button>
        <el-button
          type="primary"
          @click="handleBtnClick(1)"
          :disabled="!cameras?.length || !mics?.length"
          >确定</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'mediaCheck',

  setup() {},

  watch: {
    visible: {
      handler: function (val) {
        if (!val) {
          this.cancelVoiceLevelCheck()
          return
        }
        this.initStream()
      },
      immediate: true,
    },
  },

  props: {
    visible: {
      default: true,
      type: Boolean,
    },
    // user is live
    live: {
      default: false,
      type: Boolean,
    },
    // trtc-client
    client: {
      default: {},
      type: Object,
    },
    // trtc-user
    user: {
      default: {},
      type: Object,
    },
  },

  data() {
    return {
      mediaForm: {
        cameraId: '',
        micId: '',
      },
      timer: null,
      voiceLevel: 0,
      mics: [],
      cameras: [],
    }
  },

  emits: ['btnClick'],

  created() {},

  methods: {
    async initStream() {
      // you must may sure camera | mic all exist before create new stream & render to ui after analize success in order to get correct deviceId, error will be handle after that
      const cameraList = await this.client.getCameras()
      const micList = await this.client.getMics()

      if (!cameraList?.length) {
        ElMessage.error('找不到摄像头，请插入摄像头重试')
        return
      }

      if (!micList?.length) {
        ElMessage.error('找不到麦克风，请插入麦克风后重试')
        return
      }

      if (!this.client.stream) {
        const { error } = await this.client.createStream({
          userId: this.user?.imAccount,
          video: true,
          audio: true,
          settings: '720p',
        })

        if (error) {
          this.handleInitialStreamErr(error)
          return
        }
      }

      await this.client.stream.stop()
      this.client.stream.play('mediaPreview', {
        muted: true,
      })
      this.voiceLevelCheck()
      this.cameras = cameraList
      this.mics = micList
      this.mediaForm = {
        micId: this.client.getCurMic()?.deviceId,
        cameraId: this.client.getCurCamera()?.deviceId,
      }
    },

    handleInitialStreamErr(error) {
      switch (error.name) {
        case 'NotReadableError':
          // 当系统或浏览器异常的时候，可能会出现此错误，您可能需要引导用户重启电脑/浏览器来尝试恢复。
          ElMessage.error(
            '暂时无法访问摄像头/麦克风，请确保系统授予当前浏览器摄像头/麦克风权限，并且没有其他应用占用摄像头/麦克风'
          )
          break

        case 'NotAllowedError':
          ElMessage.error('摄像头或麦克风访问权限已被拒绝，请重新授权开启')
          break

        case 'NotFoundError':
          // 找不到摄像头或麦克风设备
          ElMessage.error('找不到摄像头或麦克风设备，请插入设备后重试')
          break

        case 'OverConstrainedError':
          // "采集属性设置错误，如果您指定了 cameraId/microphoneId，请确保它们是一个有效的非空字符串"
          ElMessage.error(
            '设备无法访问，请确保当前没有其他应用请求访问摄像头/麦克风，并重试'
          )
          break

        default:
          ElMessage.error('直播媒体检测出现未知异常，请重试')
          break
      }
    },

    raqToCheckAudio() {
      this.voiceLevel = this.client.stream?.getAudioLevel() * 100
      this.timer = window.requestAnimationFrame?.(this.raqToCheckAudio)
    },

    voiceLevelCheck() {
      this.cancelVoiceLevelCheck()
      this.timer = window.requestAnimationFrame?.(this.raqToCheckAudio)
    },

    cancelVoiceLevelCheck() {
      window.cancelAnimationFrame?.(this.timer)
      this.timer = null
    },

    async handleMediaChange(type, value) {
      if (value === 'default') {
        return
      }
      if (type === 'mic') {
        this.client.switchMic()
      } else {
        const result = this.client.switchCamera()
        if (result) {
          await this.client.stream.stop()
          this.client.stream.play('mediaPreview')
        }
      }
    },

    handleBtnClick(sure) {
      if (sure) {
        this.$emit('btnClick')
      } else {
        this.initStream()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.audio-process {
  margin-top: 12px;
}
.media-select {
  width: 100%;
}
.stream-view {
  height: 100%;
}
</style>