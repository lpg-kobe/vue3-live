<template>
  <div class="live-speaker-container">
    <div id="speakerId"></div>
  </div>
</template>

<script>

/** 互动直播主讲人控件 */
import { mapState } from 'vuex'

export default {
  name: 'mainSpeaker',
  created() {},
  computed: {
    speakerId: ({ live: { liveSpeaker }}) => liveSpeaker?.userId,
    ...mapState({
      live: ({ live }) => live,
      trtcClient: ({ trtcClient }) => trtcClient
    })
  },
  watch: {
    'live.liveSpeaker.userId': {
      handler: async function (nVal, oVal) {
        const oldSpeaker = this.live.liveStreamList.find(({ userId_ }) => String(userId_) ===
        String(oVal))
        const newSpeaker = this.live.liveStreamList.find(({ userId_ }) => String(userId_) ===
        String(nVal))
        // old stream must stop & replay in new dom if it has been play in other dom
        await oldSpeaker?.stop()
        await newSpeaker?.stop()
        this.$nextTick(() => {
          oldSpeaker?.play(`live_stream_${oldSpeaker.userId_}`)
        })
        newSpeaker?.play('speakerId')
      },
      immediate: true
    }
  },
  methods: {
  },
}

</script>