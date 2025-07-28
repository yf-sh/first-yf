const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌格式'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.canteen = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期'
      });
    }
    return res.status(401).json({
      code: 401,
      message: '无效的认证令牌'
    });
  }
}; 