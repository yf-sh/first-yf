// 测试模型注册
const mongoose = require('mongoose');
require('dotenv').config();

async function testModels() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');

    // 测试User模型
    const { Usermodel: User } = require('./models/User');
    console.log('User模型加载成功:', User.modelName);

    // 测试Message模型
    const Message = require('./models/Message');
    console.log('Message模型加载成功:', Message.modelName);

    // 测试模型关联
    const testMessage = new Message({
      sender: new mongoose.Types.ObjectId(),
      receiver: new mongoose.Types.ObjectId(),
      content: '测试消息',
      type: 'text'
    });

    console.log('Message模型创建成功');

    // 测试populate操作
    try {
      await testMessage.populate('sender', 'username', User);
      console.log('populate操作成功');
    } catch (error) {
      console.error('populate操作失败:', error.message);
    }

    console.log('所有模型测试通过');
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

testModels();
