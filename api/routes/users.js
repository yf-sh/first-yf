var express = require('express');
var expressWs = require('express-ws');
var router = express.Router();
expressWs(router);
let {Usermodel}=require('../models/User')
const Follow = require('../models/Follow')
const mongoose = require('mongoose')
// 确保路由器支持 WebSocket
if (typeof router.ws !== 'function') {
    console.warn('WebSocket support not available on router');
}

const nodemailer = require('nodemailer');
const { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken
} = require('../utils/jwt');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建uploads目录（如果不存在）
const uploadsDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于头像上传
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: function (req, file, cb) {
        // 检查文件类型
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只能上传图片文件!'), false);
        }
    }
});

// 动态创建邮箱传输器函数
function createEmailTransporter(email, authCode) {
    return nodemailer.createTransport({
        host: 'smtp.qq.com', // QQ邮箱服务器
        port: 465, // SMTP 端口，SSL：465，TLS：587
        secure: true, // true for 465, false for other ports
        auth: {
            user: email, // 动态QQ邮箱
            pass: authCode // 对应的授权码
        },
    });
}

// 默认邮箱配置 (作为备用)
const defaultEmailConfig = {
    email: '2308018227@qq.com',
    authCode: 'ipgsrabgzcfydieb'
};

// 生成随机验证码
function generateVerificationCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10); // 生成0-9的随机数字
  }
  return code;
}

// 验证码存储 (带过期时间)
const verificationCodes = {};  // { email: { code: 'xxxxxx', expires: timestamp }, ... }

// 清理过期验证码
function cleanExpiredCodes() {
    const now = Date.now();
    for (const email in verificationCodes) {
        if (verificationCodes[email].expires < now) {
            delete verificationCodes[email];
        }
    }
}

// 定期清理过期验证码 (每5分钟清理一次)
setInterval(cleanExpiredCodes, 5 * 60 * 1000);

// 动态邮件发送函数
async function sendVerificationEmail(senderEmail, senderAuthCode, receiverEmail, code) {
    // 创建动态传输器
    const transporter = createEmailTransporter(senderEmail, senderAuthCode);
    
    const mailOptions = {
        from: senderEmail, // 发送方邮箱（用户自己的QQ邮箱）
        to: receiverEmail, // 接收方邮箱（通常与发送方相同）
        subject: 'AI智能助手 - 邮箱验证码',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4A90E2; margin: 0;">AI智能助手</h1>
                    <p style="color: #666; margin: 5px 0;">邮箱验证码</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #333; margin-bottom: 20px;">您的验证码</h2>
                    <div style="font-size: 32px; font-weight: bold; color: #4A90E2; letter-spacing: 8px; margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border: 2px dashed #4A90E2;">
                        ${code}
                    </div>
                    <p style="color: #666; margin-top: 20px;">验证码有效期为10分钟，请及时使用</p>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                    <p>此邮件由系统自动发送，请勿回复</p>
                    <p>如果您没有申请此验证码，请忽略此邮件</p>
                </div>
            </div>
        `,
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`邮件发送成功到 ${receiverEmail}: `, info.messageId);
        return true;
    } catch (error) {
        console.error(`邮件发送失败到 ${receiverEmail}: `, error);
        return false;
    }
}

// 发送验证码的 API 路由（支持动态QQ邮箱）
router.post('/send-verification', async (req, res) => {
    const { email, authCode } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: '邮箱地址不能为空' });
    }
    
    // 验证是否为QQ邮箱
    if (!email.match(/^\d+@qq\.com$/)) {
        return res.status(400).json({ message: '请输入有效的QQ邮箱地址' });
    }
    
    // 检查授权码（可选）
    // 如果没有提供授权码，将使用默认邮箱发送到目标邮箱
    // 如果提供了授权码，将使用用户自己的邮箱发送
    
    // 检查是否频繁发送验证码 (60秒内不能重复发送)
    const existingCode = verificationCodes[email];
    if (existingCode && (existingCode.expires - Date.now()) > 9 * 60 * 1000) {
        const remainingTime = Math.ceil((existingCode.expires - Date.now() - 9 * 60 * 1000) / 1000);
        return res.status(400).json({ 
            message: `请等待 ${remainingTime} 秒后再重新发送验证码` 
        });
    }
    
    const verificationCode = generateVerificationCode();
    // 存储验证码，设置10分钟过期时间
    verificationCodes[email] = {
        code: verificationCode,
        expires: Date.now() + 10 * 60 * 1000 // 10分钟后过期
    };
    
    // 确定发送方邮箱和授权码
    let senderEmail, senderAuthCode;
    
    if (email === defaultEmailConfig.email || !authCode) {
        // 使用默认配置发送到目标邮箱
        senderEmail = defaultEmailConfig.email;
        senderAuthCode = defaultEmailConfig.authCode;
    } else {
        // 使用用户提供的邮箱和授权码
        senderEmail = email;
        senderAuthCode = authCode;
    }
    
    const isSent = await sendVerificationEmail(senderEmail, senderAuthCode, email, verificationCode);
    
    if (isSent) {
        console.log(`验证码已发送到 ${email}: ${verificationCode}`); // 开发调试用，生产环境请删除
        res.json({ 
            message: `验证码已发送到 ${email}，请查收邮箱`,
            sender: senderEmail !== email ? `邮件由 ${senderEmail} 发送` : '邮件由本邮箱发送'
        });
    } else {
        res.status(500).json({ message: '发送验证码失败，请检查邮箱授权码是否正确或网络连接' });
    }
});

// 验证验证码的 API 路由
router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
        return res.send({ code: 400, msg: '邮箱和验证码不能为空' });
    }
    
    const storedData = verificationCodes[email];
    
    if (!storedData) {
        return res.send({ code: 400, msg: '验证码不存在或已过期' });
    }
    
    // 检查是否过期
    if (Date.now() > storedData.expires) {
        delete verificationCodes[email];
        return res.send({ code: 400, msg: '验证码已过期，请重新获取' });
    }
    
    // 验证码匹配
    if (code === storedData.code) {
        // 验证成功，清除验证码
        delete verificationCodes[email];
        res.send({ code: 200, msg: '验证成功' });
    } else {
        res.send({ code: 400, msg: '验证码错误' });
    }
});

// 登录接口
router.post('/login', async (req, res) => {
    let { email, username, password } = req.body;
    
    if (!email && !username) {
        res.send({ code: 400, msg: '用户名或邮箱不能为空' });
        return;
    }
    
    try {
        const user = await Usermodel.findOne(email ? { email } : { username });
        if (!user) {
            res.send({ code: 400, msg: '用户名或邮箱不存在' });
            return;
        }
        
        // 验证密码（使用User模型的comparePassword方法）
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.send({ code: 400, msg: '密码错误' });
            return;
        }
        
        // 生成双token
        const accessToken = generateAccessToken(user._id, user.username);
        const refreshToken = generateRefreshToken(user._id, user.username);
        
        // 更新用户的refresh token和最后登录时间
        await Usermodel.updateOne(
            { _id: user._id },
            { 
                refreshToken: refreshToken,
                lastLogin: new Date()
            }
        );
        
        // 设置cookie（可选）
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
        });
        
        res.send({
            code: 200,
            msg: '登录成功',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).send({ code: 500, msg: '服务器错误' });
    }
});

// 注册接口
router.post('/register', async (req, res) => {
    let { username, password, email } = req.body;
    
    try {
        // 检查用户是否已存在
        let existingUser = await Usermodel.findOne({ username });
        if (existingUser) {
            res.send({ code: 400, msg: '用户名已存在' });
            return;
        }
        
        // 检查邮箱是否已存在
        existingUser = await Usermodel.findOne({ email });
        if (existingUser) {
            res.send({ code: 400, msg: '邮箱已被注册' });
            return;
        }
        
        // 创建新用户（密码会在User模型的pre('save')中间件中自动加密）
        await Usermodel.create({
            username,
            password: password,  // 传入原始密码，让模型自动处理加密
            email
        });
        
        res.send({ code: 200, msg: '注册成功' });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).send({ code: 500, msg: '服务器错误' });
    }
});

// 修改密码
router.post('/change-password', async (req, res) => {
    let { email, newPassword } = req.body;
    
    try {
        const user = await Usermodel.findOne({ email });
        if (!user) {
            res.send({ code: 400, msg: '用户不存在' });
            return;
        }
        
        // 加密新密码
        const hashedPassword = await hashPassword(newPassword);
        
        // 更新密码并清除refresh token（强制重新登录）
        await Usermodel.updateOne(
            { email },
            { 
                password: hashedPassword,
                refreshToken: null
            }
        );
        
        res.send({ code: 200, msg: '密码修改成功，请重新登录' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).send({ code: 500, msg: '服务器错误' });
    }
});

// 刷新Access Token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ code: 400, msg: '需要刷新令牌' });
    }
    
    try {
        // 验证refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // 检查用户是否存在且token匹配
        const user = await Usermodel.findOne({ 
            _id: decoded.userId,
            refreshToken: refreshToken
        });
        
        if (!user) {
            return res.status(401).json({ code: 401, msg: '无效的刷新令牌' });
        }
        
        // 生成新的access token
        const newAccessToken = generateAccessToken(user._id, user.username);
        
        res.json({
            code: 200,
            msg: '令牌刷新成功',
            data: {
                accessToken: newAccessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('刷新令牌错误:', error);
        res.status(401).json({ code: 401, msg: '无效的刷新令牌' });
    }
});

// 登出接口
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // 清除用户的refresh token
        await Usermodel.updateOne(
            { _id: req.user.userId },
            { refreshToken: null }
        );
        
        // 清除cookie
        res.clearCookie('refreshToken');
        
        res.json({ code: 200, msg: '登出成功' });
    } catch (error) {
        console.error('登出错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});

// 获取用户信息（需要认证）
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await Usermodel.findById(req.user.userId).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }
        
        res.json({
            success: true,
            code: 200,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ success: false, code: 500, msg: '服务器错误' });
    }
});

// 更新用户资料
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        console.log('收到PUT /profile请求:', req.body);
        console.log('用户ID:', req.user.userId);
        
        const { username, email, bio, avatar } = req.body;
        const userId = req.user.userId;
        
        // 验证用户ID格式
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.log('无效的用户ID格式:', userId);
            return res.status(400).json({ 
                success: false, 
                code: 400, 
                msg: '无效的用户ID格式' 
            });
        }
        
        // 获取当前用户信息以比较变化
        const currentUser = await Usermodel.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ 
                success: false, 
                code: 404, 
                msg: '用户不存在' 
            });
        }
        
        // 构建更新对象
        const updateData = {};
        
        if (username !== undefined) {
            // 只有当用户名真的改变时才检查重复性
            if (username !== currentUser.username) {
                console.log('检查用户名重复:', username, '当前用户ID:', userId);
                const existingUser = await Usermodel.findOne({ 
                    username, 
                    _id: { $ne: new mongoose.Types.ObjectId(userId) } 
                });
                console.log('找到重复用户名的用户:', existingUser ? existingUser._id : '无');
                if (existingUser) {
                    console.log('用户名已被使用:', username, '被用户使用:', existingUser._id);
                    return res.status(400).json({ 
                        success: false, 
                        code: 400, 
                        msg: '用户名已被使用' 
                    });
                }
            }
            updateData.username = username;
        }
        
        if (email !== undefined) {
            // 只有当邮箱真的改变时才检查重复性
            if (email !== currentUser.email) {
                console.log('检查邮箱重复:', email, '当前用户ID:', userId);
                const existingUser = await Usermodel.findOne({ 
                    email, 
                    _id: { $ne: new mongoose.Types.ObjectId(userId) } 
                });
                console.log('找到重复邮箱的用户:', existingUser ? existingUser._id : '无');
                if (existingUser) {
                    console.log('邮箱已被使用:', email, '被用户使用:', existingUser._id);
                    return res.status(400).json({ 
                        success: false, 
                        code: 400, 
                        msg: '邮箱已被使用' 
                    });
                }
            }
            updateData.email = email;
        }
        
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        
        console.log('最终更新数据:', updateData);
        
        // 更新用户信息
        const updatedUser = await Usermodel.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true, 
                select: '-password -refreshToken',
                runValidators: true  // 确保运行模型验证
            }
        );
        
        console.log('更新结果:', updatedUser ? '成功' : '失败');
        
        if (!updatedUser) {
            console.log('用户不存在:', userId);
            return res.status(404).json({ 
                success: false, 
                code: 404, 
                msg: '用户不存在' 
            });
        }
        
        console.log('更新成功，返回数据');
        res.json({
            success: true,
            code: 200,
            msg: '更新成功',
            data: updatedUser
        });
    } catch (error) {
        console.error('更新用户资料错误:', error);
        
        // 处理Mongoose验证错误
        if (error.name === 'ValidationError') {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                code: 400, 
                msg: `验证失败: ${errorMessages.join(', ')}` 
            });
        }
        
        // 处理重复键错误
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                code: 400, 
                msg: `${field}已存在` 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            code: 500, 
            msg: '服务器错误' 
        });
    }
});

// 头像上传接口
router.post('/upload-avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                code: 400, 
                msg: '请选择要上传的头像文件' 
            });
        }
        
        // 构建头像URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        // 更新用户头像
        const updatedUser = await Usermodel.findByIdAndUpdate(
            req.user.userId,
            { avatar: avatarUrl },
            { new: true, select: '-password -refreshToken' }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                code: 404, 
                msg: '用户不存在' 
            });
        }
        
        res.json({
            success: true,
            code: 200,
            msg: '头像上传成功',
            data: {
                avatarUrl,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('头像上传错误:', error);
        res.status(500).json({ 
            success: false, 
            code: 500, 
            msg: '头像上传失败' 
        });
    }
});

// 购买会员
router.post('/purchase-membership', authenticateToken, async (req, res) => {
    try {
        const { planId, duration, price } = req.body;
        const userId = req.user.userId;
        
        console.log('收到购买会员请求:', { planId, duration, price, userId });
        
        if (!planId || !duration || !price) {
            return res.status(400).json({ 
                success: false, 
                code: 400, 
                msg: '参数不完整' 
            });
        }
        
        // 获取当前用户
        const user = await Usermodel.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                code: 404, 
                msg: '用户不存在' 
            });
        }
        
        // 计算会员到期时间
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + duration);
        
        // 更新用户会员信息
        const updatedUser = await Usermodel.findByIdAndUpdate(
            userId,
            {
                'membership.type': 'vip',
                'membership.isActive': true,
                'membership.startDate': now,
                'membership.endDate': endDate,
                'membership.planId': planId
            },
            { new: true, select: '-password -refreshToken' }
        );
        
        console.log('会员购买成功:', updatedUser.membership);
        
        res.json({
            success: true,
            code: 200,
            msg: '会员开通成功',
            data: {
                membership: updatedUser.membership,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('购买会员错误:', error);
        res.status(500).json({ 
            success: false, 
            code: 500, 
            msg: '服务器错误' 
        });
    }
});

// 验证token有效性
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({
        code: 200,
        msg: 'token有效',
        data: {
            userId: req.user.userId,
            username: req.user.username
        }
    });
});

// 增加经验值
router.post('/add-experience', authenticateToken, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ code: 400, msg: '经验值必须大于0' });
        }

        const user = await Usermodel.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }

        const oldLevel = user.level;
        const oldExperience = user.experience;
        
        // 使用模型的 addExperience 方法
        await user.addExperience(amount);
        
        const newLevel = user.level;
        const levelUp = newLevel > oldLevel;
        
        res.json({
            code: 200,
            msg: levelUp ? `恭喜升级到 LV${newLevel}!` : '经验值增加成功',
            data: {
                oldExperience,
                newExperience: user.experience,
                oldLevel,
                newLevel,
                levelUp,
                reason: reason || '未知原因'
            }
        });
    } catch (error) {
        console.error('增加经验值错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});

// 获取等级配置
router.get('/level-config', (req, res) => {
    try {
        const levelConfig = Usermodel.getLevelConfig();
        res.json({
            code: 200,
            data: levelConfig
        });
    } catch (error) {
        console.error('获取等级配置错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});

// 获取用户等级详情
router.get('/level-info', authenticateToken, async (req, res) => {
    try {
        const user = await Usermodel.findById(req.user.userId).select('level experience');
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }

        const levelConfig = Usermodel.getLevelConfig();
        const currentLevelConfig = levelConfig.find(config => config.level === user.level);
        const nextLevelConfig = levelConfig.find(config => config.level === user.level + 1);
        
        // 计算升级进度
        let progress = 0;
        let expToNext = 0;
        
        if (nextLevelConfig) {
            const currentLevelExp = currentLevelConfig ? currentLevelConfig.exp : 0;
            const nextLevelExp = nextLevelConfig.exp;
            const userExp = user.experience;
            
            expToNext = nextLevelExp - userExp;
            progress = ((userExp - currentLevelExp) / (nextLevelExp - currentLevelExp) * 100).toFixed(1);
        } else {
            progress = 100; // 已达到最高等级
        }

        res.json({
            code: 200,
            data: {
                currentLevel: user.level,
                experience: user.experience,
                currentLevelConfig,
                nextLevelConfig,
                expToNext: Math.max(0, expToNext),
                progress: parseFloat(progress)
            }
        });
    } catch (error) {
        console.error('获取等级信息错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});

// 关注用户
router.post('/follow/:userId', optionalAuth, async (req, res) => {
    try {
        // 获取关注者ID，如果没有登录则使用测试用户ID
        let followerId;
        if (req.user && req.user.userId) {
            followerId = req.user.userId; // 登录用户的ID
        } else {
            // 如果没有登录，创建或使用一个测试关注者
            followerId = '689563de58c2ae35f622e453'; // 测试用户ID
            console.log('使用测试关注者ID:', followerId);
        }
        
        const followingId = req.params.userId; // 被关注者ID
        
        console.log('关注请求 - 关注者:', followerId, '被关注者:', followingId);
        console.log('followerId类型:', typeof followerId, '长度:', followerId?.length);
        console.log('followingId类型:', typeof followingId, '长度:', followingId?.length);
        
        // 不能关注自己
        if (followerId === followingId) {
            return res.status(400).json({ code: 400, msg: '不能关注自己' });
        }
        
        // 检查被关注的用户是否存在
        let userToFollow;
        
        // 首先检查是否是有效的ObjectId格式
        if (mongoose.Types.ObjectId.isValid(followingId)) {
            // 如果是有效的ObjectId，按ID查找
            userToFollow = await Usermodel.findById(followingId);
        } else {
            // 如果不是有效的ObjectId，按用户名查找
            userToFollow = await Usermodel.findOne({ username: followingId });
        }
        
        // 如果是测试用户且不存在，则创建一个测试用户
        if (!userToFollow && followingId.startsWith('test-user-')) {
            console.log('创建测试用户:', followingId);
            userToFollow = new Usermodel({
                // 不设置_id，让MongoDB自动生成ObjectId
                username: followingId,
                email: `${followingId}@test.com`,
                password: '123456', // 密码会被自动加密
                stats: {
                    followers: 0,
                    following: 0,
                    videos: 0,
                    likes: 0,
                    views: 0
                }
            });
            await userToFollow.save();
        }
        
        if (!userToFollow) {
            console.log('被关注用户不存在:', followingId);
            return res.status(404).json({ code: 404, msg: `被关注的用户不存在: ${followingId}` });
        }
        
        // 检查关注者是否存在
        let follower = await Usermodel.findById(followerId);
        if (!follower) {
            console.log('关注者不存在，创建测试关注者:', followerId);
            // 创建测试关注者
            follower = new Usermodel({
                _id: followerId,
                username: 'test-follower',
                email: 'test-follower@test.com',
                password: '123456',
                stats: {
                    followers: 0,
                    following: 0,
                    videos: 0,
                    likes: 0,
                    views: 0
                }
            });
            await follower.save();
            console.log('测试关注者创建成功');
        }
        
        // 检查是否已经关注
        // 安全地转换followerId为ObjectId
        let followerObjectId;
        try {
            if (mongoose.Types.ObjectId.isValid(followerId)) {
                followerObjectId = new mongoose.Types.ObjectId(followerId);
            } else {
                console.error('无效的followerId格式:', followerId);
                return res.status(400).json({ code: 400, msg: '无效的关注者ID格式' });
            }
        } catch (error) {
            console.error('followerId转换失败:', followerId, error);
            return res.status(400).json({ code: 400, msg: '无效的用户ID' });
        }
        
        const existingFollow = await Follow.findOne({
            followerId: followerObjectId,
            followingId: userToFollow._id
        });
        
        if (existingFollow) {
            return res.status(400).json({ code: 400, msg: '已经关注了这个用户' });
        }
        
        console.log('用户存在，创建关注关系...');
        console.log('关注关系数据 - followerId:', followerObjectId, 'followingId:', userToFollow._id);
        
        // 验证数据完整性
        if (!followerObjectId || !userToFollow._id) {
            console.error('关注关系数据无效 - followerId:', followerObjectId, 'followingId:', userToFollow._id);
            return res.status(400).json({ code: 400, msg: '关注数据无效' });
        }
        
        // 创建关注关系
        const followRelation = new Follow({
            followerId: followerObjectId,
            followingId: userToFollow._id
        });
        
        await followRelation.save();
        
        // 更新统计数据
        await Usermodel.updateOne(
            { _id: followerObjectId },
            { $inc: { 'stats.following': 1 } }
        );
        
        await Usermodel.updateOne(
            { _id: userToFollow._id },
            { $inc: { 'stats.followers': 1 } }
        );
        
        console.log('关注成功');
        
        res.json({
            code: 200,
            msg: '关注成功',
            data: {
                followerId,
                followingId: userToFollow._id,
                followerStats: {
                    following: follower.stats.following + 1
                },
                followingStats: {
                    followers: userToFollow.stats.followers + 1
                }
            }
        });
    } catch (error) {
        console.error('关注用户错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误', error: error.message });
    }
});

// 取消关注用户
router.delete('/follow/:userId', optionalAuth, async (req, res) => {
    try {
        // 获取关注者ID，如果没有登录则使用测试用户ID
        let followerId;
        if (req.user && req.user.userId) {
            followerId = req.user.userId; // 登录用户的ID
        } else {
            // 如果没有登录，创建或使用一个测试关注者
            followerId = '689563de58c2ae35f622e453'; // 测试用户ID
            console.log('使用测试关注者ID:', followerId);
        }
        
        const followingId = req.params.userId; // 被取消关注者ID
        
        console.log('取消关注请求 - 关注者:', followerId, '被取消关注者:', followingId);
        
        // 检查被取消关注的用户是否存在
        let userToUnfollow;
        
        // 首先检查是否是有效的ObjectId格式
        if (mongoose.Types.ObjectId.isValid(followingId)) {
            // 如果是有效的ObjectId，按ID查找
            userToUnfollow = await Usermodel.findById(followingId);
        } else {
            // 如果不是有效的ObjectId，按用户名查找
            userToUnfollow = await Usermodel.findOne({ username: followingId });
        }
        
        // 如果是测试用户且不存在，则创建一个测试用户
        if (!userToUnfollow && followingId.startsWith('test-user-')) {
            console.log('创建测试用户:', followingId);
            userToUnfollow = new Usermodel({
                // 不设置_id，让MongoDB自动生成ObjectId
                username: followingId,
                email: `${followingId}@test.com`,
                password: '123456',
                stats: {
                    followers: 1, // 设为1，这样取消关注后变为0
                    following: 0,
                    videos: 0,
                    likes: 0,
                    views: 0
                }
            });
            await userToUnfollow.save();
        }
        
        if (!userToUnfollow) {
            console.log('被取消关注用户不存在:', followingId);
            return res.status(404).json({ code: 404, msg: `被取消关注的用户不存在: ${followingId}` });
        }
        
        let follower = await Usermodel.findById(followerId);
        if (!follower) {
            console.log('关注者不存在，创建测试关注者:', followerId);
            // 创建测试关注者
            follower = new Usermodel({
                _id: followerId,
                username: 'test-follower',
                email: 'test-follower@test.com',
                password: '123456',
                stats: {
                    followers: 0,
                    following: 1, // 设为1，这样取消关注后变为0
                    videos: 0,
                    likes: 0,
                    views: 0
                }
            });
            await follower.save();
            console.log('测试关注者创建成功');
        }
        
        // 检查是否存在关注关系
        // 安全地转换followerId为ObjectId
        let followerObjectId;
        try {
            if (mongoose.Types.ObjectId.isValid(followerId)) {
                followerObjectId = new mongoose.Types.ObjectId(followerId);
            } else {
                console.error('无效的followerId格式:', followerId);
                return res.status(400).json({ code: 400, msg: '无效的关注者ID格式' });
            }
        } catch (error) {
            console.error('followerId转换失败:', followerId, error);
            return res.status(400).json({ code: 400, msg: '无效的用户ID' });
        }
        
        console.log('查找关注关系 - followerId:', followerObjectId, 'followingId:', userToUnfollow._id);
        const followRelation = await Follow.findOne({
            followerId: followerObjectId,
            followingId: userToUnfollow._id
        });
        console.log('找到的关注关系:', followRelation);
        
        if (!followRelation) {
            return res.status(400).json({ code: 400, msg: '没有关注这个用户', error: 'NOT_FOLLOWING' });
        }
        
        console.log('用户存在，删除关注关系...');
        
        // 删除关注关系
        await Follow.deleteOne({
            followerId: followerObjectId,
            followingId: userToUnfollow._id
        });
        
        // 更新统计数据（确保不会变成负数）
        await Usermodel.updateOne(
            { _id: followerObjectId, 'stats.following': { $gt: 0 } },
            { $inc: { 'stats.following': -1 } }
        );
        
        await Usermodel.updateOne(
            { _id: userToUnfollow._id, 'stats.followers': { $gt: 0 } },
            { $inc: { 'stats.followers': -1 } }
        );
        
        console.log('取消关注成功');
        
        res.json({
            code: 200,
            msg: '取消关注成功',
            data: {
                followerId,
                followingId: userToUnfollow._id,
                followerStats: {
                    following: Math.max(0, follower.stats.following - 1)
                },
                followingStats: {
                    followers: Math.max(0, userToUnfollow.stats.followers - 1)
                }
            }
        });
    } catch (error) {
        console.error('取消关注用户错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误', error: error.message });
    }
});

// 获取用户的关注统计信息
router.get('/follow-stats/:userId?', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId || req.user.userId;
        
        const user = await Usermodel.findById(userId).select('stats username nickname');
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }
        
        res.json({
            code: 200,
            data: {
                userId: user._id,
                username: user.username,
                nickname: user.nickname,
                stats: {
                    followers: user.stats.followers || 0,
                    following: user.stats.following || 0,
                    videos: user.stats.videos || 0,
                    likes: user.stats.likes || 0,
                    views: user.stats.views || 0
                }
            }
        });
    } catch (error) {
        console.error('获取关注统计信息错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});

// 获取用户信息
router.get('/info', async function(req, res, next) {
    try {
      let {_id} = req.query;
      
      // 参数验证
      if (!_id) {
        return res.json({code: 400, msg: '用户ID不能为空'});
      }
      
      // 清理ID参数，移除可能的引号
      const cleanId = String(_id).replace(/['"]/g, '');
      
      // 验证ID格式（MongoDB ObjectId 是24位十六进制字符串）
      if (!/^[0-9a-fA-F]{24}$/.test(cleanId)) {
        return res.json({code: 400, msg: '无效的用户ID格式'});
      }
      
      console.log('查询用户ID:', cleanId);
      let user = await Usermodel.findById(cleanId);
      
      if (!user) {
        return res.json({code: 404, msg: '用户不存在'});
      }
      
      res.json({code: 200, msg: '获取用户信息成功', data: user});
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.json({code: 500, msg: '服务器错误'});
    }
  })

// 获取用户关注列表
router.get('/following/:userId?', optionalAuth, async (req, res) => {
    try {
        // 获取用户ID，如果没有提供则使用当前登录用户或测试用户
        let userId;
        if (req.params.userId) {
            userId = req.params.userId;
        } else if (req.user && req.user.userId) {
            userId = req.user.userId;
        } else {
            userId = '689563de58c2ae35f622e453'; // 测试用户ID
        }
        
        console.log('获取关注列表 - 用户ID:', userId);
        
        // 安全地转换userId为ObjectId
        let userObjectId;
        try {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userObjectId = new mongoose.Types.ObjectId(userId);
            } else {
                console.error('无效的userId格式:', userId);
                return res.status(400).json({ code: 400, msg: '无效的用户ID格式' });
            }
        } catch (error) {
            console.error('userId转换失败:', userId, error);
            return res.status(400).json({ code: 400, msg: '无效的用户ID' });
        }
        
        // 验证用户是否存在
        const user = await Usermodel.findById(userObjectId);
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }
        
        // 获取关注列表，包含被关注用户的详细信息
        const followList = await Follow.find({ followerId: userObjectId })
            .populate('followingId', 'username nickname avatar bio stats level createdAt')
            .sort({ createdAt: -1 }) // 按关注时间倒序
            .lean();
        
        // 格式化数据
        const formattedList = followList.map(follow => {
            const followedUser = follow.followingId;
            return {
                id: followedUser._id,
                userId: followedUser._id,
                username: followedUser.username,
                name: followedUser.nickname || followedUser.username,
                desc: followedUser.bio || '这个人很神秘，什么都没有写...',
                avatar: followedUser.avatar || '/uploads/default-avatar.png',
                followers: followedUser.stats?.followers || 0,
                following: followedUser.stats?.following || 0,
                videos: followedUser.stats?.videos || 0,
                level: followedUser.level || 1,
                followedAt: follow.createdAt,
                memberSince: followedUser.createdAt
            };
        });
        
        console.log(`获取关注列表成功，共${formattedList.length}个用户`);
        
        res.json({
            code: 200,
            msg: '获取关注列表成功',
            data: {
                total: formattedList.length,
                following: formattedList
            }
        });
    } catch (error) {
        console.error('获取关注列表错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误', error: error.message });
    }
});

// 获取用户粉丝列表
router.get('/followers/:userId?', optionalAuth, async (req, res) => {
    try {
        // 获取用户ID，如果没有提供则使用当前登录用户或测试用户
        let userId;
        if (req.params.userId) {
            userId = req.params.userId;
        } else if (req.user && req.user.userId) {
            userId = req.user.userId;
        } else {
            userId = '689563de58c2ae35f622e453'; // 测试用户ID
        }
        
        console.log('获取粉丝列表 - 用户ID:', userId);
        
        // 安全地转换userId为ObjectId
        let userObjectId;
        try {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userObjectId = new mongoose.Types.ObjectId(userId);
            } else {
                console.error('无效的userId格式:', userId);
                return res.status(400).json({ code: 400, msg: '无效的用户ID格式' });
            }
        } catch (error) {
            console.error('userId转换失败:', userId, error);
            return res.status(400).json({ code: 400, msg: '无效的用户ID' });
        }
        
        // 验证用户是否存在
        const user = await Usermodel.findById(userObjectId);
        if (!user) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }
        
        // 获取粉丝列表，包含关注者的详细信息
        const followerList = await Follow.find({ followingId: userObjectId })
            .populate('followerId', 'username nickname avatar bio stats level createdAt')
            .sort({ createdAt: -1 }) // 按关注时间倒序
            .lean();
        
        // 格式化数据
        const formattedList = followerList.map(follow => {
            const follower = follow.followerId;
            return {
                id: follower._id,
                userId: follower._id,
                username: follower.username,
                name: follower.nickname || follower.username,
                desc: follower.bio || '这个人很神秘，什么都没有写...',
                avatar: follower.avatar || '/uploads/default-avatar.png',
                followers: follower.stats?.followers || 0,
                following: follower.stats?.following || 0,
                videos: follower.stats?.videos || 0,
                level: follower.level || 1,
                followedAt: follow.createdAt,
                memberSince: follower.createdAt
            };
        });
        
        console.log(`获取粉丝列表成功，共${formattedList.length}个用户`);
        
        res.json({
            code: 200,
            msg: '获取粉丝列表成功',
            data: {
                total: formattedList.length,
                followers: formattedList
            }
        });
    } catch (error) {
        console.error('获取粉丝列表错误:', error);
        res.status(500).json({ code: 500, msg: '服务器错误', error: error.message });
    }
});

module.exports = router;