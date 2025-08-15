// 数据验证工具
class ValidationUtil {
  // 验证邮箱格式
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证密码强度
  static isValidPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // 验证用户名格式
  static isValidUsername(username) {
    // 3-20位，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  // 验证手机号格式
  static isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证必填字段
  static validateRequired(data, requiredFields) {
    const errors = [];
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`${field} 是必填字段`);
      }
    });
    return errors;
  }

  // 验证字符串长度
  static validateLength(value, min, max, fieldName) {
    if (value && (value.length < min || value.length > max)) {
      return `${fieldName} 长度必须在 ${min}-${max} 个字符之间`;
    }
    return null;
  }

  // 验证数字范围
  static validateNumberRange(value, min, max, fieldName) {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return `${fieldName} 必须在 ${min}-${max} 之间`;
    }
    return null;
  }

  // 验证文件类型
  static validateFileType(filename, allowedTypes) {
    const extension = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  }

  // 验证文件大小
  static validateFileSize(fileSize, maxSize) {
    return fileSize <= maxSize;
  }
}

module.exports = ValidationUtil; 