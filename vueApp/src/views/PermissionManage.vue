<template>
  <div class="permission-manage">
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="page-container">
      <div class="header">
        <h2>权限管理</h2>
        <div class="header-actions">
          <el-button type="success" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增权限
          </el-button>
          <el-button type="primary" @click="getPermissionList" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
      
      <div class="content-wrapper">
        <div class="table-container">
          <el-table 
            :data="permissionList" 
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
            <el-table-column prop="name" label="权限名称"  align="center" />
            <el-table-column prop="description" label="描述"  align="center" />
            <el-table-column prop="code" label="权限代码"  align="center" />
            <el-table-column prop="type" label="类型"  align="center" />
            <el-table-column prop="createdAt" label="创建时间"  align="center">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column 
              label="操作" 
              width="160" 
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
      </div>
    </div>

    <!-- 新增权限对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增权限"
      width="500px"
      :before-close="handleCloseAddDialog"
      center
      class="role-dialog"
    >
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input v-model="addForm.description" placeholder="请输入权限描述" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="addForm.code" placeholder="请输入权限代码" />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="addForm.type" placeholder="请选择权限类型" style="width: 100%">
            <el-option label="按钮" value="button" />
            <el-option label="菜单" value="menu" />
            <el-option label="页面" value="page" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdd" :loading="addLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑权限对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑权限"
      width="500px"
      :before-close="handleCloseEditDialog"
      center
      class="role-dialog"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input v-model="editForm.description" placeholder="请输入权限描述" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="editForm.code" placeholder="请输入权限代码" />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="editForm.type" placeholder="请选择权限类型" style="width: 100%">
            <el-option label="按钮" value="button" />
            <el-option label="菜单" value="menu" />
            <el-option label="页面" value="page" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="editLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { permissionApi } from '../api/api'
import { ref, onMounted, reactive } from 'vue'
import type { Permission } from '../api/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'

// 权限列表数据
const permissionList = ref<Permission[]>([])
const loading = ref<boolean>(false)

// 分页相关
const currentPage = ref<number>(1)
const pageSize = ref<number>(5)
const total = ref<number>(0)

// 编辑对话框相关
const editDialogVisible = ref<boolean>(false)
const editLoading = ref<boolean>(false)
const editFormRef = ref()

// 新增对话框相关
const addDialogVisible = ref<boolean>(false)
const addLoading = ref<boolean>(false)
const addFormRef = ref()

// 编辑表单数据
const editForm = reactive({
  _id: '',
  name: '',
  description: '',
  code: '',
  type: ''
})

// 新增表单数据
const addForm = reactive({
  name: '',
  description: '',
  code: '',
  type: ''
})

// 编辑表单验证规则
const editRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入权限描述', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ]
}

// 新增表单验证规则
const addRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入权限描述', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
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

// 获取权限列表
const getPermissionList = async () => {
  loading.value = true
  try {
    console.log('开始获取权限列表...')
    const res = await permissionApi.getPermissions({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    console.log('权限列表响应:', res)
    
    if (res.code === 200 && res.data) {
      console.log('权限数据:', res.data)
      permissionList.value = res.data
      // 更新分页信息
      if (res.pagination) {
        total.value = res.pagination.total
        currentPage.value = res.pagination.page
        pageSize.value = res.pagination.pageSize
      }
      console.log('权限列表已更新，当前数量:', permissionList.value.length)
    } else {
      console.error('获取权限列表失败:', res.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取权限列表错误:', error)
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getPermissionList()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  getPermissionList()
}

// 新增权限
const handleAdd = () => {
  console.log('新增权限')
  addDialogVisible.value = true
}

// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    const res = await permissionApi.addPermission({
      name: addForm.name,
      description: addForm.description,
      code: addForm.code,
      type: addForm.type
    })
    
    if (res.code === 200) {
      ElMessage.success('新增权限成功')
      addDialogVisible.value = false
      // 刷新权限列表
      await getPermissionList()
    } else {
      ElMessage.error(res.msg || '新增权限失败')
    }
  } catch (error) {
    console.error('新增权限错误:', error)
    ElMessage.error('新增权限失败')
  } finally {
    addLoading.value = false
  }
}

// 关闭新增对话框
const handleCloseAddDialog = () => {
  addDialogVisible.value = false
  // 重置表单
  addForm.name = ''
  addForm.description = ''
  addForm.code = ''
  addForm.type = ''
}

// 编辑权限
const handleEdit = (row: Permission) => {
  console.log('编辑权限:', row)
  // 填充编辑表单
  editForm._id = row._id
  editForm.name = row.name
  editForm.description = row.description
  editForm.code = row.code
  editForm.type = row.type
  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    editLoading.value = true
    
    const res = await permissionApi.updatePermission({
      _id: editForm._id,
      name: editForm.name,
      description: editForm.description,
      code: editForm.code,
      type: editForm.type
    })
    
    if (res.code === 200) {
      ElMessage.success('编辑权限成功')
      editDialogVisible.value = false
      // 刷新权限列表
      await getPermissionList()
    } else {
      ElMessage.error(res.msg || '编辑权限失败')
    }
  } catch (error) {
    console.error('编辑权限错误:', error)
    ElMessage.error('编辑权限失败')
  } finally {
    editLoading.value = false
  }
}

// 关闭编辑对话框
const handleCloseEditDialog = () => {
  editDialogVisible.value = false
  // 重置表单
  editForm._id = ''
  editForm.name = ''
  editForm.description = ''
  editForm.code = ''
  editForm.type = ''
}

// 删除权限
const handleDelete = async (row: Permission) => {
  console.log('删除权限:', row)
  
  try {
    await ElMessageBox.confirm(
      `确定要删除权限"${row.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const res = await permissionApi.deletePermission({ _id: row._id })
    
    if (res.code === 200) {
      ElMessage.success('删除权限成功')
      // 刷新权限列表
      await getPermissionList()
    } else {
      ElMessage.error(res.msg || '删除权限失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除权限错误:', error)
      ElMessage.error('删除权限失败')
    }
  }
}

onMounted(() => {
  getPermissionList()
})
</script>

<style scoped>
.permission-manage {
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

.page-container {
  width: 100%;
  max-width: none;
  margin: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;

}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #2c3e50 0%, #33475c 100%);
  color: white;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-wrapper {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  margin: 0 auto;
  margin-top: 20px;
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

/* 响应式设计 */
@media (max-width: 1600px) {
  .permission-manage {
    padding: 10px;
    width: 100%;
  }

  .breadcrumb-container {
    padding: 12px 20px;
    margin-bottom: 15px;
  }

  .page-container {
    margin: 0;
    border-radius: 8px;
  }

  .header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
  }

  .content-wrapper {
    padding: 16px;
  }

  .header h2 {
    font-size: 20px;
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
