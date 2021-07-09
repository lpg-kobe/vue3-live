<template>
  <div class="pic-box">
    <div id="small-pic">
      <img :src="url" alt="" />
      <div id="move-mark"></div>
    </div>
    <div id="big-pic">
      <img id="big-img" :src="url" alt="" />
    </div>
  </div>
</template>

<script>
export default {
  name: "question",
  data() {
    return {};
  },
  props: {
    url: {
      type: String,
    },
  },
  computed: {},
  created() {
    this.bindEvent();
  },
  methods: {
    bindEvent() {
      this.$nextTick(() => {
        let bigWrap = document.getElementById("small-pic");
        let moveMk = document.getElementById("move-mark");
        let bigBox = document.getElementById("big-pic");
        let bigImg = document.getElementById("big-img");
        bigWrap?.addEventListener("mouseover", () => {
          //鼠标移动到box上显示大图片和选框
          bigBox.style.display = "block";
          moveMk.style.display = "block";
        });
        
        bigWrap?.addEventListener("mouseout", () => {
          //鼠标移开box不显示大图片和选框
          bigBox.style.display = "none";
          moveMk.style.display = "none";
        });

        bigWrap?.addEventListener("mousemove", () => {
          //获取鼠标位置
          let x = e.clientX; //鼠标相对于视口的位置
          let y = e.clientY;
          let t = parseInt(bigWrap.getBoundingClientRect().top); //box相对于视口的位置
          let l = parseInt(bigWrap.getBoundingClientRect().left);

          let _left = x - l - moveMk.offsetWidth / 2; //计算move的位置
          let _top = y - t - moveMk.offsetHeight / 2;
          if (_top <= 0)
            //滑到box的最顶部
            _top = 0;
          else if (_top >= bigWrap.offsetHeight - moveMk.offsetHeight)
            //滑到box的最底部
            _top = bigWrap.offsetHeight - moveMk.offsetHeight;
          if (_left <= 0)
            //滑到box的最左边
            _left = 0;
          else if (_left >= bigWrap.offsetWidth - moveMk.offsetWidth)
            //滑到box的最右边
            _left = bigWrap.offsetWidth - moveMk.offsetWidth;
          moveMk.style.top = _top + "px"; //设置move的位置
          moveMk.style.left = _left + "px";
          let w = _left / (bigWrap.offsetWidth - moveMk.offsetWidth); //计算移动的比例
          let h = _top / (bigWrap.offsetHeight - moveMk.offsetHeight);
          let b_bimg_top = (bigImg.offsetHeight - bigBox.offsetHeight) * h; //计算大图的位置
          let b_bimg_left = (bigImg.offsetWidth - bigBox.offsetWidth) * w;
          bigImg.style.top = -b_bimg_top + "px"; //设置大图的位置信息
          bigImg.style.left = -b_bimg_left + "px";
        });
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.pic-box {
  position: relative;
  width: 100%;
  height: 100%;

  #small-pic {
    width: 100%;
    height: 100%;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    #move-mark {
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      width: 166px;
      height: 166px;
      background: #000;
      opacity: 0.4;
      cursor: move;
    }
  }

  #big-pic {
    display: none;
    position: absolute;
    left: 100%;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    overflow: hidden;
    z-index: 2;

    img {
      position: absolute;
      left: 0;
      top: 0;
      width: 200%;
      height: 200%;
      object-fit: contain;
    }
  }
}
</style>
