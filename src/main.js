import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/index'

import request from '@/utils/request'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets
import '@/styles/index.scss'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';

if (process.env.NODE_ENV === 'production') {}

Vue.use(ElementUI);

Vue.config.productionTip = false

new Vue({
  el:'#app',
  router,
  store,
  render: h => h(App)
})
