import React, { useState } from 'react'
import styles from '../styles/login.module.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import tokenManager from '../utils/tokenManager'
import { awardDailyLoginExp } from '../utils/experienceManager'

export default function login() {
    const [loginid, setloginid] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [passwordtrue, setPasswordtrue] = useState('')
    const [email, setEmail] = useState('')
    const [emailCode, setEmailCode] = useState('') // 新增邮箱验证码
    const [codeBtnText, setCodeBtnText] = useState('发送验证码')
    const [codeBtnDisabled, setCodeBtnDisabled] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordtrue, setShowPasswordtrue] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [isLogin, setIsLogin] = useState(0)
    const router = useNavigate()
    let timer: any = null

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 发送验证码
    const handleSendCode = async () => {
        if (!email) {
            alert('请先输入邮箱')
            return
        }
        setCodeBtnDisabled(true)
        setCodeBtnText('60s')
        let count = 60
        timer = setInterval(() => {
            count--
            setCodeBtnText(count + 's')
            if (count <= 0) {
                setCodeBtnDisabled(false)
                setCodeBtnText('发送验证码')
                if (timer) clearInterval(timer)
            }
        }, 1000)
        // 这里调用后端API发送验证码
        setIsLoading(true);
        setMessage('');
        try {
            const response = await axios.post('http://localhost:9527/api/users/send-verification', { email });
            setMessage(response.data.message);
        } catch (error) {
            // 错误类型可能是AxiosError，可用类型断言
            if (axios.isAxiosError(error) && error.response) {
                setMessage(error.response.data?.message || '发送验证码失败');
            } else {
                setMessage('发送验证码失败');
            }
        } finally {
            setIsLoading(false);
        }
    }

    // 验证邮箱
    const isemail = (input: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    }
    // 登录事件
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loginid || !password) {
            alert('请输入用户名或密码')
            return;
        }
        
        setIsLoading(true);
        setMessage('');
        
        try {
            const payload = isemail(loginid) ? { email: loginid, password } : { username: loginid, password }
            
            const response = await axios.post('http://localhost:9527/api/users/login', payload);
            
            if (response.data.code === 200) {
                const { accessToken, refreshToken, user } = response.data.data;
                
                // 使用TokenManager存储tokens
                tokenManager.setTokens(accessToken, refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                // localStorage.setItem('isLoggedIn', 'true')
                
                // 奖励每日登录经验值（一天只能获得一次）
                awardDailyLoginExp();
                
                alert(response.data.msg);
                router('/home/first');
            } else {
                alert(response.data.msg);
                setPassword('');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                alert(error.response.data?.msg || '登录失败');
            } else {
                alert('登录失败，请稍后重试');
            }
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    }

    // 注册事件
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== passwordtrue) {
            alert('两次密码输入不一致，请重新输入')
            return;
        }
        if (!email) {
            alert('请输入邮箱')
            return;
        }
        if (!emailCode) {
            alert('请输入邮箱验证码')
            return;
        }

        setIsLoading(true);
        setMessage('');
        axios.post('http://localhost:9527/api/users/verify-code', { email, code: emailCode }).then(res => {
            if (res.data.code === 200) {
                alert(res.data.msg)
                axios.post('http://localhost:9527/api/users/register', { username, password, email }).then(res => {
                    if (res.data.code === 200) {
                        setIsLogin(0)
                        alert(res.data.msg)
                        setUsername('')
                        setPassword('')
                        setEmail('')
                        setEmailCode('')
                        
                        // 注册成功后，需要用户登录才能奖励经验值，这里先提示
                        alert('注册成功！登录后将获得新手奖励经验值！')
                    } else {
                        alert(res.data.msg)
                    }
                })
            }
            else {
                alert(res.data.msg)
            }
        })
    }

    // 切换登录/注册
    const toggleForm = () => {
        setIsLogin(isLogin === 0 ? 1 : 0)
        setUsername('')
        setPassword('')
        setPasswordtrue('')
        setEmail('')
        setEmailCode('')
        setShowPassword(false)
        setShowPasswordtrue(false)
        setRememberMe(false)
    }

    // 修改密码事件
    const handlePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== passwordtrue) {
            alert('两次密码输入不一致，请重新输入')
            return;
        }
        if (!email) {
            alert('请输入邮箱')
            return;
        }
        if (!emailCode) {
            alert('请输入邮箱验证码')
            return;
        }
        axios.post('http://localhost:9527/api/users/verify-code', { email, code: emailCode }).then(res => {
            if (res.data.code === 200) {
                alert(res.data.msg)
                axios.post('http://localhost:9527/api/users/change-password', { email, newPassword:password }).then(res => {
                    if (res.data.code === 200) {
                        alert(res.data.msg)
                        setUsername('')
                        setPassword('')
                        setEmail('')
                        setEmailCode('')
                        setIsLogin(0)
                    } else {
                        alert(res.data.msg)
                    }
                })
            }
            else {
                alert(res.data.msg)
            }
        })
    }

    return (
        <div className={styles.loginContainer}>
            {/* 登录/注册表单 */}
            <div className={styles.loginright}>
                <div className={styles.formContainer}>
                    <h2 className={styles.formTitle}>
                        {isLogin === 0 ? ('欢迎登录') : isLogin === 1 ? ('注册账号') : ('修改密码')}
                    </h2>

                    {isLogin === 0 ? (
                        // 登录表单
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>👤</div>
                                <input
                                    type="text"
                                    placeholder="用户名/邮箱地址"
                                    value={loginid}
                                    onChange={(e) => setloginid(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>🔒</div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="请输入密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeIcon}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>

                            <div className={styles.options}>
                                <label className={styles.rememberMe}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>记住密码</span>
                                </label>
                                <a href="#" onClick={() => setIsLogin(2)} className={styles.forgotPassword}>忘记密码</a>
                            </div>

                            <div className={styles.inputBox}>
                                <input type="submit" value="登录" className={styles.loginButton} />
                            </div>

                            <div className={styles.registerLink}>
                                <a onClick={toggleForm} className={styles.toggleLink}>注册账号</a>
                            </div>
                        </form>
                    ) : isLogin === 1 ? (
                        // 注册表单
                        <form onSubmit={handleRegister} className={styles.form}>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>👤</div>
                                <input
                                    type="text"
                                    placeholder="请输入用户名"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>📧</div>
                                <input
                                    type="email"
                                    placeholder="请输入邮箱地址"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    pattern='^\d+@qq\.com$'
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>🔒</div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="请设置登录密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeIcon}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>🔐</div>
                                <input
                                    type={showPasswordtrue ? "text" : "password"}
                                    placeholder="请再次确认密码"
                                    required
                                    className={styles.input}
                                    value={passwordtrue}
                                    onChange={(e) => setPasswordtrue(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordtrue(!showPasswordtrue)}
                                    className={styles.eyeIcon}
                                >
                                    {showPasswordtrue ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* 邮箱验证码和发送按钮 */}
                            <div className={styles.inputBox} style={{ padding: 0, border: 'none', background: 'transparent' }}>
                                <input
                                    type="text"
                                    placeholder="请输入邮箱验证码"
                                    value={emailCode}
                                    onChange={e => setEmailCode(e.target.value)}
                                    className={styles.input}
                                    style={{ background: '#f5f6fa', border: 'none', flex: 1, borderRadius: '4px 0 0 4px' }}
                                />
                                <button
                                    type="button"
                                    className={styles.codeBtn}
                                    onClick={handleSendCode}
                                    disabled={codeBtnDisabled}
                                >
                                    {codeBtnText}
                                </button>
                            </div>
                            <div className={styles.options}>
                                <label className={styles.rememberMe}>
                                    <input
                                        type="checkbox"
                                        required
                                    />
                                    <span>我已阅读并同意用户协议</span>
                                </label>
                            </div>
                            <div className={styles.inputBox}>
                                <input type="submit" value="注册" className={styles.loginButton} />
                            </div>
                            <div className={styles.registerLink}>
                                <a onClick={toggleForm} className={styles.toggleLink}>已有账号？立即登录</a>
                            </div>
                        </form>
                    ) : (
                        // 修改密码表单
                        <form onSubmit={handlePassword} className={styles.form}>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>📧</div>
                                <input
                                    type="email"
                                    placeholder="请输入注册邮箱"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    pattern='^\d+@qq\.com$'
                                    required
                                    className={styles.input}
                                />
                            </div>
                            {/* 邮箱验证码和发送按钮 */}
                            <div className={styles.inputBox} style={{ padding: 0, border: 'none', background: 'transparent' }}>
                                <input
                                    type="text"
                                    placeholder="请输入邮箱验证码"
                                    value={emailCode}
                                    onChange={e => setEmailCode(e.target.value)}
                                    className={styles.input}
                                    style={{ background: '#f5f6fa', border: 'none', flex: 1, borderRadius: '4px 0 0 4px' }}
                                />
                                <button
                                    type="button"
                                    className={styles.codeBtn}
                                    onClick={handleSendCode}
                                    disabled={codeBtnDisabled}
                                >
                                    {codeBtnText}
                                </button>
                            </div>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>🔑</div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="请设置新密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeIcon}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <div className={styles.inputBox}>
                                <div className={styles.inputIcon}>🔐</div>
                                <input
                                    type={showPasswordtrue ? "text" : "password"}
                                    placeholder="请再次确认新密码"
                                    required
                                    className={styles.input}
                                    value={passwordtrue}
                                    onChange={(e) => setPasswordtrue(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordtrue(!showPasswordtrue)}
                                    className={styles.eyeIcon}
                                >
                                    {showPasswordtrue ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <div className={styles.inputBox}>
                                <input type="submit" value="修改密码" className={styles.loginButton} />
                            </div>
                            <div className={styles.registerLink}>
                                <a onClick={toggleForm} className={styles.toggleLink}>返回登录</a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
