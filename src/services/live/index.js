// 获取进入直播间秘钥
export function getRoomPrivateKey (payload) {
  return request(
    `/web/room/gettrtcprivatesig?${qs.stringify(payload)}`,
    {
      method: 'get'
    }
  );
}

// 获取连麦成员
export function getMembers (payload) {
  return request(
    `/web/member/getroomanthorandguestlist?${qs.stringify(payload)}`,
    {
      method: 'get'
    }
  );
}