import { createStore } from 'vuex'
import modules from './modules'
import system from './system'

const store = createStore({ ...system, modules })
export default store