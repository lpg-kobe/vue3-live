import router from './router'
import Cookies from 'js-cookie'

const hasToken = Cookies.get('www_ofweekmember')
const whiteList = ['/login']

router.beforeEach(async(to, from, next) => {
  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/room/94' })
    } else {
      next()
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next('/login')
    }
  }
})

