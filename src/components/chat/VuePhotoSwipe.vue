<style>
.my-gallery:after { display: block; height: 0; content: ' '; clear: both; }
.my-gallery figure {
  position: relative;
  cursor: pointer;
  list-style-type: none;
}
.my-gallery img {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
}
</style>

<template>
  <div>
    <div class="my-gallery" itemscope>
      <figure
      v-for="(item, index) in photos" 
      :key="index" 
      @click="onThumbnailsClick">
        <a itemprop="contentUrl" :href="item.src" :data-size="item.w + 'x' + item.h">
          <img :src="item.src" :style="imgStyle(item.w, item.h)" itemprop="thumbnail" alt="" />
        </a>
      </figure>
    </div>

    <!-- Root element of PhotoSwipe. Must have class pswp. -->
    <div class="pswp" tabindex="-1" role="dialog" aria-hidden="true">

      <!-- Background of PhotoSwipe. 
          It's a separate element as animating opacity is faster than rgba(). -->
      <div class="pswp__bg"></div>

      <!-- Slides wrapper with overflow:hidden. -->
      <div class="pswp__scroll-wrap">

        <!-- Container that holds slides. 
          PhotoSwipe keeps only 3 of them in the DOM to save memory.
          Don't modify these 3 pswp__item elements, data is added later on. -->
        <div class="pswp__container">
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
        </div>

        <!-- Default (PhotoSwipeUI_Default) interface on top of sliding area. Can be changed. -->
        <div class="pswp__ui pswp__ui--hidden">

          <div class="pswp__top-bar">

            <!--  Controls are self-explanatory. Order can be changed. -->
            <div class="pswp__counter"></div>

            <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>

            <button class="pswp__button pswp__button--share" title="Share"></button>

            <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>

            <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>

            <!-- Preloader demo https://codepen.io/dimsemenov/pen/yyBWoR -->
            <!-- element will get class pswp__preloader--active when preloader is running -->
            <div class="pswp__preloader">
              <div class="pswp__preloader__icn">
                <div class="pswp__preloader__cut">
                  <div class="pswp__preloader__donut"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
            <div class="pswp__share-tooltip"></div> 
          </div>

          <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>

          <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>

          <div class="pswp__caption">
            <div class="pswp__caption__center"></div>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<script>
import PhotoSwipe from 'photoswipe/dist/photoswipe'
import PhotoSwipeDefault from 'photoswipe/dist/photoswipe-ui-default'
import 'photoswipe/dist/photoswipe.css'
import 'photoswipe/dist/default-skin/default-skin.css'

const closest = function closest (el, fn) {
  return el && (fn(el) ? el : closest(el.parentNode, fn))
}

export default {
  name: 'VuePhotoSwipe',
  props: {
    photos: {
      type: Array,
      default () {
        return []
      }
    },
    options: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  methods: {
    parseThumbnailElements (el) {
      const thumbElements = el.childNodes
      const numNodes = thumbElements.length
      const items = []
      let figureEl
      let linkEl
      let size
      let item

      for (let i = 0; i < numNodes; i++) {
        figureEl = thumbElements[i] // <figure> element
        // include only element nodes
        if (figureEl.nodeType !== 1) {
          continue
        }
        linkEl = figureEl.children[0] // <a> element
        size = linkEl.getAttribute('data-size').split('x')
        // create slide object
        item = {
          src: linkEl.getAttribute('href'),
          w: parseInt(size[0], 10),
          h: parseInt(size[1], 10)
        }
        if (figureEl.children.length > 1) {
          // <figcaption> content
          item.title = figureEl.children[1].innerHTML
        }
        if (linkEl.children.length > 0) {
          // <img> thumbnail element, retrieving thumbnail url
          item.msrc = linkEl.children[0].getAttribute('src')
        }
        item.el = figureEl // save link to element for getThumbBoundsFn
        items.push(item)
      }
      return items
    },
    onThumbnailsClick (e) {
      e = e || window.event
      e.preventDefault ? e.preventDefault() : e.returnValue = false
      const eTarget = e.target || e.srcElement
      // find root element of slide
      const clickedListItem = closest(eTarget, function (el) {
        return (el.tagName && el.tagName.toUpperCase() === 'FIGURE')
      })
      if (!clickedListItem) {
        return
      }
      // find index of clicked item by looping through all child nodes
      // alternatively, you may define index via data- attribute
      const clickedGallery = clickedListItem.parentNode
      const childNodes = clickedListItem.parentNode.childNodes
      const numChildNodes = childNodes.length
      let nodeIndex = 0
      let index
      for (var i = 0; i < numChildNodes; i++) {
        if (childNodes[i].nodeType !== 1) {
          continue
        }
        if (childNodes[i] === clickedListItem) {
          index = nodeIndex
          break
        }
        nodeIndex++
      }
      if (index >= 0) {
        // open PhotoSwipe if valid index found
        this.openPhotoSwipe(index, clickedGallery)
      }
      return false
    },
    photoswipeParseHash () {
      const hash = window.location.hash.substring(1)
      const params = {}
      if (hash.length < 5) {
        return params
      }
      const vars = hash.split('&')
      for (let i = 0; i < vars.length; i++) {
        if (!vars[i]) {
          continue
        }
        const pair = vars[i].split('=')
        if (pair.length < 2) {
          continue
        }
        params[pair[0]] = pair[1]
      }
      if (params.gid) {
        params.gid = parseInt(params.gid, 10)
      }
      return params
    },
    openPhotoSwipe (index, galleryElement, disableAnimation, fromURL) {
      const pswpElement = document.querySelectorAll('.pswp')[0]
      let gallery
      let options
      let items
      items = this.parseThumbnailElements(galleryElement)
      // define options (if needed)
      options = {
        // define gallery index (for URL)
        galleryUID: galleryElement.getAttribute('data-pswp-uid'),
        getThumbBoundsFn: function (index) {
          // See Options -> getThumbBoundsFn section of documentation for more info
          const thumbnail = items[index].el.getElementsByTagName('img')[0] // find thumbnail
          const pageYScroll = window.pageYOffset || document.documentElement.scrollTop
          const rect = thumbnail.getBoundingClientRect()
          return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
        },
        ...this.options
      }
      // PhotoSwipe opened from URL
      if (fromURL) {
        if (options.galleryPIDs) {
          // parse real index when custom PIDs are used
          // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
          for (let j = 0; j < items.length; j++) {
            if (items[j].pid === index) {
              options.index = j
              break
            }
          }
        } else {
          // in URL indexes start from 1
          options.index = parseInt(index, 10) - 1
        }
      } else {
        options.index = parseInt(index, 10)
      }
      // exit if index not found
      if (isNaN(options.index)) {
        return
      }
      if (disableAnimation) {
        options.showAnimationDuration = 0
      }
      // Pass data to PhotoSwipe and initialize it
      gallery = new PhotoSwipe(pswpElement, PhotoSwipeDefault, items, options)
      gallery.init()
    },
    init (gallerySelector) {
      // loop through all gallery elements and bind events
      const galleryElements = document.querySelectorAll(gallerySelector)
      for (let i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1)
        // galleryElements[i].onclick = this.onThumbnailsClick
      }
      // Parse URL and open gallery if it contains #&pid=3&gid=1
      const hashData = this.photoswipeParseHash()
      if (hashData.pid && hashData.gid) {
        this.openPhotoSwipe(hashData.pid, galleryElements[ hashData.gid - 1 ], true, true)
      }
    },
    imgStyle (w, h) {
      return {
        width: w > h ? 'auto' : '100%',
        height: h > w ? 'auto' : '100%',
        transform: 'translate(-50%, -50%)'
      }
    }
  },
  mounted () {
    this.init('.my-gallery')
  }
}
</script>
