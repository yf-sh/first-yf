const mongoose = require('mongoose');

/**
 * 角色模型
 * @typedef {Object} Role
 * @property {string} name - 角色名称
 * @property {string} description - 角色描述
 * @property {Array<mongoose.Schema.Types.ObjectId>} permissions - 权限ID数组，关联Permission模型
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */
const roleSchema = new mongoose.Schema({
    // 角色名称
    name: {
        type: String,
        required: true,
        unique: true
    },
    // 角色描述
    description: {
        type: String,
        required: true
    },
    // 权限
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
}, {
    timestamps: true // 自动添加 createdAt 和 updatedAt 字段
});

module.exports = mongoose.model('Role', roleSchema);