import request from '../../utils/request'
import qs from 'qs'

// 进入直播间
export function entryroom(params) {
  return request(
    `/web/room/entryroom?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 离开直播间
export function leaveroom(params) {
  return request(
    `/web/room/leaveroom?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间内容
export function getroom(params) {
  return request(
    `/web/room/getroom?${qs.stringify(params)}`,
    {
      method: 'get'
    })
}

// 获取直播间下载资料
export function getroomdata(params) {
  return request(
    `/web/room/getroomdata?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 下载直播间资料
export function downloadRoomdata(params) {
  return request(
    `/web/download/roomdata?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间活动介绍
export function getroomsummary(params) {
  return request(
    `/web/room/getroomsummary?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间里面的在线用户
export function getroomuserlist(params) {
  return request(
    `/web/member/getroomuserlist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}


// 获取群消息的更多数据
// data {
// msgId: 当前显示最后一条消息的消息id(不填就从后台最后一条开始),
// roomId: 直播间id,
// size: 消息条数(默认20) }
export function groupGetmoremsg(data) {
  return request(
    `/web/group/getmoremsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 保存群消息接口，返回发送状态
export function groupSendmsg(data) {
  return request(
    `/web/group/sendmsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 删除发送过的消息，返回发送消息的状态
export function groupDeletemsg(data) {
  return request(
    `/web/group/deletegroupmsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 禁言或者取消禁言接口
export function forbitchat(data) {
  return request(
    `/web/member/forbitchat`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 踢出直播间用户接口
export function shotoff(data) {
  return request(
    `/web/member/shotoff`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取问答消息的更多数据
export function questionGetmoremsg(data) {
  return request(
    `/web/room/question/getmoremsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 发送问题接口
export function questionSendmsg(data) {
  return request(
    `/web/room/question/sendmsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 删除发送过的消息，返回发送消息的状态
export function questionDeletemsg(data) {
  return request(
    `/web/room/question/deletemsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 更新回答消息
export function questionUpdateanswer(data) {
  return request(
    `/web/room/question/updateanswer`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取图文消息的更多数据
export function imagetextGetmoremsg(data) {
  return request(
    `/web/room/imagetext/getmoremsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 删除发送过的消息，返回发送消息的状态
export function imagetextDeletemsg(data) {
  return request(
    `/web/room/imagetext/deletemsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 发送图文消息接口
export function imagetextSendmsg(data) {
  return request(
    `/web/room/imagetext/sendmsg`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 更新图文直播接口
export function imagetextUpdate(data) {
  return request(
    `/web/room/imagetext/updateimagetext`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取手动短信验证码
export function sendSMSValicode(params) {
  return request(
    `/web/login/sendSMSValicode?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 账号手机号码登录接口,返回登录状态json
export function memberlogin(params) {
  return request(
    `/web/login/memberlogin?${qs.stringify(params)}`,
    { method: 'post' }
  )
}

// 手机号快速登录或者快速注册（手机号不存在就自动注册后再登录）
export function quickRegOrLogin(params) {
  return request(
    `/web/login/quickRegOrLogin?${qs.stringify(params)}`,
    { method: 'post' }
  )
}

// 退出登录
export function logout() {
  return request(
    `/web/logout`,
    { method: 'get' }
  )
}

// 获取账号的要完善信息
export function getcompleteinfo() {
  return request(
    `/web/member/getcompleteinfo`,
    { method: 'get' }
  )
}

// 更新用户完善信息
export function updatecompleteinfo(params) {
  return request(
    `/web/member/updatecompleteinfo`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取国家列表
export function getcountry() {
  return request(
    `/web/sysdict/getcountry`,
    { method: 'get' }
  )
}

// 获取省份列表
export function getprovince() {
  return request(
    `/web/sysdict/getprovince`,
    { method: 'get' }
  )
}

// 判断用户手机号码和邮箱是否存在
export function checkmemberphoneoremail(params) {
  return request(
    `/web/member/checkmemberphoneoremail?${qs.stringify(params)}`,
    { method: 'post' }
  )
}

// 用户心跳
export function heartbeat(data) {
  return request(
    `/web/member/heartbeat`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 上麦者心跳
export function liveheartbeat(data) {
  return request(
    `/web/member/liveheartbeat`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取直播间演讲稿列表
export function speechGetlist(params) {
  return request(
    `/web/room/speech/getlist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间演讲稿详细信息
export function speechGetdetail(params) {
  return request(
    `/web/room/speech/getdetail?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 结束播放演讲稿
export function stopSpeech(params) {
  return request(
    `/web/room/stopspeech?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 翻页演讲稿
export function turnSpeech(data) {
  return request(
    `/web/room/turnspeech`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取直播间问卷
export function getRoomQuestionnaireList(params) {
  return request(
    `/web/room/questionnaire/getroomquestionnairelist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取单个问卷
export function getQuestionnaireOne(params) {
  return request(
    `/web/room/questionnaire/getquestionnaireone?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 发送问卷
export function sendQuestionnaire(params) {
  return request(
    `/web/room/questionnaire/sendquestionnaire?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 问答问卷
export function answerQuestionnaire(data) {
  return request(
    `/web/room/questionnaire/answerQuestionnaire`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取图片直播列表数据
export function getPhpImageList(params) {
  return request(
    `/web/sysdict/getphpimagelist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间视频列表
export function getReviewList(params) {
  return request(
    `/web/room/video/getreviewlist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 观众登记房间
export function registerroom(params) {
  return request(
    `/web/room/registerroom?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 广播直播间主播摄像头开关
export function broatRoomCamera(params) {
  return request(
    `/web/room/broatroomcamera?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 开始直播
export function startroom(params) {
  return request(
    `/web/room/startroom?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 下麦
export function overroom(params) {
  return request(
    `/web/room/overroom?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 邀请直播
export function invitelive(params) {
  return request(
    `/web/room/invitelive?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 嘉宾处理邀请直播
export function guestauditlive(params) {
  return request(
    `/web/room/guestauditlive?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 申请直播
export function auditlive(params) {
  return request(
    `/web/room/auditlive?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 管理员处理申请直播
export function adminauditlive(params) {
  return request(
    `/web/room/adminauditlive?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取进入视频直播间密匙
export function gettrtcprivatesig(params) {
  return request(
    `/web/room/gettrtcprivatesig?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 提交产品信息
export function commitproductmessage(data) {
  return request(
    `/web/room/product/commitproductmessage`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取直播产品信息
export function productGetone(params) {
  return request(
    `/web/room/product/getone?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间产品
export function getroomproductlist(params) {
  return request(
    `/web/room/product/getroomproductlist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间产品
export function getroomproductpage(params) {
  return request(
    `/web/room/product/getroomproductpage?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 获取直播间内容
export function getExhibit(params) {
  return request(
    `/web/exhibit/getexhibit?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 预约直播
export function regitermeeting(params) {
  return request(
    `/web/exhibit/regitermeeting?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 游客预约直播
export function regitervisitor(data) {
  return request(
    `/web/member/regitervisitor`,
    { method: 'post', body: JSON.stringify(data) }
  )
}

// 获取直播间插播视频
export function getroominstallvideo(params) {
  return request(
    `/web/room/getroominstallvideo?${qs.stringify(params)}`,
    { method: 'get' }
  )
}

// 手机号码校验
export function checkMobileValicode(params) {
  return request(
    `/web/login/checkMobileValicode?${qs.stringify(params)}`,
    { method: 'post' }
  )
}

// 获取直播间主播和嘉宾用户信息
export function getroomanthorandguestlist(params) {
  return request(
    `/web/member/getroomanthorandguestlist?${qs.stringify(params)}`,
    { method: 'get' }
  )
}