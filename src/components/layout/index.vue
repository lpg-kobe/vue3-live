<template>
  <header></header>
  <main>
    <section class="section-l">
      <router-view />
      <div class="menu"></div>
    </section>
    <section class="section-r"></section>
  </main>
</template>

<script>
export default {
  name: "layout",
};
</script>

<style lang="scss" scoped>
header {
  height: 48px;
  background: #000;
  margin-bottom: 12px;
}

main {
  width: 1200px;
  display: flex;
  min-height: 520px;
  margin: 0 auto;
}

.section-l {
  flex: 1;
}

.section-r {
  width: 360px;
  flex-basis: 360px;
  margin-left: 12px;
  background: #000;
}

.menu {
  height: 240px;
  background: #000;
}
</style>