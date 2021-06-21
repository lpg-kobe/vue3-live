/**
* @desc handler to save user login status
* @author pika
*/

export function saveUserSession (payload) {
  try {
    localStorage.setItem('userInfo', JSON.stringify(payload))
  } catch (error) {
    console.warn('can not paerse user object witch you eant to save...')
    localStorage.setItem('userInfo', JSON.stringify({}))
  }
}

export function removeUserSession () {
  localStorage.removeItem('userInfo')
}

export function getUserSession () {
  return JSON.parse(localStorage.getItem('userInfo'))
}