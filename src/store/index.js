import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'

Vue.use(Vuex)

const modulesFiles = require.context('./modules', true, /\.js$/)
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  const modulesName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1'),
        value = modulesFiles(modulePath);
  modules[modulesName] = value.default
  return modules
},{})

const store = new Vuex.Store({
  modules,
  getters
})

/*const store = new Vuex.Store({
  state: {
    baseInfo:''
  },
  mutations: {

  },
  actions: {

  },
  getters:{
    token: state => state.baseInfo
  }
})*/
export default store