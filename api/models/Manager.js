const mongoose = require('mongoose');

/**
 * 后台管理人员模型
 * @typedef {Object} Manager
 * @property {string} username - 用户名
 * @property {string} password - 密码
 * @property {mongoose.Schema.Types.ObjectId} role - 角色ID，关联Role模型
 * @property {Array<mongoose.Schema.Types.ObjectId>} permissions - 权限ID数组，关联Permission模型
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */
const managerSchema = new mongoose.Schema({
    // 用户名
    username: {
        type: String,
        required: true,
        unique: true
    },
    // 密码
    password: {
        type: String,
        required: true
    },
    // 角色
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    // 权限
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

module.exports = mongoose.model('Manager', managerSchema);