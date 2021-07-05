<template>
  <div class="ofweek-sidebar-container">
    <ul>
      <li><label>摄像头</label></li>
      <li><label>麦克风</label></li>
      <li>
        <i className="icon ppt" />
        <label>演讲稿</label>
      </li>
      <li>
        <i className="icon video" />
        <label>插播视频</label>
      </li>
      <li>
        <i className="icon ques" />
        <label>问卷调查</label>
      </li>
    </ul>
  </div>
</template>
<script>
/** 直播间左侧菜单栏 */
import { debounce } from '../../../utils/tool'
export default {
  name: 'sideBar',
}
</script>
