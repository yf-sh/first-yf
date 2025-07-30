import axios,  {type InternalAxiosRequestConfig, type AxiosRequestConfig, type AxiosResponse } from 'axios'

import { type ApiResponse, type ApiError } from './types'

const BASE_URL = '/api';
let token = localStorage.getItem('token')
// 创建 axios 实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 超时时间 10 秒
  withCredentials: true // 跨域请求时携带 cookie
});

// 请求拦截器：自动携带本地 token（如有）
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 每次都从 localStorage 获取最新 token
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误和数据结构
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 可根据后端返回结构统一处理
    return response.data;
  },
  (error) => {
    // 统一错误提示
    if (error.response) {
      // 后端有返回错误信息
      alert(error.response.data.message || '请求失败');
    } else {
      alert('网络错误或服务器无响应');
    }
    return Promise.reject(error);
  }
);





// 封装请求方法
export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return instance.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return instance.post(url, data, config)
  },
}

// 导出工具函数
export { }

export default instance 