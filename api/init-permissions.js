const mongoose = require('mongoose');
require('dotenv').config();

// 导入Permission模型
const Permission = require('./models/Permission');

// 权限数据
const permissions = [
  // 用户管理权限
  { name: '用户查看', description: '查看用户列表和详情', code: 'user:view', type: 'menu' },
  { name: '用户创建', description: '创建新用户', code: 'user:create', type: 'button' },
  { name: '用户编辑', description: '编辑用户信息', code: 'user:edit', type: 'button' },
  { name: '用户删除', description: '删除用户', code: 'user:delete', type: 'button' },
  { name: '用户管理', description: '用户管理模块', code: 'user:manage', type: 'menu' },
  
  // 管理员管理权限
  { name: '管理员查看', description: '查看管理员列表和详情', code: 'admin:view', type: 'menu' },
  { name: '管理员创建', description: '创建新管理员', code: 'admin:create', type: 'button' },
  { name: '管理员编辑', description: '编辑管理员信息', code: 'admin:edit', type: 'button' },
  { name: '管理员删除', description: '删除管理员', code: 'admin:delete', type: 'button' },
  { name: '管理员管理', description: '管理员管理模块', code: 'admin:manage', type: 'menu' },
  
  // 角色管理权限
  { name: '角色查看', description: '查看角色列表和详情', code: 'role:view', type: 'menu' },
  { name: '角色创建', description: '创建新角色', code: 'role:create', type: 'button' },
  { name: '角色编辑', description: '编辑角色信息', code: 'role:edit', type: 'button' },
  { name: '角色删除', description: '删除角色', code: 'role:delete', type: 'button' },
  { name: '角色管理', description: '角色管理模块', code: 'role:manage', type: 'menu' },
  
  // 权限管理权限
  { name: '权限查看', description: '查看权限列表和详情', code: 'permission:view', type: 'menu' },
  { name: '权限创建', description: '创建新权限', code: 'permission:create', type: 'button' },
  { name: '权限编辑', description: '编辑权限信息', code: 'permission:edit', type: 'button' },
  { name: '权限删除', description: '删除权限', code: 'permission:delete', type: 'button' },
  { name: '权限管理', description: '权限管理模块', code: 'permission:manage', type: 'menu' },
  
  // 内容管理权限
  { name: '内容查看', description: '查看内容列表和详情', code: 'content:view', type: 'menu' },
  { name: '内容创建', description: '创建新内容', code: 'content:create', type: 'button' },
  { name: '内容编辑', description: '编辑内容信息', code: 'content:edit', type: 'button' },
  { name: '内容删除', description: '删除内容', code: 'content:delete', type: 'button' },
  { name: '内容管理', description: '内容管理模块', code: 'content:manage', type: 'menu' },
  
  // 视频管理权限
  { name: '视频查看', description: '查看视频列表和详情', code: 'video:view', type: 'menu' },
  { name: '视频上传', description: '上传新视频', code: 'video:upload', type: 'button' },
  { name: '视频编辑', description: '编辑视频信息', code: 'video:edit', type: 'button' },
  { name: '视频删除', description: '删除视频', code: 'video:delete', type: 'button' },
  { name: '视频管理', description: '视频管理模块', code: 'video:manage', type: 'menu' },
  
  // 系统管理权限
  { name: '系统设置', description: '修改系统设置', code: 'system:settings', type: 'menu' },
  { name: '系统监控', description: '查看系统监控信息', code: 'system:monitor', type: 'menu' },
  { name: '系统日志', description: '查看系统日志', code: 'system:logs', type: 'menu' },
  { name: '系统备份', description: '系统数据备份', code: 'system:backup', type: 'button' },
  { name: '系统恢复', description: '系统数据恢复', code: 'system:restore', type: 'button' },
  { name: '系统管理', description: '系统管理模块', code: 'system:manage', type: 'menu' },
  
  // 超级管理员权限
  { name: '超级管理员', description: '拥有所有权限', code: 'super:admin', type: 'role' },
  { name: '管理员创建', description: '创建超级管理员', code: 'super:create', type: 'button' },
  { name: '管理员管理', description: '管理超级管理员', code: 'super:manage', type: 'menu' },
  
  // 数据管理权限
  { name: '数据导出', description: '导出系统数据', code: 'data:export', type: 'button' },
  { name: '数据导入', description: '导入系统数据', code: 'data:import', type: 'button' },
  { name: '数据清理', description: '清理系统数据', code: 'data:clean', type: 'button' },
  { name: '数据管理', description: '数据管理模块', code: 'data:manage', type: 'menu' },
  
  // 安全权限
  { name: '安全设置', description: '安全相关设置', code: 'security:settings', type: 'menu' },
  { name: '访问控制', description: '访问控制管理', code: 'security:access', type: 'menu' },
  { name: '安全审计', description: '安全审计日志', code: 'security:audit', type: 'menu' },
  { name: '安全管理', description: '安全管理模块', code: 'security:manage', type: 'menu' }
];

async function initPermissions() {
  try {
    console.log('连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');

    // 清空现有权限（可选）
    console.log('清空现有权限...');
    await Permission.deleteMany({});
    console.log('现有权限已清空');

    // 批量插入权限
    console.log('开始插入权限数据...');
    const results = await Permission.insertMany(permissions);
    console.log(`✅ 成功插入 ${results.length} 个权限`);

    // 显示插入的权限
    console.log('\n插入的权限列表:');
    results.forEach((permission, index) => {
      console.log(`${index + 1}. ${permission.name} (${permission.code}) - ${permission.description}`);
    });

    console.log('\n🎉 权限初始化完成！');
  } catch (error) {
    console.error('❌ 权限初始化失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行初始化
initPermissions(); 