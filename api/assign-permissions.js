const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const Manager = require('./models/Manager');
const Role = require('./models/Role');
const Permission = require('./models/Permission');

async function assignPermissions() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');

    // 获取所有权限
    const permissions = await Permission.find({});
    console.log(`📊 找到 ${permissions.length} 个权限`);

    // 为超级管理员角色分配所有权限
    console.log('\n🔧 为超级管理员分配权限...');
    const superAdminRole = await Role.findOne({ name: '超级管理员' });
    if (superAdminRole) {
      const allPermissionIds = permissions.map(p => p._id);
      await Role.findByIdAndUpdate(superAdminRole._id, { permissions: allPermissionIds });
      console.log(`✅ 超级管理员角色已分配 ${allPermissionIds.length} 个权限`);
    } else {
      console.log('❌ 未找到超级管理员角色');
    }

    // 为视频审核员角色分配视频相关权限
    console.log('\n🔧 为视频审核员分配权限...');
    const videoReviewerRole = await Role.findOne({ name: '视频审核员' });
    if (videoReviewerRole) {
      const videoPermissions = permissions.filter(p => 
        p.code.includes('video') || 
        p.code.includes('content') ||
        p.name.includes('视频') ||
        p.name.includes('内容')
      );
      const videoPermissionIds = videoPermissions.map(p => p._id);
      await Role.findByIdAndUpdate(videoReviewerRole._id, { permissions: videoPermissionIds });
      console.log(`✅ 视频审核员角色已分配 ${videoPermissionIds.length} 个权限`);
      console.log('   权限列表:', videoPermissions.map(p => p.name).join(', '));
    } else {
      console.log('❌ 未找到视频审核员角色');
    }

    // 为运营维护员角色分配运营相关权限
    console.log('\n🔧 为运营维护员分配权限...');
    const operationsRole = await Role.findOne({ name: '运营维护员' });
    if (operationsRole) {
      const operationsPermissions = permissions.filter(p => 
        p.code.includes('user') || 
        p.code.includes('admin') ||
        p.code.includes('role') ||
        p.code.includes('permission') ||
        p.name.includes('用户') ||
        p.name.includes('管理员') ||
        p.name.includes('角色') ||
        p.name.includes('权限')
      );
      const operationsPermissionIds = operationsPermissions.map(p => p._id);
      await Role.findByIdAndUpdate(operationsRole._id, { permissions: operationsPermissionIds });
      console.log(`✅ 运营维护员角色已分配 ${operationsPermissionIds.length} 个权限`);
      console.log('   权限列表:', operationsPermissions.map(p => p.name).join(', '));
    } else {
      console.log('❌ 未找到运营维护员角色');
    }

    // 验证更新结果
    console.log('\n🔍 验证更新结果...');
    const updatedRoles = await Role.find({}).populate('permissions');
    
    updatedRoles.forEach(role => {
      console.log(`\n角色: ${role.name}`);
      console.log(`权限数量: ${role.permissions ? role.permissions.length : 0}`);
      if (role.permissions && role.permissions.length > 0) {
        console.log('权限列表:', role.permissions.map(p => p.name).join(', '));
      }
    });

    console.log('\n🎉 权限分配完成！');
    console.log('现在管理员可以通过角色继承权限了。');

  } catch (error) {
    console.error('❌ 权限分配失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

assignPermissions(); 