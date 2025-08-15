// 生成 32 位十六进制密钥
const crypto = require('crypto');
const secret = crypto.randomBytes(16).toString('hex');
console.log('JWT 密钥:', secret);