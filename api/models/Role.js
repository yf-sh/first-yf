const mongoose = require('mongoose');

// 角色
const roleSchema = new mongoose.Schema({
    // 角色名称
    name: {
        type: String,
        required: true,
        unique: true
    },
    // 权限
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    
});

module.exports = mongoose.model('Role', roleSchema);