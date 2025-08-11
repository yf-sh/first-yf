import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const router = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 首先检查是否有token
                if (!tokenManager.isAuthenticated()) {
                    router('/login');
                    return;
                }

                // 验证token是否有效
                const isValid = await tokenManager.verifyToken();
                if (!isValid) {
                    // 尝试刷新token
                    const newToken = await tokenManager.refreshAccessToken();
                    if (!newToken) {
                        router('/login');
                        return;
                    }
                }
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                router('/login');
            }
        };

        checkAuth();
    }, [router]);

    if (isAuthenticated === null) {
        // 显示加载状态
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                验证中...
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // 会重定向到登录页
    }

    return <>{children}</>;
};

export default ProtectedRoute; 