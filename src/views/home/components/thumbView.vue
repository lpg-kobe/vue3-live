<template>
  <div class="thumb-view-container">
    <Speaker v-if="live.liveMainView !== 0" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Speaker from './speaker.vue'

export default {
  name: 'thumbView',
  components: {
    Speaker,
  },
  computed: {
    ...mapState({
      live: ({ live }) => live,
    }),
  },
}
</script>
<style lang="scss" scoped>
.thumb-view-container {
  position: relative;
  height: calc(9 / 16 * 360px);
  width: 360px;
  overflow: hidden;
}
</style>