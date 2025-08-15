var express = require('express');
var router = express.Router();

const Permission = require('../models/Permission');

// 权限列表
router.get('/list',async function(req,res,next){
  let a = await Permission.find({});
  res.json({code:200,msg:'获取权限列表成功',data:a});
})

module.exports = router;