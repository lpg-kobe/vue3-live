<template></template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'layout',

  components: {},

  computed: {
    ...mapState({
      live: ({ live }) => live,
      user: ({ user }) => user,
    }),
  },
  methods: {},
}
</script>

<style lang="scss" scoped>
</style>