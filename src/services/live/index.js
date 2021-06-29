/**
 * @desc api services of live
 */

import request from '../../utils/request';
import qs from 'qs';

// 获取进入直播间秘钥
export function getRoomPrivateKey(payload) {
  return request(
    `/web/room/gettrtcprivatesig?${qs.stringify(payload)}`,
    {
      method: 'get'
    }
  );
}

// 获取连麦成员
export function getMembers(payload) {
  return request(
    `/web/member/getroomanthorandguestlist?${qs.stringify(payload)}`,
    {
      method: 'get'
    }
  );
}

// 房间开始直播
export function startLive(payload) {
  return request(
    `/web/room/startroomany?${qs.stringify(payload)}`,
    {
      method: 'post'
    }
  );
}

// 房间结束直播
export function stopLive(payload) {
  return request(
    `/web/room/overroomany?${qs.stringify(payload)}`,
    {}
  );
}

// 房间邀请上麦
export function inviteLive(payload) {
  return request(
    `/web/room/invitelive?${qs.stringify(payload)}`,
    {}
  );
}

// 房间处理邀请上麦
export function handleInviteLive(payload) {
  return request(
    `/web/room/guestauditlive?${qs.stringify(payload)}`,
    {}
  );
}

// 房间处理申请上麦
export function handleApplyLive(payload) {
  return request(
    `/web/room/adminauditlive?${qs.stringify(payload)}`,
    {}
  );
}

// 房间设置主讲人
export function setSpeaker(payload) {
  return request(
    `/web/room/setmainspeaker?${qs.stringify(payload)}`,
  )
}

// 摄像头 | 麦克风开关
export function toggleMedia(payload) {
  return request(
    `/web/room/setcameraandmike?${qs.stringify(payload)}`,
  )
}

// 嘉宾申请上麦
export function applyLive(payload) {
  return request(
    `/web/room/auditlive?${qs.stringify(payload)}`,
    {}
  );
}

// 嘉宾开始上麦
export function guestStartLive(payload) {
  return request(
    `/web/room/upmike?${qs.stringify(payload)}`,
    {}
  );
}

// 嘉宾下麦
export function guestStopLive(payload) {
  return request(
    `/web/room/downmike?${qs.stringify(payload)}`,
    {}
  );
}