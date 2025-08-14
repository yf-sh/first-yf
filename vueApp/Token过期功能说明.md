# Token过期功能说明

## 功能概述

系统已成功添加登录过期时间管理功能，用户登录后12小时内无需重新登录，超过12小时后系统会自动要求重新登录。

## 主要特性

### 1. 自动过期管理
- **过期时间**: 12小时（720分钟）
- **自动检查**: 系统会在每次访问时自动检查token是否过期
- **自动登出**: token过期后系统会自动清除用户信息并跳转到登录页面

### 2. 过期提醒功能
- **提前提醒**: 在token过期前5分钟显示警告提醒
- **实时倒计时**: 显示剩余登录时间
- **一键刷新**: 提供"刷新登录"按钮，快速跳转到登录页面

### 3. 智能存储管理
- **本地存储**: token和过期时间存储在localStorage中
- **自动清理**: 过期后自动清除所有相关存储数据
- **状态同步**: 页面刷新后自动恢复登录状态（如果未过期）

## 技术实现

### 1. 用户Store增强
```typescript
// 新增状态管理
const tokenExpiry = ref<number | null>(null)

// 智能登录状态检查
const isLoggedIn = computed(() => {
  if (!token.value || !user.value) return false
  
  // 检查token是否过期
  if (tokenExpiry.value && Date.now() >= tokenExpiry.value) {
    logout() // 自动登出
    return false
  }
  
  return true
})

// 过期提醒检查
const isTokenExpiringSoon = computed(() => {
  if (!tokenExpiry.value) return false
  const fiveMinutes = 5 * 60 * 1000
  return Date.now() >= (tokenExpiry.value - fiveMinutes)
})

// 剩余时间计算
const getRemainingTime = computed(() => {
  if (!tokenExpiry.value) return 0
  const remaining = tokenExpiry.value - Date.now()
  return Math.max(0, Math.floor(remaining / (60 * 1000)))
})
```

### 2. Token设置逻辑
```typescript
const setToken = (newToken: string) => {
  token.value = newToken
  // 设置12小时过期时间
  const expiryTime = Date.now() + (12 * 60 * 60 * 1000)
  tokenExpiry.value = expiryTime
  
  localStorage.setItem('token', newToken)
  localStorage.setItem('tokenExpiry', expiryTime.toString())
}
```

### 3. 自动初始化
```typescript
const initTokenFromStorage = () => {
  const storedToken = localStorage.getItem('token')
  const storedExpiry = localStorage.getItem('tokenExpiry')
  
  if (storedToken && storedExpiry) {
    const expiryTime = parseInt(storedExpiry)
    const now = Date.now()
    
    // 检查token是否过期
    if (now < expiryTime) {
      token.value = storedToken
      tokenExpiry.value = expiryTime
    } else {
      // token已过期，清除存储
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      localStorage.removeItem('userInfo')
    }
  }
}
```

## 用户界面

### 1. 过期提醒横幅
- **位置**: 页面顶部，导航栏下方
- **样式**: 黄色警告样式，不可关闭
- **内容**: 显示过期提醒和剩余时间
- **操作**: 提供"刷新登录"按钮

### 2. 自动跳转
- **过期检测**: 访问任何需要认证的页面时自动检查
- **重定向**: 过期后自动跳转到登录页面
- **状态清除**: 自动清除所有用户相关数据

## 使用场景

### 1. 正常使用
- 用户登录后12小时内可以正常使用系统
- 关闭页面后重新打开，如果未过期则保持登录状态
- 无需手动刷新或重新登录

### 2. 即将过期
- 系统提前5分钟显示过期提醒
- 用户可以及时保存工作内容
- 点击"刷新登录"快速跳转到登录页面

### 3. 已过期
- 系统自动清除登录状态
- 访问任何页面都会跳转到登录页面
- 需要重新输入用户名和密码

## 安全特性

### 1. 自动过期
- 防止长期未使用的账号被恶意利用
- 强制用户定期重新验证身份
- 减少安全风险

### 2. 状态同步
- 多标签页之间状态同步
- 页面刷新后状态保持一致
- 避免重复登录

### 3. 数据清理
- 过期后自动清理所有敏感数据
- 确保用户信息不会泄露
- 符合安全最佳实践

## 配置说明

### 1. 过期时间调整
如需修改过期时间，可以在`setToken`方法中调整：
```typescript
// 当前设置为12小时
const expiryTime = Date.now() + (12 * 60 * 60 * 1000)

// 可以调整为其他时间，例如：
// 8小时: (8 * 60 * 60 * 1000)
// 24小时: (24 * 60 * 60 * 1000)
// 7天: (7 * 24 * 60 * 60 * 1000)
```

### 2. 提醒时间调整
如需修改提前提醒时间，可以在`isTokenExpiringSoon`中调整：
```typescript
// 当前设置为提前5分钟提醒
const fiveMinutes = 5 * 60 * 1000

// 可以调整为其他时间，例如：
// 10分钟: 10 * 60 * 1000
// 30分钟: 30 * 60 * 1000
```

## 测试建议

### 1. 正常流程测试
- 登录后正常使用系统功能
- 关闭页面后重新打开，验证登录状态保持
- 检查localStorage中是否正确存储了token和过期时间

### 2. 过期提醒测试
- 手动修改localStorage中的过期时间，设置为即将过期
- 验证是否显示过期提醒横幅
- 测试"刷新登录"按钮功能

### 3. 过期跳转测试
- 手动修改localStorage中的过期时间，设置为已过期
- 验证是否自动跳转到登录页面
- 检查localStorage是否被正确清理

## 总结

新添加的token过期功能为系统提供了：

✅ **安全性提升**: 自动过期机制防止长期未使用的账号被滥用  
✅ **用户体验**: 12小时的登录有效期平衡了安全性和便利性  
✅ **智能提醒**: 提前5分钟提醒用户保存工作并重新登录  
✅ **自动管理**: 无需用户干预，系统自动处理过期和清理  
✅ **状态同步**: 多标签页和页面刷新后状态保持一致  

这个功能确保了系统在保持安全性的同时，为用户提供了良好的使用体验。 