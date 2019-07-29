import { getToken, setToken, removeToken } from "@/utils/auth";

export default {
  namespaced: true,
  state: {
    token: getToken()
  },
  mutations: {
    SET_TOKEN: (state,token)=>{
      state.token = token
    }
  },
  actions: {

  }
}