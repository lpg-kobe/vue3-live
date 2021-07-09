<template>
  <div class="ofweek-ppt-container">
    <div class="ppt-empty" v-show="false">
      <p>暂无分享文件</p>
    </div>
    <div class="ppt-bg"></div>
    <div class="ppt-controll">
      <i class="icon icon-full"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: "ppt",
  data() {
    return {};
  },
  props: {},
  computed: {},
  methods: {},
};
</script>

<style lang="scss" scoped>
.ofweek-ppt-container {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  .ppt-bg {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    background: url(../../../../assets/img/ppt-demo.png) no-repeat center/100%;
  }
  .ppt-empty {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    background: url(../../../../assets/img/live/bg-noppt.png) no-repeat
      center/100px;
    p {
      margin-top: 360px;
      text-align: center;
      color: #797878;
      font-size: 14px;
    }
  }
}
</style>
