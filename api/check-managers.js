const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const Manager = require('./models/Manager');
const Role = require('./models/Role');
const Permission = require('./models/Permission');

async function checkManagers() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');

    // 获取所有管理员
    console.log('\n🔍 检查管理员数据...');
    const managers = await Manager.find({}).populate('role').populate('permissions');
    
    console.log(`📊 总共找到 ${managers.length} 个管理员`);
    
    managers.forEach((manager, index) => {
      console.log(`\n${index + 1}. 管理员: ${manager.username}`);
      console.log(`   角色: ${manager.role ? manager.role.name : '未分配'}`);
      console.log(`   权限数量: ${manager.permissions ? manager.permissions.length : 0}`);
      
      if (manager.permissions && manager.permissions.length > 0) {
        console.log('   权限列表:');
        manager.permissions.forEach(perm => {
          console.log(`     - ${perm.name} (${perm.code})`);
        });
      } else {
        console.log('   权限: 无');
      }
    });

    // 检查角色数据
    console.log('\n🔍 检查角色数据...');
    const roles = await Role.find({}).populate('permissions');
    
    console.log(`📊 总共找到 ${roles.length} 个角色`);
    
    roles.forEach((role, index) => {
      console.log(`\n${index + 1}. 角色: ${role.name}`);
      console.log(`   权限数量: ${role.permissions ? role.permissions.length : 0}`);
      
      if (role.permissions && role.permissions.length > 0) {
        console.log('   权限列表:');
        role.permissions.forEach(perm => {
          console.log(`     - ${perm.name} (${perm.code})`);
        });
      } else {
        console.log('   权限: 无');
      }
    });

    // 检查权限数据
    console.log('\n🔍 检查权限数据...');
    const permissions = await Permission.find({});
    console.log(`📊 总共找到 ${permissions.length} 个权限`);

    console.log('\n🎯 问题分析:');
    console.log('1. 如果管理员权限数量为0，说明管理员没有直接关联权限');
    console.log('2. 如果角色权限数量为0，说明角色没有分配权限');
    console.log('3. 管理员应该通过角色来继承权限，或者直接分配权限');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

checkManagers(); 