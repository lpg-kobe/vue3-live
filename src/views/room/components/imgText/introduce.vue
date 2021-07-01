<template>
  <div class="live-info">
    <div class="clearfix live-company">
      <div class="fl live-company-logo">
        <img :src="liveInfo.companyLogoUrl" v-if="liveInfo.companyLogoUrl" />
      </div>
      <div class="fl live-company-info">
        <h2
          class="title"
          v-if="liveInfo.roomName"
          v-html="liveInfo.roomName"
          :title="liveInfo.roomName"
        ></h2>
        <ul class="time-place">
          <li v-if="liveInfo.time && roomId === '210'">
            <span class="iconfont icon-remind"></span
            >{{ $t('intro.time2') }}：{{ transTime(liveInfo.time) }}
          </li>
          <li v-if="liveInfo.time && roomId !== '210'">
            <span class="iconfont icon-remind"></span>{{ $t('intro.time') }}：{{
              transTime(liveInfo.time)
            }}
          </li>
          <li v-if="liveInfo.companyName">
            <span class="iconfont icon-home"></span>{{ $t('intro.units') }}：{{
              liveInfo.companyName
            }}
          </li>
        </ul>
      </div>
    </div>

    <div class="intro" v-if="liveInfo.description">
      <h3>{{ $t('intro.content') }}</h3>
      <div
        class="content word-break"
        v-html="liveInfo.description.replace(/\n/g, '<br>')"
      ></div>
    </div>

    <div
      class="guests"
      v-for="(item, index) in liveInfo.showMemberList"
      :key="index"
      v-show="item.identity !== '主播'"
    >
      <h3>{{ langToIdentity(item.identity) }}</h3>
      <dl
        class="clear"
        v-for="(item2, index2) in item.memberList"
        :key="index2"
      >
        <dt>
          <img
            class="avatar"
            v-if="item2.memberLogoUrl"
            v-bind:src="item2.memberLogoUrl"
          />
          <img
            class="avatar"
            v-else
            src="../../../../assets/guest_avatar.png"
          />
        </dt>
        <dd>
          <div class="content">
            <p class="name">
              {{ item2.memberName }} - {{ item2.memberCompany }} /
              {{ item2.memberJob }}
            </p>
            <div
              class="word-break"
              v-html="item2.memberSummary.replace(/\n/g, '<br>')"
            ></div>
          </div>
        </dd>
      </dl>
    </div>

    <div
      class="gift"
      v-if="liveInfo.roomPrizeDtoList && liveInfo.roomPrizeDtoList.length > 0"
    >
      <h3>{{ $t('intro.participate') }}</h3>
      <div
        class="clearfix"
        style="margin-top: 20px"
        v-for="(item, index) in liveInfo.roomPrizeDtoList"
        :key="index"
      >
        <img class="gift-photo" v-bind:src="item.prizeImageUrl" />
        <ul class="gift-info">
          <li>
            <span class="fl">{{ $t('intro.prizeName') }}：</span>
            <div class="fl word-break" v-html="item.prizeName"></div>
          </li>
          <li v-if="item.prizeSummary">
            <span class="fl">{{ $t('intro.way') }}：</span>
            <div class="fl word-break" v-html="item.prizeSummary"></div>
          </li>
          <li v-if="item.winners">
            <span class="fl">{{ $t('intro.winnerList') }}：</span>
            <div class="fl word-break" v-html="item.winners"></div>
          </li>
        </ul>
      </div>
    </div>

    <div class="intro" v-if="liveInfo.companySummary">
      <h3>{{ $t('intro.company') }}</h3>
      <div
        class="content word-break"
        v-html="liveInfo.companySummary.replace(/\n/g, '<br>')"
      ></div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getroomsummary } from '../../../../services/room/index.js'
// import * as moment from 'moment'
export default {
  name: 'introduce',
  data() {
    return {
      liveInfo: {},
    }
  },
  computed: {
    ...mapGetters({
      roomId: 'room/roomId',
    }),
  },
  methods: {
    langToIdentity(identity) {
      switch (identity) {
        case '主播':
          return this.$t('chat.anchor')
          break
        case '嘉宾':
          return this.$t('chat.guest')
          break
        case '主持人':
          return this.$t('chat.compere')
          break
        case '主讲人':
          return this.$t('chat.speaker')
          break
        case '展商':
          return this.$t('chat.exhibitor')
          break
        case '客服':
          return this.$t('chat.service')
          break
        case '观众':
          return this.$t('chat.audience')
          break
        default:
          return ''
      }
    },
    transTime(str) {
      let _str = str ? str : ''
      _str = _str.replace(/[年月]/g, '-')
      _str = _str.replace(/[日]/g, '')
      return _str
      // let _start = moment(start)
      // let _end = moment(end)
      // if (_start.format('YYYY-MM-DD') === _end.format('YYYY-MM-DD')) {
      //   return `${_start.format('YYYY-MM-DD HH:mm')} - ${_end.format('HH:mm')}`
      // } else {
      //   return `${_start.format('YYYY-MM-DD HH:mm')} - ${_end.format('YYYY-MM-DD HH:mm')}`
      // }
    },
  },
  created() {
    getroomsummary({ roomid: this.roomId }).then(({ data }) => {
      let res = data
      if (res.code === 0) {
        this.liveInfo = res.data
      }
    })
  },
  mounted() {},
}
</script>

<style lang="scss" scoped>
/* 直播/会议信息 */
.live-company {
  margin-bottom: 20px;
}
.live-company-logo {
  width: 240px;
  height: 100px;
  background: rgba(255, 255, 255, 1);
  border: 1px solid rgba(230, 230, 230, 1);
  border-radius: 4px;
  font-size: 0;
  text-align: center;
  line-height: 100px;

  img {
    max-width: 90%;
    max-height: 90%;
    vertical-align: middle;
  }
}
.live-company-info {
  width: 445px;
  margin-left: 34px;

  .title {
    width: 100%;
    font-size: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .time-place {
    padding: 12px 22px;
    margin-top: 10px;
    background: #f4f5f6;

    li {
      margin-top: 5px;
      color: #878787;

      &:first-child {
        margin-top: 0;
      }
    }
    .iconfont {
      float: left;
      margin: 0 5px 0 0;
    }
  }
}

.word-break {
  word-wrap: break-word;
}

.live-info .intro {
  padding: 20px 0;
  border-top: 1px solid #eee;
}
.live-info .intro h3 {
  font-weight: 600;
  font-size: 16px;
}
.live-info .intro .content {
  color: #666;
  margin-top: 15px;
}
.live-info .intro .content ul {
  padding-left: 2em;
  list-style-type: disc;
}

.live-info .guests {
  padding: 20px 0;
  border-top: 1px solid #eee;
}
.live-info .guests h3 {
  font-weight: 600;
  font-size: 16px;
}
.live-info .guests dt {
  float: left;
  padding: 15px 0;
}
.live-info .guests .avatar {
  width: 160px;
  height: 160px;
  margin: 0 15px 0 0;
  border-radius: 50%;
  vertical-align: middle;
}
.live-info .guests dd {
  height: 100%;
  min-height: 190px;
  padding: 15px 0;
  margin-left: 175px;
  color: #666;
}
.live-info .guests .content .name {
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.live-info .gift {
  padding: 20px 0;
  border-top: 1px solid #eee;
}
.live-info .gift h3 {
  font-weight: 600;
  font-size: 16px;
}
.live-info .gift .gift-photo {
  float: left;
  width: 115px;
  height: 115px;
}
.live-info .gift .gift-info {
  float: left;
  width: calc(100% - 130px);
  margin-left: 15px;
}
.live-info .gift .gift-info li {
  overflow: hidden;
  margin-bottom: 5px;
}
.live-info .gift .gift-info div {
  width: calc(100% - 70px);
}
</style>
