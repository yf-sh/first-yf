var express = require('express');
var router = express.Router();
var Role = require('../models/Role');

// 角色列表
router.get('/list', async function(req, res, next) {
  let a = await Role.find({});
  res.json({code:200,msg:'获取角色列表成功',data:a});
});
// 角色创建
router.post('/create', async function(req, res, next) {
  let a = await Role.create(req.body);
  res.json({code:200,msg:'创建角色成功',data:a});
});
// 角色修改
router.post('/edit',async function(req, res, next) {
  let {_id} = req.body;
  let a = await Role.updateMany({_id},{$set:req.body});
  res.json({code:200,msg:'修改角色成功',data:a});
})
// 角色删除
router.post('/delete',async function(req, res, next) {
  let {_id} = req.body;
  let a = await Role.deleteMany({_id});
  res.json({code:200,msg:'删除角色成功',data:a});
})

module.exports = router;