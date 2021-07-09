<template>
  <div class="thumb-view-container">
    <speaker v-if="live.liveMainView !== 0" />
  </div>
</template>

<script>
import { mapState } from "vuex";
import speaker from "../speaker/index.vue";

export default {
  name: "thumbView",
  components: {
    speaker,
  },
  computed: {
    ...mapState({
      live: ({ live }) => live,
    }),
  },
};
</script>
<style lang="scss" scoped>
.thumb-view-container {
  position: relative;
  height: calc(9 / 16 * 360px);
  width: 360px;
  overflow: hidden;
}
</style>