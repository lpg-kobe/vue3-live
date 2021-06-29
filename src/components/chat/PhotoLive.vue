<style>
.photo-live .bd {
  padding: 20px 10px 10px 20px;
}

.photo-swipe figure {
  overflow: hidden;
  float: left;
  width: 100px;
  height: 100px;
  margin: 0 10px 10px 0;
}
</style>

<template>
  <div class="photo-live">
    <!-- <columnHeader title="图片直播">
      <a target="_blank" :href="more">更多</a>
    </columnHeader> -->
    <div class="bd">
      <VuePhotoSwipe class="photo-swipe" :photos="photos" :options="options"></VuePhotoSwipe>
      <div class="photo-no-data" v-if="!photos.length">
        {{ $t('photoLive.noData') }}~
      </div>
    </div>
  </div>
</template>

<script>
import VuePhotoSwipe from './VuePhotoSwipe'
import { getPhpImageList } from '../../services/room/index.js'

export default {
  name: 'PhotoLive',
  components: {
    VuePhotoSwipe
  },
  data () {
    return {
      photos: [],
      options: {
        history: false,
        shareEl: false,
        zoomEl: false
      }
    }
  },
  props: ['id'],
  computed: {
    more () {
      return 'http://photo.ofweek.com/wap/activity/index?id=' + this.id
    }
  },
  methods: {
    setPhotoSize (src, index) {
      const img = new Image()
      const self = this
      img.onload = function () {
        self.photos[index].w = this.width
        self.photos[index].h = this.height
      }
      img.src = src
    },
    createPhotoList (photos) {
      const imgs = []
      photos.forEach((element, index) => {
        imgs[index] = {
          id: element.id,
          src: element.path,
          thumbnail: element.path,
          w: 1,
          h: 1
        }
        this.setPhotoSize(element.path, index)
      })
      return imgs
    },
    getData () {
      getPhpImageList({
        activityid: this.id,
        page: 1,
        pagesize: 9
      })
      .then(response => {
        let res = JSON.parse(response.data)
        this.photos = this.createPhotoList(res.data)
      })
      .catch(error => {

      })
    }
  },
  mounted () {
    this.getData()
  }
}
</script>
<style lang="scss">
.photo-no-data {
  text-align: center;
  padding: 100px 0;
  color: #808080;
}
</style>
