/**
 * @desc handle width ajax success
 * @param {Object} handler handler after request
 * @param {Object} data callback data of request
 */

import { ElMessage } from 'element-plus'
export function handleSuccess (handler, data) {
  handler.onSuccess && handler.onSuccess(data)
}

// handle width ajax error
export function handleError (handler, data) {
  if (handler?.onError) {
    handler.onError(data)
  } else {
    ElMessage.error(data.message);
  }
}