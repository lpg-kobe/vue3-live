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
    Speaker
  },
  computed: {
    ...mapState({
      live: ({ live }) => live
    })
  }
}
</script>
<style lang="scss" scoped>
.thumb-view-container{
  height: 198px;
  width: 352px;
  overflow: hidden;
  }
</style>