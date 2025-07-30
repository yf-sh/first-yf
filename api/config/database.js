const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 连接断开');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 