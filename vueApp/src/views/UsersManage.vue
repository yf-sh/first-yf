<template>
  <div class="users-manage">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>普通用户管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="getUserList" :loading="loading" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>
    
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名、昵称或邮箱..."
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <!-- 表格容器 -->
    <div class="table-container">
      <el-table 
        :data="userList" 
        border 
        stripe
        table-layout="fixed"
        style="width: 100%" 
        v-loading="loading" 
        class="centered-table"
        :header-cell-style="{ 
          background: '#f8f9fa', 
          color: '#495057',
          fontWeight: '600',
          fontSize: '14px',
          textAlign: 'center'
        }"
        :cell-style="{ 
          textAlign: 'center',
          padding: '12px 8px'
        }"
      >
        <el-table-column label="头像" width="80" align="center">
          <template #default="scope">
            <el-avatar 
              :src="scope.row.avatar || '/uploads/default-avatar.png'" 
              :alt="scope.row.nickname || scope.row.username"
              size="small"
              @error="handleAvatarError"
            />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" align="center" />
        <el-table-column prop="nickname" label="昵称" min-width="120" align="center">
          <template #default="scope">
            {{ scope.row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" align="center">
          <template #default="scope">
            {{ scope.row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getLevelTagType(scope.row.level)"
              size="small"
            >
              {{ getLevelName(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="experience" label="经验值" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag 
              :type="getStatusTagType(scope.row.status)"
              size="small"
              @click="toggleUserStatus(scope.row)"
              style="cursor: pointer"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180" align="center">
          <template #default="scope">
            <span class="time-text">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180" align="center">
          <template #default="scope">
            <span class="time-text">{{ scope.row.lastLoginAt ? formatDate(scope.row.lastLoginAt) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          label="操作" 
          width="180" 
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                size="small" 
                type="primary" 
                @click="handleView(scope.row)"
                :icon="View"
              >
                查看
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDelete(scope.row)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          class="pagination"
        />
      </div>
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="用户详情"
      width="600px"
      :before-close="handleCloseViewDialog"
      center
      class="user-dialog"
    >
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ selectedUser.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="等级">
            <el-tag :type="getLevelTagType(selectedUser.level)">
              {{ getLevelName(selectedUser.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="经验值">{{ selectedUser.experience }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedUser.status)">
              {{ getStatusText(selectedUser.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间" :span="2">{{ formatDate(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后登录" :span="2">
            {{ selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, View, Delete, Search } from '@element-plus/icons-vue'
import { userApi } from '../api/api'
import type { User, PaginationParams } from '../api/types'

// 用户列表数据
const userList = ref<User[]>([])
const loading = ref<boolean>(false)

// 分页相关
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)

// 搜索关键词
const searchKeyword = ref<string>('')

// 新增对话框相关
const addDialogVisible = ref<boolean>(false)
const addLoading = ref<boolean>(false)
const addFormRef = ref()
const addForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: ''
})

// 查看对话框相关
const viewDialogVisible = ref<boolean>(false)
const selectedUser = ref<User | null>(null)

// 等级配置
const levelConfig = [
  { level: 1, name: '小白', type: 'info' },
  { level: 2, name: '初级', type: 'warning' },
  { level: 3, name: '中级', type: 'success' },
  { level: 4, name: '高级', type: 'danger' },
  { level: 5, name: '专家', type: '' }
]

// 表单验证规则
const addRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== addForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取等级名称
const getLevelName = (level: number) => {
  const config = levelConfig.find(c => c.level === level)
  return config ? config.name : `等级${level}`
}

// 获取等级标签类型
const getLevelTagType = (level: number) => {
  const config = levelConfig.find(c => c.level === level)
  return config ? config.type : 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    active: '正常',
    suspended: '已暂停',
    banned: '已封禁'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusTypeMap = {
    active: 'success',
    suspended: 'warning',
    banned: 'danger'
  }
  return statusTypeMap[status as keyof typeof statusTypeMap] || 'info'
}

// 处理头像错误
const handleAvatarError = () => {
  // Element Plus的avatar组件会自动处理错误
}

// 获取用户列表
const getUserList = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value // 添加搜索关键词参数
    }
    
    const response = await userApi.getUsers(params)
    
    if (response.code === 200) {
      userList.value = response.data.list
      total.value = response.data.total
    } else {
      ElMessage.error(response.msg || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表错误:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getUserList()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  getUserList()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
  getUserList()
}



// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    const params = {
      username: addForm.username,
      password: addForm.password,
      nickname: addForm.nickname,
      email: addForm.email
    }
    
    const res = await userApi.createUser(params)
    
    if (res.code === 200) {
      ElMessage.success('添加用户成功')
      addDialogVisible.value = false
      getUserList()
    } else {
      ElMessage.error(res.msg || '添加用户失败')
    }
  } catch (error) {
    console.error('添加用户错误:', error)
    ElMessage.error('添加用户失败')
  } finally {
    addLoading.value = false
  }
}

// 关闭新增对话框
const handleCloseAddDialog = () => {
  addDialogVisible.value = false
}

// 查看用户详情
const handleView = (row: User) => {
  selectedUser.value = row
  viewDialogVisible.value = true
}

// 关闭查看对话框
const handleCloseViewDialog = () => {
  viewDialogVisible.value = false
  selectedUser.value = null
}

// 切换用户状态
const toggleUserStatus = async (user: User) => {
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  
  try {
    const response = await userApi.updateUserStatus(user._id, newStatus)
    if (response.code === 200) {
      ElMessage.success('状态更新成功')
      getUserList()
    } else {
      ElMessage.error(response.msg || '状态更新失败')
    }
  } catch (error) {
    console.error('更新用户状态错误:', error)
    ElMessage.error('状态更新失败')
  }
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await userApi.deleteUser(row._id)
    
    if (res.code === 200) {
      ElMessage.success('删除用户成功')
      getUserList()
    } else {
      ElMessage.error(res.msg || '删除用户失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户错误:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 页面加载时获取数据
onMounted(() => {
  getUserList()
})
</script>

<style scoped>
.users-manage {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
  box-sizing: border-box;
}

.breadcrumb-container {
  margin-bottom: 20px;
  padding: 16px 32px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #2c3e50 0%, #33475c 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  padding: 0 32px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 表格居中样式 */
.centered-table {
  text-align: center;
  width: 100% !important;
}

.centered-table :deep(.el-table__header) {
  text-align: center !important;
}

.centered-table :deep(.el-table__body) {
  text-align: center;
}

.centered-table :deep(.cell) {
  text-align: center;
}

.centered-table :deep(.el-table__header-wrapper) {
  text-align: center;
  width: 100% !important;
  background: #f8f9fa;
}

.centered-table :deep(.el-table__row:hover) {
  background-color: #f0f9ff;
}

.centered-table :deep(.el-button) {
  margin: 0 4px;
}

.centered-table :deep(.el-table) {
  width: 100% !important;
  flex: 1;
}

.centered-table :deep(.el-table__body-wrapper) {
  width: 100% !important;
  flex: 1;
}

.centered-table :deep(.el-table__inner-wrapper) {
  width: 100% !important;
  height: 100%;
}

.centered-table :deep(.el-table__body) {
  width: 100% !important;
}

.centered-table :deep(.el-table__header) {
  width: 100% !important;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-text {
  font-size: 13px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

.centered-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.centered-table :deep(.el-table__row:hover) {
  background-color: #f0f9ff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.centered-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #495057;
}

.centered-table :deep(.el-table__body td) {
  border-bottom: 1px solid #f1f3f4;
  padding: 16px 8px;
}

.centered-table :deep(.el-tag) {
  border-radius: 12px;
  font-weight: 500;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: white;
  border-top: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.pagination {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination :deep(.el-pagination__total) {
  font-weight: 500;
  color: #495057;
}

.pagination :deep(.el-pagination__sizes) {
  margin-right: 16px;
}

.pagination :deep(.el-pagination__jump) {
  margin-left: 16px;
}

/* 对话框样式 */
.user-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.user-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.user-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.user-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.user-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 用户详情样式 */
.user-detail {
  padding: 0;
}

.user-detail :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #495057;
}

.user-detail :deep(.el-descriptions__content) {
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .users-manage {
    padding: 10px;
    width: 100%;
  }

  .breadcrumb-container {
    padding: 12px 20px;
    margin-bottom: 15px;
  }

  .page-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .search-section {
    padding: 0 20px 15px;
  }

  .search-input {
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .centered-table :deep(.el-table__body td) {
    padding: 12px 4px;
  }
}
</style> 