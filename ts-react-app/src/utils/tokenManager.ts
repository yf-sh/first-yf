import axios from 'axios';

// Token管理类
class TokenManager {
    private static instance: TokenManager;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (reason?: any) => void;
    }> = [];

    private constructor() {
        this.setupAxiosInterceptors();
    }

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    // 获取access token
    public getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    // 获取refresh token
    public getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }

    // 设置tokens
    public setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    // 清除tokens
    public clearTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    // 刷新access token
    public async refreshAccessToken(): Promise<string | null> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearTokens();
            return null;
        }
        try {
            const response = await axios.post('http://localhost:9527/api/users/refresh-token', {
                refreshToken
            });

            if (response.data.code === 200) {
                const newAccessToken = response.data.data.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                return newAccessToken;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
        }

        return null;
    }

    // 处理队列中的请求
    private processQueue(error: any, token: string | null = null): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    // 设置axios拦截器
    private setupAxiosInterceptors(): void {
        // 请求拦截器 - 添加token
        axios.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
        // 响应拦截器 - 处理token过期
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // 如果正在刷新，将请求加入队列
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        }).then(token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return axios(originalRequest);
                        }).catch(err => {
                            return Promise.reject(err);
                        });
                    }
                    
                    originalRequest._retry = true;
                    this.isRefreshing = true;
                    try {
                        const newToken = await this.refreshAccessToken();
                        if (newToken) {
                            this.processQueue(null, newToken);
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return axios(originalRequest);
                        } else {
                            this.processQueue(new Error('Token refresh failed'));
                            // 跳转到登录页
                            if (typeof window !== 'undefined') {
                                window.location.href = '/login';
                            }
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError);
                        this.clearTokens();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // 检查是否已登录
    public isAuthenticated(): boolean {
        const accessToken = this.getAccessToken();
        const refreshToken = this.getRefreshToken();
        return !!(accessToken && refreshToken);
    }

    // 验证token是否有效
    public async verifyToken(): Promise<boolean> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                return false;
            }
            const response = await axios.get('http://localhost:9527/api/users/verify-token');
            return response.data.code === 200;
        } catch (error) {
            return false;
        }
    }

    // 登出
    public async logout(): Promise<void> {
        try {
            await axios.post('http://localhost:9527/api/users/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }
}

export default TokenManager.getInstance(); 