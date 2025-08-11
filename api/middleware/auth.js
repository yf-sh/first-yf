const { verifyAccessToken } = require('../utils/jwt');

// 验证Access Token的中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            code: 401, 
            msg: '访问令牌缺失' 
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            code: 403, 
            msg: '访问令牌无效或已过期' 
        });
    }
};

// 可选的token验证中间件（不强制要求token）
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = verifyAccessToken(token);
            req.user = decoded;
        } catch (error) {
            // Token无效但不阻止请求继续
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
}; 