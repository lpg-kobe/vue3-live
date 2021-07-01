<template>
  <div class="download">
    <ul class="download_ul">
      <li v-for="(item, index) of data" :key="index">
        <a
          v-if="isVisitorLogin || !user.isCompletedInfo"
          @click="showLogin"
          href="javascript:;"
          >{{ item.name }}</a
        >
        <a
          v-else
          target="_blank"
          :href="`//${baseUrl}/api/web/download/roomdata?dataid=${item.id}&roomid=${roomId}&devType=3`"
          :download="
            item.name + item.fileUrl.substring(item.fileUrl.lastIndexOf('.'))
          "
          >{{ item.name }}</a
        >
      </li>
    </ul>
    <p class="no_data_tip" v-show="data.length < 1">
      {{ $t('download.noData') }}！
    </p>
    <p
      class="chat-icon-loading"
      v-if="isLoading && !isOver"
      v-loading="isLoading"
    ></p>
    <p class="over_data_tip" v-show="data.length > 1 && isOver">
      {{ $t('imgText.loadOver') }}...
    </p>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { VITE_baseUrl } from '../../../../constants.js'
export default {
  name: 'download',
  data() {
    return {
      baseUrl: VITE_baseUrl,
    }
  },
  props: {
    data: {
      type: Array,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    isOver: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
      user: 'user/user',
      isVisitorLogin: 'user/isVisitorLogin',
    }),
  },
  methods: {
    ...mapMutations(['openLogin', 'openCard']),
    showLogin() {
      if (this.isVisitorLogin) {
        this.openLogin(false)
        return
      }
      if (this.user.isCompletedInfo === 0) {
        this.openCard(false)
      }
    },
  },
  created() {},
  mounted() {},
}
</script>

<style lang="scss" scoped>
.download {
  padding: 0;

  .download_ul {
    padding-bottom: 20px;
  }

  li {
    margin-bottom: 12px;

    a {
      position: relative;
      display: block;
      height: 50px;
      padding: 0 58px 0 20px;
      line-height: 50px;
      background: #efefef;

      &::after {
        position: absolute;
        content: '';
        top: 17px;
        right: 20px;
        width: 18px;
        height: 16px;
        background: url(../../../assets/down.png) no-repeat;
      }

      &:hover {
        color: #2691e9;

        &::after {
          background: url(../../../assets/down_hover.png) no-repeat;
        }
      }
    }
  }
}
.no_data_tip {
  text-align: center;
  color: #808080;
  padding: 100px 0;
}
.over_data_tip {
  text-align: center;
  color: #808080;
}
</style>
