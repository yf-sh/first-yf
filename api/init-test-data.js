const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const Manager = require('./models/Manager');
const Role = require('./models/Role');
const Permission = require('./models/Permission');

async function initTestData() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');

    // 1. 确保权限存在
    console.log('\n🔍 检查权限数据...');
    let permissions = await Permission.find({});
    if (permissions.length === 0) {
      console.log('权限数据为空，请先运行 init-permissions.js');
      return;
    }
    console.log(`✅ 找到 ${permissions.length} 个权限`);

    // 2. 创建角色
    console.log('\n🔍 创建角色...');
    
    // 超级管理员角色
    const superAdminRole = await Role.findOneAndUpdate(
      { name: '超级管理员' },
      {
        name: '超级管理员',
        description: '拥有所有权限的超级管理员角色',
        permissions: permissions.map(p => p._id)
      },
      { upsert: true, new: true }
    );
    console.log('✅ 超级管理员角色已创建/更新');

    // 视频审核员角色
    const videoReviewerRole = await Role.findOneAndUpdate(
      { name: '视频审核员' },
      {
        name: '视频审核员',
        description: '负责视频内容审核的角色',
        permissions: permissions.filter(p => p.code.includes('video') || p.code.includes('content')).map(p => p._id)
      },
      { upsert: true, new: true }
    );
    console.log('✅ 视频审核员角色已创建/更新');

    // 运营维护员角色
    const operatorRole = await Role.findOneAndUpdate(
      { name: '运营维护员' },
      {
        name: '运营维护员',
        description: '负责系统运营和维护的角色',
        permissions: permissions.filter(p => p.code.includes('system') || p.code.includes('data')).map(p => p._id)
      },
      { upsert: true, new: true }
    );
    console.log('✅ 运营维护员角色已创建/更新');

    // 3. 创建管理员
    console.log('\n🔍 创建管理员...');
    
    // 超级管理员
    const superAdmin = await Manager.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        password: 'admin123',
        role: superAdminRole._id,
        permissions: []
      },
      { upsert: true, new: true }
    );
    console.log('✅ 超级管理员已创建/更新');

    // 视频审核员
    const videoReviewer = await Manager.findOneAndUpdate(
      { username: 'reviewer' },
      {
        username: 'reviewer',
        password: 'reviewer123',
        role: videoReviewerRole._id,
        permissions: []
      },
      { upsert: true, new: true }
    );
    console.log('✅ 视频审核员已创建/更新');

    // 运营维护员
    const operator = await Manager.findOneAndUpdate(
      { username: 'operator' },
      {
        username: 'operator',
        password: 'operator123',
        role: operatorRole._id,
        permissions: []
      },
      { upsert: true, new: true }
    );
    console.log('✅ 运营维护员已创建/更新');

    // 4. 显示创建的数据
    console.log('\n📊 创建的数据汇总:');
    
    const allManagers = await Manager.find({}).populate('role').populate('permissions');
    console.log(`\n管理员列表 (${allManagers.length} 个):`);
    allManagers.forEach((manager, index) => {
      console.log(`${index + 1}. ${manager.username} - 角色: ${manager.role ? manager.role.name : '未分配'}`);
    });

    const allRoles = await Role.find({}).populate('permissions');
    console.log(`\n角色列表 (${allRoles.length} 个):`);
    allRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} - 权限数量: ${role.permissions ? role.permissions.length : 0}`);
    });

    console.log('\n🎉 测试数据初始化完成！');
    console.log('\n登录信息:');
    console.log('超级管理员: admin / admin123');
    console.log('视频审核员: reviewer / reviewer123');
    console.log('运营维护员: operator / operator123');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 运行初始化
initTestData(); 