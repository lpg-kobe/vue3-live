<template>
  <header>
    <el-button
      type="primary"
      @click="start"
      :loading="live.liveToggleLoading"
      v-show="!live.liveStart"
      v-if="user.user.role === 1"
      >开始直播</el-button
    >
    <el-button
      @click="stop"
      v-show="live.liveStart"
      v-if="user.user.role === 1"
      :loading="live.liveToggleLoading"
      >结束直播</el-button
    >
    <el-button
      type="primary"
      @click="apply"
      v-show="!live.liveStart"
      v-if="user.user.role === 2"
      :loading="live.liveToggleLoading"
      >申请上麦</el-button
    >
    <el-button
      @click="offLine"
      v-show="live.liveStart"
      v-if="user.user.role === 2"
      :loading="live.liveToggleLoading"
      >下麦</el-button
    >
    <el-button @click="openMediaSetting">媒体设置</el-button>
  </header>
  <main>
    <section class="section-l">
      <router-view />
    </section>
    <section class="section-r">
      <thumb-view v-if="live.liveStart"></thumb-view>
    </section>
  </main>
</template>

<script>
import { mapState } from 'vuex'
import ThumbView from '../../views/home/components/thumbView.vue'
import { eventEmitter } from '../../utils/event'

export default {
  name: 'layout',

  components: {
    ThumbView,
  },

  computed: {
    ...mapState({
      live: ({ live }) => live,
      user: ({ user }) => user,
    }),
  },
  methods: {
    start() {
      eventEmitter.emit(eventEmitter.event?.anchor?.start)
    },

    stop() {
      eventEmitter.emit(eventEmitter.event?.anchor?.stop)
    },

    apply() {
      eventEmitter.emit(eventEmitter.event?.guest?.apply)
    },

    offLine() {
      eventEmitter.emit(eventEmitter.event?.guest?.stop)
    },

    openMediaSetting() {
      eventEmitter.emit(eventEmitter.event?.live?.setMedia)
    },
  },
}
</script>

<style lang="scss" scoped>
header {
  height: 48px;
  background: #000;
  margin-bottom: 12px;
}

main {
  min-width: 1200px;
  max-width: 1520px;
  width: 80%;
  min-height: 520px;
  margin: 0 auto;
}

.section-l {
  width: calc(100% - 12px - 360px);
  float: left;
}

.section-r {
  float: left;
  width: 360px;
  margin-left: 12px;
  background: #000;
}
</style>