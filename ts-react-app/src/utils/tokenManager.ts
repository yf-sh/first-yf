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
        this.startTokenRefreshTimer();
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

                if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
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
                            // 显示用户友好的提示
                            this.showSessionExpiredMessage();
                            // 延迟跳转到登录页
                            setTimeout(() => {
                                if (typeof window !== 'undefined') {
                                    window.location.href = '/login';
                                }
                            }, 2000);
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError);
                        this.clearTokens();
                        // 显示用户友好的提示
                        this.showSessionExpiredMessage();
                        // 延迟跳转到登录页
                        setTimeout(() => {
                            if (typeof window !== 'undefined') {
                                window.location.href = '/login';
                            }
                        }, 2000);
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
    public async verifyToken(): Promise<{code:number,data:any}> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                return {
                    code:401,
                    data:null
                };
            }
            const response = await axios.get('http://localhost:9527/api/users/verify-token');
            return {
                code:response.data.code,
                data:response.data.data
            };
        } catch (error) {
            return {
                code:500,
                data:null
            };
        }
    }

    // 显示会话过期消息
    private showSessionExpiredMessage(): void {
        if (typeof window !== 'undefined') {
            // 创建一个用户友好的提示
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fff;
                border: 2px solid #ff6b6b;
                border-radius: 12px;
                padding: 20px 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #333;
                max-width: 300px;
            `;
            notification.innerHTML = `
                <div style="margin-bottom: 10px; font-size: 24px;">⏰</div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">登录已过期</div>
                <div style="font-size: 14px; color: #666;">为了您的账户安全，请重新登录</div>
            `;
            
            document.body.appendChild(notification);
            
            // 2秒后移除提示
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 2000);
        }
    }

    // 启动定期刷新token的定时器
    private startTokenRefreshTimer(): void {
        // 每3分钟检查一次token是否需要刷新
        setInterval(async () => {
            if (this.isAuthenticated() && !this.isRefreshing) {
                try {
                    const accessToken = this.getAccessToken();
                    if (accessToken && this.isTokenExpiringSoon(accessToken)) {
                        // token即将过期，尝试刷新
                        console.log('Token即将过期，正在静默刷新...');
                        const newToken = await this.refreshAccessToken();
                        if (newToken) {
                            console.log('Token静默刷新成功');
                        }
                    }
                } catch (error) {
                    console.log('定期token检查失败:', error);
                }
            }
        }, 3 * 60 * 1000); // 3分钟
    }

    // 检查token是否即将过期（JWT解码）
    private isTokenExpiringSoon(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const expirationTime = payload.exp;
            
            // 如果token在5分钟内过期，返回true
            return (expirationTime - currentTime) < 300;
        } catch (error) {
            return true; // 解析失败，认为需要刷新
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