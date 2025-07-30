import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean;
  showError?: boolean;
  retry?: number;
  retryDelay?: number;
}

// 错误信息接口
export interface ApiError {
  code: number;
  message: string;
  data?: any;
}

// 创建axios实例

const BASE_URL = '/api';
let token = localStorage.getItem('token')
// 创建 axios 实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL||BASE_URL,
  timeout: 10000, // 超时时间 10 秒
  withCredentials: true // 跨域请求时携带 cookie
});
// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    console.log('Request:', config);
    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log('Response:', response);
    
    const { data } = response;
    
    // 根据业务状态码判断请求是否成功
    if (data.code === 200 || data.success) {
      return response;
    } else {
      // 业务错误处理
      const error: ApiError = {
        code: data.code,
        message: data.message,
        data: data.data,
      };
      
      // 特殊状态码处理
      switch (data.code) {
        case 401:
          // 未授权，跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          console.error('权限不足');
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          break;
        default:
          console.error('业务错误:', data.message);
      }
      
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    console.error('Response Error:', error);
    
    let apiError: ApiError = {
      code: 500,
      message: '网络错误',
    };

    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          apiError = {
            code: status,
            message: '请求参数错误',
            data,
          };
          break;
        case 401:
          apiError = {
            code: status,
            message: '未授权，请重新登录',
            data,
          };
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          apiError = {
            code: status,
            message: '权限不足',
            data,
          };
          break;
        case 404:
          apiError = {
            code: status,
            message: '请求的资源不存在',
            data,
          };
          break;
        case 500:
          apiError = {
            code: status,
            message: '服务器内部错误',
            data,
          };
          break;
        default:
          apiError = {
            code: status,
            message: `请求失败: ${status}`,
            data,
          };
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      apiError = {
        code: 0,
        message: '网络连接失败，请检查网络设置',
      };
    } else {
      // 请求配置错误
      apiError = {
        code: -1,
        message: error.message || '请求配置错误',
      };
    }

    return Promise.reject(apiError);
  }
);

// 重试机制
const retryRequest = async <T = any>(
  config: RequestConfig,
  retryCount: number = 0
): Promise<AxiosResponse<ApiResponse<T>>> => {
  try {
    return await instance(config);
  } catch (error) {
    const maxRetries = config.retry || 0;
    const retryDelay = config.retryDelay || 1000;
    
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return retryRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// 封装请求方法
export const request = {
  get: async <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await retryRequest<T>({ ...config, method: 'GET', url });
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await retryRequest<T>({ ...config, method: 'POST', url, data });
    return response.data;
  },


  // 通用请求方法
  request: async <T = any>(config: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await retryRequest<T>(config);
    return response.data;
  },
};

// 导出axios实例
export default instance;

// 使用示例
/*
// GET请求
const getUserInfo = async (userId: string)=>{
  try {
    const response = await request.get<{ name: string; email: string }>(`/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

// POST请求
const createUser = async (userData: { name: string; email: string }) => {
  try {
    const response = await request.post<{ id: string }>('/user', userData);
    return response.data;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
};

// 带重试的请求
const fetchData = async () => {
  try {
    const response = await request.get('/api/data', {
      retry: 3,
      retryDelay: 2000,
    });
    return response.data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
};
*/
