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
      handler: async function () {
        const speakerStream = this.live.liveStreamList.find(({ userId_ }) => String(userId_) ===
        String(this.live.liveSpeaker.userId))
        if (!speakerStream){return}
        await speakerStream.stop()
        speakerStream.play('speakerId')
      },
      immediate: true
    }
  },
  methods: {
  },
}

</script>