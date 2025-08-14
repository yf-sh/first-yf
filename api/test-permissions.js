const axios = require('axios');

const API_BASE_URL = 'http://localhost:9527/api';

async function testPermissions() {
  try {
    console.log('🔍 测试权限显示...');
    
    // 测试获取角色列表（包含权限）
    console.log('\n1. 测试角色列表API...');
    const rolesResponse = await axios.get(`${API_BASE_URL}/roles/list`);
    console.log('角色列表响应:', rolesResponse.data.code, rolesResponse.data.msg);
    
    if (rolesResponse.data.code === 200 && rolesResponse.data.data) {
      const roles = rolesResponse.data.data;
      console.log(`找到 ${roles.length} 个角色:`);
      
      roles.forEach((role, index) => {
        console.log(`  ${index + 1}. ${role.name}`);
        console.log(`     权限数量: ${role.permissions ? role.permissions.length : 0}`);
        if (role.permissions && role.permissions.length > 0) {
          console.log(`     权限: ${role.permissions.map(p => p.name).join(', ')}`);
        }
      });
    }
    
    // 测试获取管理员列表（包含角色和权限）
    console.log('\n2. 测试管理员列表API...');
    const managersResponse = await axios.get(`${API_BASE_URL}/managers/list`);
    console.log('管理员列表响应:', managersResponse.data.code, managersResponse.data.msg);
    
    if (managersResponse.data.code === 200 && managersResponse.data.data) {
      const managers = managersResponse.data.data;
      console.log(`找到 ${managers.length} 个管理员:`);
      
      managers.forEach((manager, index) => {
        console.log(`  ${index + 1}. ${manager.username}`);
        console.log(`     角色: ${manager.role ? manager.role.name : '未分配'}`);
        console.log(`     直接权限数量: ${manager.permissions ? manager.permissions.length : 0}`);
        
        // 计算角色权限数量
        if (manager.role && manager.role.permissions) {
          console.log(`     角色权限数量: ${manager.role.permissions.length}`);
        } else {
          console.log(`     角色权限数量: 0`);
        }
      });
    }
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testPermissions(); 