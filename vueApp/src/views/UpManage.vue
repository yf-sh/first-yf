<template>
  <div class="manager-manage">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        <el-breadcrumb-item>后台管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">管理员管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="handleAddManager" :icon="Plus">
          +新增管理员
        </el-button>
        <el-button type="primary" @click="getManagerList" :loading="loading" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>
    
    <!-- 表格容器 -->
    <div class="table-container">
      <el-table 
        :data="managerList" 
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
        <el-table-column prop="username" label="用户名" min-width="150" align="center" />
        <el-table-column label="角色" width="250" align="center">
          <template #default="scope">
            <el-tag 
              :type="getRoleTagType(scope.row.role)"
              size="small"
            >
              {{ getRoleName(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200" align="center">
          <template #default="scope">
            <span class="time-text">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column 
          label="操作" 
          width="200" 
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

    <!-- 新增管理员对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增管理员"
      width="700px"
      :before-close="handleCloseAddDialog"
      center
      class="manager-dialog"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="addForm.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="addForm.confirmPassword" 
            type="password" 
            placeholder="请确认密码" 
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select 
            v-model="addForm.role" 
            placeholder="请选择角色" 
            style="width: 100%"
            @change="handleRoleChange"
          >
            <el-option 
              v-for="role in roleList" 
              :key="role._id" 
              :label="role.name" 
              :value="role._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限设置">
          <div class="permission-section">
            <div class="permission-header">
              <span>角色权限设置</span>
              <span class="selected-count">已选择 {{ addForm.permissions.length }} 项</span>
              <div class="permission-actions">
                <el-checkbox 
                  v-model="selectAllPermissions" 
                  :indeterminate="isIndeterminate" 
                  @change="handleSelectAllPermissions"
                >
                  全选
                </el-checkbox>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="resetToRolePermissions"
                  :disabled="!addForm.role"
                >
                  重置为角色权限
                </el-button>
              </div>
            </div>
            <div class="permission-list">
              <el-checkbox-group v-model="addForm.permissions">
                <div 
                  v-for="permission in permissionList" 
                  :key="permission._id"
                  class="permission-item"
                >
                  <el-checkbox :label="permission._id">
                    {{ permission.name }}
                    <span class="permission-desc">{{ permission.description }}</span>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
              <div v-if="permissionList.length === 0" class="no-permissions">
                <el-empty description="暂无可用权限" />
              </div>
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

    <!-- 编辑管理员对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑管理员"
      width="700px"
      :before-close="handleCloseEditDialog"
      center
      class="manager-dialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="editForm.password" 
            type="password" 
            placeholder="请输入新密码（留空则不修改）" 
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select 
            v-model="editForm.role" 
            placeholder="请选择角色" 
            style="width: 100%"
            @change="handleEditRoleChange"
          >
            <el-option 
              v-for="role in roleList" 
              :key="role._id" 
              :label="role.name" 
              :value="role._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="权限设置">
          <div class="permission-section">
            <div class="permission-header">
              <span>角色权限设置</span>
              <span class="selected-count">已选择 {{ editForm.permissions.length }} 项</span>
              <div class="permission-actions">
                <el-checkbox 
                  v-model="editSelectAllPermissions" 
                  :indeterminate="editIsIndeterminate" 
                  @change="handleEditSelectAllPermissions"
                >
                  全选
                </el-checkbox>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="resetEditToRolePermissions"
                  :disabled="!editForm.role"
                >
                  重置为角色权限
                </el-button>
              </div>
            </div>
            <div class="permission-list">
              <el-checkbox-group v-model="editForm.permissions">
                <div 
                  v-for="permission in permissionList" 
                  :key="permission._id"
                  class="permission-item"
                >
                  <el-checkbox :label="permission._id">
                    {{ permission.name }}
                    <span class="permission-desc">{{ permission.description }}</span>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
              <div v-if="permissionList.length === 0" class="no-permissions">
                <el-empty description="暂无可用权限" />
              </div>
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
import { managerApi, roleApi, permissionApi } from '../api/api'
import type { Manager, ManagerAddParams, Role, Permission } from '../api/types'

// 管理员列表数据
const managerList = ref<Manager[]>([])
const loading = ref<boolean>(false)

// 角色和权限数据
const roleList = ref<Role[]>([])
// 权限列表
const permissionList = ref<Permission[]>([])
// 新增时选中的角色权限（用于临时存储）
const selectedRolePermissions = ref<Permission[]>([])
// 编辑时选中的角色权限（用于临时存储）
const selectedEditRolePermissions = ref<Permission[]>([])

// 权限全选相关
const selectAllPermissions = ref<boolean>(false)
const isIndeterminate = computed(() => {
  const selectedCount = addForm.permissions.length
  const totalCount = permissionList.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 编辑时权限全选相关
const editSelectAllPermissions = ref<boolean>(false)
const editIsIndeterminate = computed(() => {
  const selectedCount = editForm.permissions.length
  const totalCount = permissionList.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

// 存储角色对应的原始权限（用于重置）
const roleOriginalPermissions = ref<Map<string, string[]>>(new Map())

// 分页相关
const currentPage = ref<number>(1)
const pageSize = ref<number>(5)
const total = ref<number>(0)

// 新增对话框相关
const addDialogVisible = ref<boolean>(false)
const addLoading = ref<boolean>(false)
const addFormRef = ref()
const addForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: '',
  permissions: [] as string[]
})

// 编辑对话框相关
const editDialogVisible = ref<boolean>(false)
const editLoading = ref<boolean>(false)
const editFormRef = ref()
const editForm = reactive({
  _id: '',
  username: '',
  password: '',
  role: '',
  permissions: [] as string[]
})

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
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
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

// 获取角色名称
const getRoleName = (role: string | Role | undefined) => {
  if (!role) return '未分配'
  
  if (typeof role === 'string') {
    const roleObj = roleList.value.find(r => r._id === role)
    return roleObj ? roleObj.name : '未分配'
  } else {
    return role.name || '未分配'
  }
}

// 获取角色标签类型
const getRoleTagType = (role: string | Role | undefined) => {
  if (!role) return 'info'
  
  const roleName = getRoleName(role)
  switch (roleName) {
    case '超级管理员':
      return 'danger'
    case '视频审核员':
      return 'warning'
    case '运营维护员':
      return 'success'
    default:
      return 'info'
  }
}

// 获取权限数量
const getPermissionCount = (manager: Manager) => {
  // 如果管理员直接有关联权限，返回直接权限数量
  if (manager.permissions && Array.isArray(manager.permissions) && manager.permissions.length > 0) {
    return manager.permissions.length
  }
  
  // 如果管理员有角色，返回角色权限数量
  if (manager.role) {
    let roleObj: Role | undefined
    
    if (typeof manager.role === 'string') {
      roleObj = roleList.value.find(r => r._id === manager.role)
    } else {
      roleObj = manager.role as Role
    }
    
    if (roleObj && roleObj.permissions) {
      if (Array.isArray(roleObj.permissions)) {
        return roleObj.permissions.length
      }
    }
  }
  
  return 0
}

// 获取角色列表
const getRoleList = async () => {
  try {
    console.log('开始获取角色列表...')
    const res = await roleApi.getAllRoles()
    console.log('角色列表响应:', res)
    
    if (res.code === 200 && res.data) {
      roleList.value = res.data
      console.log('角色列表已更新，数量:', roleList.value.length)
      roleList.value.forEach((role, index) => {
        console.log(`角色 ${index + 1}: ${role.name} (${role._id})`)
      })
    } else {
      console.error('获取角色列表失败:', res.msg || '未知错误')
      ElMessage.error(res.msg || '获取角色列表失败')
    }
  } catch (error) {
    console.error('获取角色列表错误:', error)
    ElMessage.error('获取角色列表失败，请检查网络连接')
  }
}

// 获取权限列表
const getPermissionList = async () => {
  try {
    console.log('开始获取权限列表...')
    const res = await permissionApi.getAllPermissions()
    console.log('权限列表响应:', res)
    
    if (res.code === 200 && res.data) {
      permissionList.value = res.data
      console.log('权限列表已更新，数量:', permissionList.value.length)
      permissionList.value.forEach((permission, index) => {
        console.log(`权限 ${index + 1}: ${permission.name} (${permission._id})`)
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

// 重置为角色权限
const resetToRolePermissions = () => {
  if (!addForm.role) return
  
  const rolePermissions = roleOriginalPermissions.value.get(addForm.role)
  if (rolePermissions) {
    addForm.permissions = [...rolePermissions]
    
    // 更新全选状态
    selectAllPermissions.value = addForm.permissions.length === permissionList.value.length
  }
}

// 重置编辑为角色权限
const resetEditToRolePermissions = () => {
  if (!editForm.role) return
  
  const rolePermissions = roleOriginalPermissions.value.get(editForm.role)
  if (rolePermissions) {
    editForm.permissions = [...rolePermissions]
    
    // 更新全选状态
    editSelectAllPermissions.value = editForm.permissions.length === permissionList.value.length
  }
}

// 处理角色变化（新增）
const handleRoleChange = async (roleId: string) => {
  if (!roleId) {
    selectedRolePermissions.value = []
    addForm.permissions = []
    return
  }
  
  try {
    console.log('获取角色详情:', roleId)
    const res = await roleApi.getRoleDetail(roleId)
    console.log('角色详情响应:', res)
    
    if (res.code === 200 && res.data) {
      const roleDetail = res.data
      console.log('角色详情:', roleDetail)
      
      // 检查permissions是否为数组且包含权限对象
      if (Array.isArray(roleDetail.permissions) && roleDetail.permissions.length > 0) {
        let permissionIds: string[] = []
        
        // 如果是权限对象数组，提取ID
        if (typeof roleDetail.permissions[0] === 'object' && roleDetail.permissions[0]._id) {
          selectedRolePermissions.value = roleDetail.permissions as Permission[]
          permissionIds = (roleDetail.permissions as Permission[]).map(p => p._id)
          console.log('设置权限（对象数组）:', selectedRolePermissions.value.length, '个')
        } else {
          // 如果是权限ID数组，直接使用
          permissionIds = roleDetail.permissions as string[]
          selectedRolePermissions.value = permissionList.value.filter(p => 
            permissionIds.includes(p._id)
          )
          console.log('设置权限（ID数组）:', selectedRolePermissions.value.length, '个')
        }
        
        // 保存角色原始权限（用于重置）
        roleOriginalPermissions.value.set(roleId, [...permissionIds])
        
        // 设置表单权限
        addForm.permissions = [...permissionIds]
        
        // 更新全选状态
        selectAllPermissions.value = addForm.permissions.length === permissionList.value.length
      } else {
        selectedRolePermissions.value = []
        addForm.permissions = []
        roleOriginalPermissions.value.set(roleId, [])
        selectAllPermissions.value = false
        console.log('角色无权限')
      }
    } else {
      selectedRolePermissions.value = []
      addForm.permissions = []
      console.log('获取角色详情失败:', res.msg)
      ElMessage.error(res.msg || '获取角色详情失败')
    }
  } catch (error) {
    console.error('获取角色权限错误:', error)
    selectedRolePermissions.value = []
    addForm.permissions = []
    ElMessage.error('获取角色权限失败')
  }
}

// 处理角色变化（编辑）
const handleEditRoleChange = async (roleId: string) => {
  if (!roleId) {
    selectedEditRolePermissions.value = []
    editForm.permissions = []
    return
  }
  
  try {
    console.log('获取编辑角色详情:', roleId)
    const res = await roleApi.getRoleDetail(roleId)
    console.log('编辑角色详情响应:', res)
    
    if (res.code === 200 && res.data) {
      const roleDetail = res.data
      console.log('编辑角色详情:', roleDetail)
      
      // 检查permissions是否为数组且包含权限对象
      if (Array.isArray(roleDetail.permissions) && roleDetail.permissions.length > 0) {
        let permissionIds: string[] = []
        
        // 如果是权限对象数组，提取ID
        if (typeof roleDetail.permissions[0] === 'object' && roleDetail.permissions[0]._id) {
          selectedEditRolePermissions.value = roleDetail.permissions as Permission[]
          permissionIds = (roleDetail.permissions as Permission[]).map(p => p._id)
          console.log('设置编辑权限（对象数组）:', selectedEditRolePermissions.value.length, '个')
        } else {
          // 如果是权限ID数组，直接使用
          permissionIds = roleDetail.permissions as string[]
          selectedEditRolePermissions.value = permissionList.value.filter(p => 
            permissionIds.includes(p._id)
          )
          console.log('设置编辑权限（ID数组）:', selectedEditRolePermissions.value.length, '个')
        }
        
        // 保存角色原始权限（用于重置）
        roleOriginalPermissions.value.set(roleId, [...permissionIds])
        
        // 设置表单权限
        editForm.permissions = [...permissionIds]
        
        // 更新全选状态
        editSelectAllPermissions.value = editForm.permissions.length === permissionList.value.length
      } else {
        selectedEditRolePermissions.value = []
        editForm.permissions = []
        roleOriginalPermissions.value.set(roleId, [])
        editSelectAllPermissions.value = false
        console.log('编辑角色无权限')
      }
    } else {
      selectedEditRolePermissions.value = []
      editForm.permissions = []
      console.log('获取编辑角色详情失败:', res.msg)
      ElMessage.error(res.msg || '获取角色详情失败')
    }
  } catch (error) {
    console.error('获取编辑角色权限错误:', error)
    selectedEditRolePermissions.value = []
    editForm.permissions = []
    ElMessage.error('获取角色权限失败')
  }
}

// 获取管理员列表
const getManagerList = async () => {
  loading.value = true
  try {
    console.log('开始获取管理员列表...')
    const res = await managerApi.getManagers({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    console.log('管理员列表响应:', res)
    
    if (res.code === 200) {
      // 确保data是数组
      const data = Array.isArray(res.data) ? res.data : []
      console.log('管理员数据:', data)
      managerList.value = data
      
      // 更新分页信息
      if (res.pagination) {
        total.value = res.pagination.total || 0
        currentPage.value = res.pagination.page || 1
        pageSize.value = res.pagination.pageSize || 5
      }
      console.log('管理员列表已更新，当前数量:', managerList.value.length)
      console.log('分页信息:', { total: total.value, currentPage: currentPage.value, pageSize: pageSize.value })
    } else {
      console.error('获取管理员列表失败:', res.msg || '未知错误')
      ElMessage.error(res.msg || '获取管理员列表失败')
      managerList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取管理员列表错误:', error)
    ElMessage.error('获取管理员列表失败，请检查网络连接')
    managerList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getManagerList()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  getManagerList()
}

// 新增管理员
const handleAddManager = () => {
  addForm.username = ''
  addForm.password = ''
  addForm.confirmPassword = ''
  addForm.role = ''
  addForm.permissions = []
  selectedRolePermissions.value = []
  addDialogVisible.value = true
}

// 提交新增
const submitAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    console.log('提交新增管理员数据:', {
      username: addForm.username,
      password: addForm.password,
      role: addForm.role,
      permissions: addForm.permissions
    })
    
    const params: ManagerAddParams = {
      username: addForm.username,
      password: addForm.password,
      role: addForm.role || undefined,
      permissions: addForm.permissions.length > 0 ? addForm.permissions : undefined
    }
    
    console.log('调用API参数:', params)
    const res = await managerApi.addManager(params)
    console.log('API响应:', res)
    
    if (res.code === 200) {
      ElMessage.success('添加管理员成功')
      addDialogVisible.value = false
      getManagerList()
    } else {
      ElMessage.error(res.msg || '添加管理员失败')
    }
  } catch (error) {
    console.error('添加管理员错误:', error)
    ElMessage.error('添加管理员失败')
  } finally {
    addLoading.value = false
  }
}

// 关闭新增对话框
const handleCloseAddDialog = () => {
  addDialogVisible.value = false
}

// 编辑管理员
const handleEdit = async (row: Manager) => {
  editForm._id = row._id
  editForm.username = row.username
  editForm.password = row.password as string
  
  // 处理角色字段
  if (typeof row.role === 'string') {
    editForm.role = row.role
  } else if (row.role && typeof row.role === 'object') {
    editForm.role = row.role._id
  } else {
    editForm.role = ''
  }
  
  // 处理权限字段
  if (Array.isArray(row.permissions)) {
    if (row.permissions.length > 0 && typeof row.permissions[0] === 'object') {
      editForm.permissions = (row.permissions as Permission[]).map(p => p._id)
    } else {
      editForm.permissions = row.permissions as string[]
    }
  } else {
    editForm.permissions = []
  }
  
  // 设置编辑时的权限显示
  if (editForm.role) {
    await handleEditRoleChange(editForm.role)
  } else {
    selectedEditRolePermissions.value = []
  }
  
  // 处理密码字段
  if (row.password) {
    editForm.password = row.password
  } else {
    editForm.password = ''
  }

  editDialogVisible.value = true
}

// 提交编辑
const submitEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    editLoading.value = true
    
    const params = {
      _id: editForm._id,
      username: editForm.username,
      password: editForm.password,
      role: editForm.role,
      permissions: editForm.permissions
    }
    
    const res = await managerApi.updateManager(params)
    
    if (res.code === 200) {
      ElMessage.success('更新管理员成功')
      editDialogVisible.value = false
      getManagerList()
    } else {
      ElMessage.error(res.msg || '更新管理员失败')
    }
  } catch (error) {
    console.error('更新管理员错误:', error)
    ElMessage.error('更新管理员失败')
  } finally {
    editLoading.value = false
  }
}

// 关闭编辑对话框
const handleCloseEditDialog = () => {
  editDialogVisible.value = false
}

// 删除管理员
const handleDelete = async (row: Manager) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员 "${row.username}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const res = await managerApi.deleteManager({ _id: row._id })
    
    if (res.code === 200) {
      ElMessage.success('删除管理员成功')
      getManagerList()
    } else {
      ElMessage.error(res.msg || '删除管理员失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除管理员错误:', error)
      ElMessage.error('删除管理员失败')
    }
  }
}

// 页面加载时获取数据
onMounted(async () => {
  console.log('页面开始加载...')
  
  try {
    // 先获取角色和权限列表
    console.log('获取角色和权限列表...')
    await Promise.all([
      getRoleList(),
      getPermissionList()
    ])
    
    // 再获取管理员列表
    console.log('获取管理员列表...')
    await getManagerList()
    
    console.log('页面加载完成，当前数据状态:')
    console.log('管理员列表:', managerList.value)
    console.log('角色列表:', roleList.value)
    console.log('权限列表:', permissionList.value)
    
    // 验证数据
    if (roleList.value.length === 0) {
      console.warn('⚠️ 角色列表为空')
    }
    if (permissionList.value.length === 0) {
      console.warn('⚠️ 权限列表为空')
    }
    if (managerList.value.length === 0) {
      console.warn('⚠️ 管理员列表为空')
    }
  } catch (error) {
    console.error('页面加载失败:', error)
    ElMessage.error('页面加载失败，请刷新重试')
  }
})
</script>

<style scoped>
.manager-manage {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.centered-table :deep(.el-table__body) {
  width: 100% !important;
}

.centered-table :deep(.el-table__header) {
  width: 100% !important;
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

/* 权限设置样式 */
.permission-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 10px;
}

.permission-header span:first-child {
  font-weight: 600;
  color: #495057;
}

.selected-count {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

.permission-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.permission-list {
  max-height: 300px;
  overflow-y: auto;
}

.permission-item {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.permission-item:hover {
  background: #f8f9fa;
}

.permission-desc {
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
}

.no-permissions {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

/* 对话框样式 */
.manager-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.manager-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

.manager-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.manager-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.manager-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #f8f9fa;
}

/* 响应式设计 */
@media (max-width: 1600px) {
  .manager-manage {
    padding: 10px;
    width: 100%;
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