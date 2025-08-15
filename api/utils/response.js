// 统一响应格式工具
class ResponseUtil {
  // 成功响应
  static success(data = null, message = '操作成功', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  // 错误响应
  static error(message = '操作失败', statusCode = 400, errors = null) {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      statusCode
    };
  }

  // 分页响应
  static pagination(data, page, limit, total) {
    return {
      success: true,
      message: '获取数据成功',
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      statusCode: 200
    };
  }

  // 列表响应
  static list(data, message = '获取列表成功') {
    return {
      success: true,
      message,
      data,
      count: Array.isArray(data) ? data.length : 0,
      timestamp: new Date().toISOString(),
      statusCode: 200
    };
  }
}

module.exports = ResponseUtil; 