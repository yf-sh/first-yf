// 数据库连接配置
// 这里可以添加数据库连接代码

const User = require('./User');
const Follow = require('./Follow');
const Clip = require('./Clip');
const Message = require('./Message');
const Manager = require('./Manager');
const Permission = require('./Permission');
const Role = require('./Role');

module.exports = {
  User,
  Follow,
  Clip,
  Message,
  Manager,
  Permission,
  Role,
  // 数据库连接方法
  connect: function() {
    console.log('数据库连接已配置');
  }
};
