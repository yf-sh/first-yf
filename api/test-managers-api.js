const axios = require('axios');

async function testManagersAPI() {
  try {
    console.log('🔍 测试管理员API...');
    
    // 测试获取管理员列表
    console.log('\n1. 测试获取管理员列表...');
    const response = await axios.get('http://localhost:9527/api/managers/list?page=1&pageSize=5');
    
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 200) {
      console.log('✅ API调用成功');
      console.log(`📊 找到 ${response.data.data.length} 个管理员`);
      console.log(`📊 总数: ${response.data.pagination.total}`);
      
      // 显示管理员信息
      response.data.data.forEach((manager, index) => {
        console.log(`\n管理员 ${index + 1}:`);
        console.log(`  用户名: ${manager.username}`);
        console.log(`  角色: ${manager.role ? manager.role.name : '未分配'}`);
        console.log(`  权限数量: ${manager.permissions ? manager.permissions.length : 0}`);
        console.log(`  创建时间: ${manager.createdAt}`);
      });
    } else {
      console.log('❌ API调用失败:', response.data.msg);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testManagersAPI(); 