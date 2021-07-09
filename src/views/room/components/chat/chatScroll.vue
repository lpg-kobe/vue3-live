<template>
  <div class="chat-scroll" ref="chatScroll">
    <el-scrollbar ref="scrollbarRef">
      <div class="scroll_box">
        <slot></slot>
      </div>
    </el-scrollbar>
  </div>
</template>

<script>

export default {
  name: 'chatScroll',
  data () {
    return {
      wrap: null,
      box: null
    }
  },
  props: {
    wrapClass: {
      type: String
    }
  },
  methods: {
    toBottom () {
      let h_wrap = this.wrap.scrollHeight
      let h_box = this.box.offsetHeight
      let needScroll = h_wrap - h_box
      this.wrap.scrollTop = needScroll
    },
    toTop () {
      this.wrap.scrollTop = 0
    },
    scrollToBottom (isScroll) {
      console.log('scrollToBottom')
    },
    scrollToTop () {
      this.wrap.animate({scrollTop: 0}, 300)
    },
    toLi (index) {
      let _top = this.box.find('.chat_item').eq(index).position().top
      this.wrap.scrollTop = _top
    }
  },
  mounted () {
    this.wrap = this.$refs.scrollbarRef.wrap
    this.box = this.$refs.chatScroll

    this.wrap.addEventListener("scroll", () => {
      let h_wrap = this.wrap.scrollHeight
      let h_box = this.box.offsetHeight
      if (this.wrap.scrollTop === 0) {
        console.log('maxTop')
        this.$emit('maxTop')
      } else if (this.wrap.scrollTop >= h_wrap - h_box - 50) {
        this.$emit('maxBottom')
      }
    });
  }
}
</script>

<style lang="scss">
.chat-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;

  .el-scrollbar {
    height: 100%;
  }
  .el-scrollbar__bar.is-vertical {
    width: 4px;
  }
  .el-scrollbar__wrap {
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
