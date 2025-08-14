const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// 确保环境变量被加载
dotenv.config();

// JWT密钥配置 - 使用正确的环境变量
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET;

// 验证密钥是否存在
if (!ACCESS_TOKEN_SECRET) {
    console.error('错误: JWT_SECRET 环境变量未设置');
    process.exit(1);
}

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
        throw new Error('无效的刷新令牌');
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


