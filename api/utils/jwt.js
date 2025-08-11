const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT密钥配置
const ACCESS_TOKEN_SECRET = 'your-access-token-secret-key-2024';
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret-key-2024';

// Token过期时间配置
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15分钟
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7天

// 生成Access Token
const generateAccessToken = (userId, username) => {
    return jwt.sign(
        { 
            userId, 
            username,
            type: 'access'
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
};

// 生成Refresh Token
const generateRefreshToken = (userId, username) => {
    return jwt.sign(
        { 
            userId, 
            username,
            type: 'refresh'
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
};

// 验证Access Token
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new Error('无效的访问令牌');
    }
};

// 验证Refresh Token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new Error('无效的访问令牌');
    }
};

// 密码加密
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// 密码验证
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashPassword,
    comparePassword,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET
}; 


