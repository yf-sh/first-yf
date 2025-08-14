const mongoose = require('mongoose');

/**
 * 权限模型
 * @typedef {Object} Permission
 * @property {string} name - 权限名称
 * @property {string} description - 权限描述
 * @property {string} code - 权限代码
 * @property {string} type - 权限类型，默认为'button'
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */
const permissionSchema = new mongoose.Schema({
    // 权限名称
    name: {
        type: String,
        required: true,
        unique: true
    },
    // 权限描述
    description: {
        type: String,
        required: true
    },
    // 权限代码
    code: {
        type: String,
        required: true,
        unique: true
    },
    // 权限类型
    type: {
        type: String,
        required: true,
        default: 'button'
    }
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt 字段
}); 

module.exports = mongoose.model('Permission', permissionSchema);