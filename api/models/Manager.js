const mongoose = require('mongoose');

// 后台管理人员
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
});

module.exports = mongoose.model('Manager', managerSchema);