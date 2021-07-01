<template>
  <div class="wrap-container">
    <div class="tabs right_tabs">
      <ul>
        <li
          v-for="(item, index) in tab"
          :class="{ active: active === item.menuType }"
          v-show="item.menuType !== 7"
          @click="clickTab(item.menuType, index)"
          :key="index"
          :title="tabTransEn(item.menuType)"
        >
          {{ tabTransEn(item.menuType) }}
        </li>
      </ul>
      <div class="fr hot_num">{{ pv }}</div>
    </div>

    <div v-show="active === 1" class="tabs_con">
      <chat-list ref="chat" />
    </div>

    <div v-show="active === 3" class="tabs_con">
      <question ref="question" />
    </div>

    <div v-show="active === 9" class="tabs_con">
      <member />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import chatList from './chat.vue'
import question from './question.vue'
import member from './member.vue'
export default {
  name: 'chat',
  data() {
    return {
      defineTab: [
        { menuType: 1, name: '互动区', sort: 0 },
        { menuType: 3, name: '问答区', sort: 0 },
        { menuType: 7, name: '图片直播', sort: 0 },
      ],
      tab: [],
      active: 0,
      hasShow: false,
    }
  },
  components: {
    chatList,
    question,
    member,
  },
  computed: {
    ...mapGetters({
      room: 'room/room',
      roomId: 'room/roomId',
      user: 'user/user',
      pv: 'room/pv',
    }),
  },
  methods: {
    tabTransEn(type) {
      switch (type) {
        case 1:
          if (this.roomId === '211') {
            return 'Discussion en ligne'
          } else {
            return this.$t('menu.type1')
          }
          break
        case 3:
          return this.$t('menu.type3')
          break
        case 9:
          return this.$t('menu.type9')
          break
      }
    },
    // tab切换
    clickTab(index, index2) {
      this.active = index
      if (this.hasShow === false && index2 != 0) {
        if (index === 1) {
          this.$nextTick(() => {
            // this.$refs.chat.toBottomFn()
          })
          this.hasShow = true
        } else if (index === 3) {
          this.$nextTick(() => {
            // this.$refs.question.toTop()
          })
          this.hasShow = true
        }
      }
    },
    compare(property) {
      return function (a, b) {
        var value1 = a[property]
        var value2 = b[property]
        return value2 - value1
      }
    },
  },
  created() {
    this.room.menulist.forEach((item) => {
      this.defineTab.forEach((item2) => {
        if (item.menuType === item2.menuType) {
          item.sort = item2.sort
          this.tab.push(item)
        } else if (item.menuType === 10 && item2.menuType === 3) {
          this.tab.push(item)
        }
      })
    })
    if (this.user.role === 1 || this.user.role === 2) {
      this.tab.push({ menuType: 9, name: this.$t('menu.type9'), sort: 0 })
    }
    // this.tab.sort(this.compare('sort'))
    if (this.tab[0].menuType === 7) {
      this.active = this.tab[1].menuType
    } else if (this.tab.length > 0) {
      this.active = this.tab[0].menuType
    }
  },
  mounted() {},
}
</script>

<style lang="scss" scoped>
.hot_num {
  line-height: 50px;
  padding-left: 20px;
  background: url(../../../../assets/hot.png) no-repeat left center;
}
</style>
