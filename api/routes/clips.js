var express = require('express');
var router = express.Router();
var Clip = require('../models/Clip');

/* GET users listing. */

// 视频上传（用户创建视频信息）（上传视频，判断是否使用大文件上传）
router.post('/upload', function(req, res, next) {
  res.send('respond with a resource');
});
// 视频列表
router.get('/list',async function(req, res, next) {
  let a = await Clip.find({});
  res.json({code:200,msg:'获取视频列表成功',data:a});
});
// 视频信息编辑（用户编辑信息，审核员审核）
router.post('/edit',async function(req, res, next) {
  let {_id} = req.body;
  let a = await Clip.updateMany({_id},{$set:req.body});
  res.json({code:200,msg:'编辑视频成功',data:a});
});
// 视频删除
router.post('/delete',async function(req, res, next) {
  let {_id} = req.body;
  let a = await Clip.deleteMany({_id});
  res.json({code:200,msg:'删除视频成功',data:a});
});

module.exports = router;