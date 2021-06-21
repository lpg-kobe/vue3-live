<template>
  <Live />
</template>
<script>
import { mapState } from "vuex";
import Live from "./components/live.vue";
export default {
  name: "home",
  components: {
    Live,
  },
  computed: {
    ...mapState([""]),
  },
  created() {},
};
</script>
 