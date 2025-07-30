const mongoose = require('mongoose');
// 权限
const permissionSchema = new mongoose.Schema({
    // 权限名称
    name: {
        type: String,
        required: true,
        unique: true
    },
    // 权限描述
}); 

module.exports = mongoose.model('Permission', permissionSchema);