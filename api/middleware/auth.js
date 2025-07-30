const jwt = require('jsonwebtoken');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || '123456';
// 验证JWT Token的中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log(token);
  if (!token) {
      return res.status(401).json({
          success: false,
          message: '未提供认证令牌'
      });
  }
  
  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
  } catch (error) {
      return res.status(401).json({
          success: false,
          message: '无效的认证令牌'
      });
  }
};

module.exports = authMiddleware;