<template>
  <slot v-if="imgStatus !== 1" />
  <img :src="src" :alt="alt" v-else :class="className" />
</template>

<script>
import { ref, watch, toRefs, onMounted } from "vue";
import { loadImage } from "../../utils/tool";

export default {
  name: "Img",
  setup(props) {
    const imgStatus = ref(0);
    const { src } = toRefs(props);

    function onImgChange() {
      loadImage(src.value, (status) => {
        imgStatus.value = +status;
      });
    }

    onMounted(onImgChange);

    watch(src, onImgChange);

    return {
      imgStatus,
    };
  },
  props: {
    src: {
      type: String,
      default: "",
    },
    alt: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      default: "",
    },
  },
  methods: {},
};
</script>

