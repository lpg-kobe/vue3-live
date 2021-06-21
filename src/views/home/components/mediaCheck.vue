<template>
  <el-dialog
    title="媒体设置"
    v-model="visible"
    width="30%"
    custom-class="ofweek-dialog"
    @close="$emit('btnClick', 0)"
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
        <el-button @click="$emit('btnClick', 0)">取 消</el-button>
        <el-button type="primary" @click="$emit('btnClick', 1)"
          >确 定</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { onMounted, watch, ref, toRefs } from "vue";
import { ElMessage } from "element-plus";

export default {
  name: "mediaCheck",

  setup(props) {
    let timer = ref(null);
    let voiceLevel = ref(0);
    const { client: trtcClient, user } = props;
    const mics = ref([]);
    const cameras = ref([]);
    const { visible } = toRefs(props);

    // check device
    function onVisible() {
      if (!visible.value) {
        window.cancelAnimationFrame?.(timer.value);
        return;
      }
      initStream();
    }

    async function initStream() {
      if (!trtcClient.stream) {
        const { error } = await trtcClient.createStream({
          userId: user?.imAccount,
          video: true,
          audio: true,
          settings: "720p",
        });

        if (error) {
          handleGetUserMediaError(error);
          return;
        }

        trtcClient.stream.play("mediaPreview", {
          muted: true,
        });
      }

      timer.value = window.requestAnimationFrame?.(raqToCheckAudio);
      cameras.value = await trtcClient.getCameras();
      mics.value = await trtcClient.getMics();
    }

    /**
     * error handle of create stream
     * @param {Error} error
     */
    function handleGetUserMediaError(error) {
      switch (error.name) {
        case "NotReadableError":
          // 当系统或浏览器异常的时候，可能会出现此错误，您可能需要引导用户重启电脑/浏览器来尝试恢复。
          ElMessage.error(
            "暂时无法访问摄像头/麦克风，请确保系统授予当前浏览器摄像头/麦克风权限，并且没有其他应用占用摄像头/麦克风"
          );
          break;

        case "NotAllowedError":
          ElMessage.error("摄像头或麦克风访问权限已被拒绝，请重新授权开启");
          break;

        case "NotFoundError":
          // 找不到摄像头或麦克风设备
          ElMessage.error("找不到摄像头或麦克风设备，请插入设备后重试");
          break;

        case "OverConstrainedError":
          //"采集属性设置错误，如果您指定了 cameraId/microphoneId，请确保它们是一个有效的非空字符串"
          break;

        default:
          ElMessage.error("初始化本地流时遇到未知错误, 请重试");
          break;
      }
    }

    function raqToCheckAudio() {
      voiceLevel.value = trtcClient.stream?.getAudioLevel() * 100;
      timer.value = window.requestAnimationFrame?.(raqToCheckAudio);
    }

    onMounted(onVisible);
    watch(visible, onVisible);

    return {
      voiceLevel,
      mics,
      cameras,
    };
  },

  data() {
    return {};
  },

  props: {
    visible: {
      default: true,
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
        cameraId: "",
        micId: "",
      },
    };
  },

  emits: ["btnClick"],

  created() {},

  methods: {},
};
</script>

<style lang="scss" scoped>
.audio-process {
  margin-top: 12px;
}
.media-select {
  width: 100%;
}
</style>