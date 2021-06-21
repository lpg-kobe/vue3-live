<template>
  <Layout>
    <!-- <router-view /> -->
  </Layout>
</template>

<script>
import Layout from "./components/layout/index.vue";

export default {
  name: "app",
  components: {
    Layout,
  },
  setup() {
    // this api use in global, don`t do other thing on this
  },
};
</script>