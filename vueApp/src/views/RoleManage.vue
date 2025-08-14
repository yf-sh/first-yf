<template>
  <div class="role-manage">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>角色管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">角色管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="handleAddRole" :icon="Plus">
          +新增角色
        </el-button>
        <el-button type="primary" @click="getRoleList" :loading="loading" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>
    
    <!-- 表格容器 -->
    <div class="table-container">
      <el-table 
        :data="roleList" 
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
        <el-table-column prop="name" label="角色名称" min-width="150" align="center" />
        <el-table-column prop="description" label="角色描述" min-width="200" align="center" />
        <el-table-column label="权限数量" width="120" align="center">
          <template #default="scope">
            <span :class="getPermissionCountClass(scope.row.permissions?.length || 0)">
              {{ scope.row.permissions?.length || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="scope">
            <span class="time-text">{{ formatDate(scope.row.createdAt) }}</span>
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
                @click="handleEdit(scope.row)"
                :icon="Edit"
              >
                编辑
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

    <!-- 新增角色对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增角色"
      width="600px"
      :before-close="handleCloseAddDialog"
      center
      class="role-dialog"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="addForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入角色描述" 
          />
        </el-form-item>
        <el-form-item label="权限设置" prop="permissions">
          <div class="permission-section">
            <div class="permission-header">
              <span>选择权限</span>
              <span class="selected-count">已选择: {{ addForm.permissions.length }} 项</span>
              <el-checkbox 
                v-model="selectAllPermissions" 
                :indeterminate="isIndeterminate" 
                @change="handleSelectAllPermissions"
              >
                全选
              </el-checkbox>
            </div>
            <div class="permission-list">
              <el-checkbox-group v-model="addForm.permissions" class="permission-checkbox-group">
                <div 
                  v-for="permission in permissionList" 
                  :key="permission._id"
                  class="permission-item"
                >
                  <el-checkbox :label="permission._id" border>
                    <div class="permission-info">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-desc">{{ permission.description }}</div>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitAdd" 
            :loading="addLoading"
          >
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 角色编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑角色"
      width="600px"
      :before-close="handleCloseEditDialog"
      center
      class="role-dialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入角色描述" 
          />
        </el-form-item>
        <el-form-item label="权限设置" prop="permissions">
          <div class="permission-section">
            <div class="permission-header">
              <span>选择权限</span>
              <span class="selected-count">已选择: {{ editForm.permissions.length }} 项</span>
              <el-checkbox 
                v-model="editSelectAllPermissions" 
                :indeterminate="editIsIndeterminate" 
                @change="handleEditSelectAllPermissions"
              >
                全选
              </el-checkbox>
            </div>
            <div class="permission-list">
              <el-checkbox-group v-model="editForm.permissions" class="permission-checkbox-group">
                <div 
                  v-for="permission in permissionList" 
                  :key="permission._id"
                  class="permission-item"
                >
                  <el-checkbox :label="permission._id" border>
                    <div class="permission-info">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-desc">{{ permission.description }}</div>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitEdit" 
            :loading="editLoading"
          >
            更新
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { roleApi, permissionApi } from '../api/api'
import type { Role, RoleAddParams, Permission } from '../api/types'

// 角色列表数据
const roleList = ref<Role[]>([])
const loading = ref<boolean>(false)

// 权限列表数据
const permissionList = ref<Permission[]>([])

// 分页相关
const currentPage = ref<number>(1)
const pageSize = ref<number>(5)
const total = ref<number>(0)

// 新增对话框相关
const addDialogVisible = ref<boolean>(false)
const addLoading = ref<boolean>(false)
const addFormRef = ref()
const addForm = reactive({
  name: '',
  description: '',
  permissions: [] as string[] // 多选权限ID数组
})

// 权限全选相关
const selectAllPermissions = ref<boolean>(false)
const isIndeterminate = computed(() => {
  const selectedCount = addForm.permissions.length
  const totalCount = permissionList.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 编辑对话框相关
const editDialogVisible = ref<boolean>(false)
const editLoading = ref<boolean>(false)
const editFormRef = ref()
const editForm = reactive({
  _id: '',
  name: '',
  description: '',
  permissions: [] as string[] // 多选权限ID数组
})

// 编辑权限全选相关
const editSelectAllPermissions = ref<boolean>(false)
const editIsIndeterminate = computed(() => {
  const selectedCount = editForm.permissions.length
  const totalCount = permissionList.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 表单验证规则
const addRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 5, max: 200, message: '角色描述长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  permissions: [
    { type: 'array', required: true, message: '请至少选择一个权限', trigger: 'change' }
  ]
}

const editRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 5, max: 200, message: '角色描述长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  permissions: [
    { type: 'array', required: true, message: '请至少选择一个权限', trigger: 'change' }
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

// 获取角色列表
const getRoleList = async () => {
  loading.value = true
  try {
    console.log('开始获取角色列表...')
    const res = await roleApi.getRoles({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    console.log('角色列表响应:', res)
    
    if (res.code === 200 && res.data) {
      console.log('角色数据:', res.data)
      roleList.value = res.data
      // 更新分页信息
      if (res.pagination) {
        total.value = res.pagination.total
        currentPage.value = res.pagination.page
        pageSize.value = res.pagination.pageSize
      }
      console.log('角色列表已更新，当前数量:', roleList.value.length)
    } else {
      console.error('获取角色列表失败:', res.msg || '未知错误')
      ElMessage.error(res.msg || '获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色列表错误:', error)
    ElMessage.error('获取角色列表失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getRoleList()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  getRoleList()
}

// 获取权限列表
const getPermissionList = async () => {
  try {
    console.log('开始获取权限列表...')
    // 获取所有权限，使用getAllPermissions方法
    const res = await permissionApi.getAllPermissions()
    console.log('权限列表响应:', res)
    
    if (res.code === 200 && res.data) {
      permissionList.value = res.data
      console.log('获取到权限列表:', permissionList.value.length, '个权限')
      
      // 打印权限信息，帮助调试
      permissionList.value.forEach((permission, index) => {
        console.log(`权限${index + 1}: ${permission.name} (${permission._id}) - ${permission.description}`)
      })
    } else {
      console.error('获取权限列表失败:', res.msg || '未知错误')
      ElMessage.error(res.msg || '获取权限列表失败')
    }
  } catch (error) {
    console.error('获取权限列表错误:', error)
    ElMessage.error('获取权限列表失败，请检查网络连接')
  }
}

// 处理全选权限
const handleSelectAllPermissions = (checked: boolean) => {
  if (checked) {
    addForm.permissions = permissionList.value.map(p => p._id)
  } else {
    addForm.permissions = []
  }
  selectAllPermissions.value = checked
}

// 处理编辑全选权限
const handleEditSelectAllPermissions = (checked: boolean) => {
  if (checked) {
    editForm.permissions = permissionList.value.map(p => p._id)
  } else {
    editForm.permissions = []
  }
  editSelectAllPermissions.value = checked
}

// 新增角色
const handleAddRole = () => {
  addForm.name = ''
  addForm.description = ''
  addForm.permissions = []
  selectAllPermissions.value = false
  addDialogVisible.value = true
}

// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    console.log('提交新增角色:', addForm)
    
    const params: RoleAddParams = {
      name: addForm.name,
      description: addForm.description,
      permissions: addForm.permissions // 直接使用权限数组
    }
    
    console.log('提交参数:', params)
    
    const res = await roleApi.addRole(params)
    
    if (res.code === 200) {
      ElMessage.success('添加角色成功')
      addDialogVisible.value = false
      getRoleList()
    } else {
      ElMessage.error(res.msg || '添加角色失败')
    }
  } catch (error) {
    console.error('添加角色错误:', error)
    ElMessage.error('添加角色失败')
  } finally {
    addLoading.value = false
  }
}

// 关闭新增对话框
const handleCloseAddDialog = () => {
  addDialogVisible.value = false
}

// 编辑角色
const handleEdit = async (row: Role) => {
  editForm._id = row._id
  editForm.name = row.name
  editForm.description = row.description
  
  // 处理权限字段 - 多选模式，获取所有权限ID
  editForm.permissions = [] // 先清空
  
  if (Array.isArray(row.permissions)) {
    if (row.permissions.length > 0 && typeof row.permissions[0] === 'object') {
      // 如果是对象数组，提取所有权限的ID
      editForm.permissions = (row.permissions as Permission[]).map(p => p._id)
    } else if (row.permissions.length > 0 && typeof row.permissions[0] === 'string') {
      // 如果是ID数组，直接使用
      editForm.permissions = [...row.permissions] as string[]
    }
  }
  
  // 更新全选状态
  if (editForm.permissions.length === permissionList.value.length) {
    editSelectAllPermissions.value = true
  } else {
    editSelectAllPermissions.value = false
  }
  
  console.log('编辑角色:', editForm)
  console.log('已选权限数量:', editForm.permissions.length)
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    editLoading.value = true
    
    console.log('提交编辑角色:', editForm)
    
    const params = {
      _id: editForm._id,
      name: editForm.name,
      description: editForm.description,
      permissions: editForm.permissions // 直接使用权限数组
    }
    
    console.log('提交参数:', params)
    
    const res = await roleApi.updateRole(params)
    
    if (res.code === 200) {
      ElMessage.success('更新角色成功')
      editDialogVisible.value = false
      getRoleList()
    } else {
      ElMessage.error(res.msg || '更新角色失败')
    }
  } catch (error) {
    console.error('更新角色错误:', error)
    ElMessage.error('更新角色失败')
  } finally {
    editLoading.value = false
  }
}

// 关闭编辑对话框
const handleCloseEditDialog = () => {
  editDialogVisible.value = false
}

// 删除角色
const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await roleApi.deleteRole({ _id: row._id })
    
    if (res.code === 200) {
      ElMessage.success('删除角色成功')
      getRoleList()
    } else {
      ElMessage.error(res.msg || '删除角色失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除角色错误:', error)
      ElMessage.error('删除角色失败')
    }
  }
}

// 获取权限数量类名
const getPermissionCountClass = (count: number) => {
  if (count > 10) {
    return 'permission-count-success'
  } else if (count > 0) {
    return 'permission-count-info'
  } else {
    return 'permission-count-default'
  }
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    console.log('页面开始加载...')
    
    // 先获取权限列表
    await getPermissionList()
    
    // 再获取角色列表
    await getRoleList()
    
    console.log('页面加载完成')
  } catch (error) {
    console.error('页面加载失败:', error)
    ElMessage.error('页面加载失败，请刷新重试')
  }
})
</script>

<style scoped>
.role-manage {
  width: 1410px;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.breadcrumb-container {
  margin-bottom: 20px;
  padding: 16px 32px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #2c3e50 0%, #33475c 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
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
  text-align: center ;
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

/* 新增样式 */
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
.role-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.role-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.role-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.role-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.role-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 权限选择区域样式 */
.permission-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.selected-count {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  background-color: #f0f2f5;
  padding: 4px 10px;
  border-radius: 12px;
}

.permission-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: white;
  padding: 12px;
}

.permission-item {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.permission-item:hover {
  background-color: #f5f7fa;
}

.permission-item:last-child {
  margin-bottom: 0;
}

/* 多选框组样式 */
.permission-checkbox-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.permission-info {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.permission-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.permission-desc {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

/* 多选框样式 */
.permission-list :deep(.el-checkbox) {
  width: 100%;
  margin-right: 0;
  margin-bottom: 8px;
  padding: 10px 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.permission-list :deep(.el-checkbox.is-checked) {
  background-color: #f0f9eb;
  border-color: #67c23a;
}

.permission-list :deep(.el-checkbox__label) {
  font-size: 14px;
  color: #303133;
  padding-right: 0;
}

/* 权限头部样式 */
.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 10px;
}

/* 权限数量类名 */
.permission-count-success {
  background-color: #e1f3d8;
  color: #67c23a;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.permission-count-info {
  background-color: #e9ecef;
  color: #909399;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.permission-count-default {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .role-manage {
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

  .table-container {
    padding: 16px;
    border-radius: 8px;
  }
  
  .centered-table :deep(.el-table__body td) {
    padding: 12px 4px;
  }
}
</style>