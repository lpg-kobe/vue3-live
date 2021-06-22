<template>
  <div class="thumb-view-container">
    <div :id="liveThumbId"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'thumbView',
  computed: {
    ...mapState({
      liveThumbId: ({ live: { liveThumbId } }) => liveThumbId
    })
  }
}
</script>
<style lang="scss" scoped>
.thumb-view-container{
  height: 198px;
  width: 352px;
  background: green;
  }
</style>