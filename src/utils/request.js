import axios from 'axios'
import { MessageBox, Message } from "element-ui"
import store from '@/store'
import router from '@/router'
import { getToken } from "@/utils/auth";
const Qs = require('qs');

const CancelToken = axios.CancelToken,
      ajaxMap = new Map(),
      cancelMap = new Map(); //所有cancel对象函数

const service = axios.create({
  baseURL: '/',
  timeout: 10000,
  withCredentials: true,
})
/*service.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
service.defaults.transformRequest = [function (data) {
  let ret = '';
  for (let it in data) {
    if( it ) {
      ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
    }
  }
  return ret;
}]*/

// create unique urlId
var uniqueKeyString = function (url, method, data) {
  method = method.toUpperCase()
  return Qs.stringify(
    Object.assign({}, {url, method}, data)
  );
}
// counter
let counter = 0

const install = function(Vue, option = {}){
  // 防止多次调用
  if(install.installed) return
  install.installed = true

  // 请求拦截器
  service.interceptors.request.use(
    config => {
      counter++
      if (store.getters.token) {
        config.headers['Authorization'] = getToken()
      }
      if (!config.data._ajaxOpt.noAbort) {
        delete config.data._ajaxOpt
        let _uniqueKeyString = uniqueKeyString(config.url, config.method, config.data)
        // 如果它是不被abort的，才加进map
        // 防止重复提交
        if(ajaxMap.has(_uniqueKeyString)) {
          config.cancelToken = new CancelToken(cancel => {
            counter--
            cancel('request repeat, request cancel')
          })
        }
        ajaxMap.set(
          _uniqueKeyString,
          cancelMap.get(_uniqueKeyString)
        )
      }

      if(config.params) {
        let data = config.params
        delete data._ajaxOpt
      }

      if(config.method === 'post' || config.method === 'put'){
        config.transformRequest = [
          function (data) {
            // 在向服务器发送前，修改请求数据
            data = Qs.stringify(data, { arrayFormat: 'brackets' });
            return data
          }
        ]
      }
      return config
    },error => {
      console.log(error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  service.interceptors.response.use(
    response => {
      counter--
      const res = response.data
      // 响应回来后，删掉ajaxMap里面的
      let config = response.config
      ajaxMap.delete(uniqueKeyString(config.url, config.method, config.data));
      if (response.status !== 200) {
        Message({
          message: res.message || 'Error',
          type: 'error'
        })
        if (response.status === 50008 || response.status === 50012 || response.status === 50014) {
          // to re-login
          MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
            confirmButtonText: 'Re-Login',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }).then(() => {
            store.dispatch('user/resetToken').then(() => {
              Vue.abort();
              location.reload()
            })
          })
        }
        console.error(res)
        return false
      }else {
        return res
      }
    }, error => {
      if(--counter <= 0) {
        counter = 0
        for (let params of ajaxMap.entries()){
          ajaxMap.delete(params[0])
        }
      }
      // 响应回来后，删掉ajaxMap里面的
      if (error && error.response) {
        switch (error.response.status) {
          case 401:
            // store.dispatch('logout');
            console.log("401");
            break;
          case 404:
            router.replace('/Error/Error404')
            // location.reload();
            break;
          case 500:
            Message.error('服务器忙，请重试')
            break;
          default:
            Message.error('连接错误，请稍后再试')
        }
      }
      console.log(error)
      return false;
    }
  )

  Vue.http = Vue.prototype.$http = (ajaxParams = {}, ajaxOpt) => {
    ajaxOpt = Object.assign(
      {
        mock: false, // no mock
        noAbort: false // abort
      },
      ajaxOpt
    )
    if (ajaxOpt.mock) {
      ajaxParams.url = `/mock${ajaxParams.url}`
    }
    ajaxParams.data = ajaxParams.data || {}
    ajaxParams.params = ajaxParams.method.toUpperCase() === 'GET' && ajaxParams.data
    let _uniqueKeyString = uniqueKeyString(ajaxParams.url, ajaxParams.method, ajaxParams.data)
    ajaxParams.data._ajaxOpt = ajaxOpt
    return service({
      ...ajaxParams,
      cancelToken: new CancelToken(c=>{
        cancelMap.set(_uniqueKeyString, c)
      })
    });
  }

  Vue.abort = Vue.prototype.$abort = () => {
    for (let params of ajaxMap.entries()){
      let key = params[0], cancel = params[1];
      cancel('router change, request cancel');
      counter=0;
      ajaxMap.delete(key)
    }
  }
  Vue.urlAbort = Vue.prototype.$urlAbort = ( url ) => {
    for (let params of ajaxMap.entries()) {
      let key = params[0], cancel = params[1];
      if(url === Qs.parse(key)['url']) {
        cancel();
        if(--counter <= 0) counter = 0
        ajaxMap.delete(key)
      }
    }
  }
}

export default install
