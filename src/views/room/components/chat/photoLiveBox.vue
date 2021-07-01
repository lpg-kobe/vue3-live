<template>
  <div class="wrap-container" v-if="tab.length > 0">
    <div class="tabs right_tabs">
      <ul>
        <li
          v-for="(item, index) in tab"
          :class="{ active: active === item.menuType }"
          @click="clickTab(item.menuType)"
          :key="index"
          v-show="item.menuType === 7"
          :title="tabTransEn(item.menuType)"
        >
          {{ tabTransEn(item.menuType) }}
        </li>
      </ul>
      <a
        class="fr more-link"
        target="_blank"
        :href="`http://photo.ofweek.com/wap/activity/index?id=${room.picId}`"
        >{{ $t('common.more') }}</a
      >
    </div>

    <div v-show="active === 7" class="tabs_con">
      <PhotoLive :id="room.picId" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import PhotoLive from './PhotoLive.vue'
export default {
  name: 'photoLiveBox',
  data() {
    return {
      defineTab: [{ menuType: 7, name: '图片直播', sort: 0 }],
      tab: [],
      active: 0,
      hasShow: false,
    }
  },
  components: {
    PhotoLive,
  },
  computed: {
    ...mapGetters(['user', 'room']),
  },
  methods: {
    tabTransEn(type) {
      switch (type) {
        case 7:
          return this.$t('menu.type7')
          break
      }
    },
    // tab切换
    clickTab(index) {
      this.active = index
      if (this.hasShow === false && index === 3) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.$refs.question.toBottomFn()
          }, 1)
        })
        this.hasShow = true
      }
    },
  },
  created() {
    this.defineTab.forEach((item) => {
      this.room.menulist.forEach((item2) => {
        if (item.menuType === item2.menuType) {
          item.sort = item2.sort
          this.tab.push(item)
        } else if (item.menuType === 10 && item2.menuType === 3) {
          this.tab.push(item)
        }
      })
    })
    if (this.tab.length > 0) {
      this.active = this.tab[0].menuType
    }
  },
  mounted() {},
}
</script>

<style lang="scss" scoped>
.tabs {
  position: relative;

  .more-link {
    font-size: 14px;
    color: #808080;
    line-height: 50px;
  }
}
</style>
