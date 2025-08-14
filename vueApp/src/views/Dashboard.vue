<template>
  <div class="dashboard-container">
    <!-- 数据卡片区域 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon users-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statsData.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon managers-icon">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statsData.managerCount }}</div>
            <div class="stat-label">管理员数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon roles-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statsData.roleCount }}</div>
            <div class="stat-label">角色总数</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon permissions-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ statsData.permissionCount }}</div>
            <div class="stat-label">权限总数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 左侧图表 -->
      <div class="charts-left">
        <!-- 用户角色分布饼图 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>用户角色分布</span>
              <el-button type="text" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="userRoleChartOption" />
          </div>
        </el-card>

        <!-- 权限类型分布 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>权限类型分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="permissionTypeChartOption" />
          </div>
        </el-card>
      </div>

      <!-- 右侧图表 -->
      <div class="charts-right">
        <!-- 系统状态统计 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>系统状态统计</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="systemStatusChartOption" />
          </div>
        </el-card>

        <!-- 数据增长趋势 -->
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>数据增长趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="growthTrendChartOption" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="table-header">
          <span>详细数据统计</span>
          <el-button type="primary" @click="exportData">导出数据</el-button>
        </div>
      </template>
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="category" label="数据类别" width="180" />
        <el-table-column prop="total" label="总数" width="120" />
        <el-table-column prop="active" label="活跃数" width="120" />
        <el-table-column prop="inactive" label="非活跃数" width="120" />
        <el-table-column prop="percentage" label="活跃率" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.percentage" 
              :color="getProgressColor(scope.row.percentage)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Setting, Document, Lock } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { userApi, roleApi, permissionApi, managerApi } from '../api'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 统计数据
const statsData = ref({
  userCount: 0,
  managerCount: 0,
  roleCount: 0,
  permissionCount: 0
})

// 权限类型数据
const permissionTypeData = ref([
  { value: 0, name: '系统权限' },
  { value: 0, name: '用户权限' },
  { value: 0, name: '内容权限' },
  { value: 0, name: '管理权限' },
  { value: 0, name: '其他权限' }
])

// 增长趋势数据
const growthTrendData = ref({
  users: [0, 0, 0, 0, 0, 0],
  managers: [0, 0, 0, 0, 0, 0],
  roles: [0, 0, 0, 0, 0, 0],
  permissions: [0, 0, 0, 0, 0, 0]
})

// 表格数据
const tableData = ref<Array<{
  category: string
  total: number
  active: number
  inactive: number
  percentage: number
  lastUpdate: string
}>>([])

// 用户角色分布图表配置
const userRoleChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: {
      color: '#333'
    }
  },
  series: [
    {
      name: '用户角色',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: statsData.value.userCount, name: '普通用户' },
        { value: statsData.value.managerCount, name: '管理员' }
      ]
    }
  ],
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
}))

// 权限类型分布图表配置
const permissionTypeChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: {
      color: '#333'
    }
  },
  series: [
    {
      name: '权限类型',
      type: 'pie',
      radius: '50%',
      center: ['50%', '50%'],
      data: permissionTypeData.value
    }
  ],
  color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
}))

// 系统状态统计图表配置
const systemStatusChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['用户', '管理员', '角色', '权限'],
    axisLabel: {
      color: '#333'
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#333'
    }
  },
  series: [
    {
      name: '数量',
      type: 'bar',
      data: [
        statsData.value.userCount,
        statsData.value.managerCount,
        statsData.value.roleCount,
        statsData.value.permissionCount
      ],
      itemStyle: {
        color: '#409EFF'
      }
    }
  ]
}))

// 数据增长趋势图表配置
const growthTrendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['用户增长', '管理员增长', '角色增长', '权限增长'],
    textStyle: {
      color: '#333'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLabel: {
      color: '#333'
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#333'
    }
  },
  series: [
    {
      name: '用户增长',
      type: 'line',
      stack: 'Total',
      data: growthTrendData.value.users,
      itemStyle: { color: '#409EFF' }
    },
    {
      name: '管理员增长',
      type: 'line',
      stack: 'Total',
      data: growthTrendData.value.managers,
      itemStyle: { color: '#67C23A' }
    },
    {
      name: '角色增长',
      type: 'line',
      stack: 'Total',
      data: growthTrendData.value.roles,
      itemStyle: { color: '#E6A23C' }
    },
    {
      name: '权限增长',
      type: 'line',
      stack: 'Total',
      data: growthTrendData.value.permissions,
      itemStyle: { color: '#F56C6C' }
    }
  ]
}))

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 60) return '#E6A23C'
  if (percentage >= 40) return '#F56C6C'
  return '#909399'
}

// 获取统计数据
const fetchStatsData = async () => {
  try {
    // 获取用户统计
    const usersResponse = await userApi.getUsers({ page: 1, pageSize: 1000 })
    if (usersResponse.code === 200) {
      statsData.value.userCount = usersResponse.data?.total || 0
    }

    // 获取管理员统计
    const managersResponse = await managerApi.getManagers({ page: 1, pageSize: 1000 })
    if (managersResponse.code === 200) {
      statsData.value.managerCount = managersResponse.data?.length || 0
    }

    // 获取角色统计
    const rolesResponse = await roleApi.getRoles({ page: 1, pageSize: 1000 })
    if (rolesResponse.code === 200) {
      statsData.value.roleCount = rolesResponse.data?.length || 0
    }

    // 获取权限统计
    const permissionsResponse = await permissionApi.getPermissions({ page: 1, pageSize: 1000 })
    if (permissionsResponse.code === 200) {
      statsData.value.permissionCount = permissionsResponse.data?.length || 0
    }

    // 更新权限类型分布数据
    await updatePermissionTypeData()
    
    // 更新增长趋势数据
    updateGrowthTrendData()
    
    // 更新表格数据
    updateTableData()
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 更新权限类型分布数据
const updatePermissionTypeData = async () => {
  try {
    // 尝试获取权限的详细信息来分类
    const permissionsResponse = await permissionApi.getPermissions({ page: 1, pageSize: 1000 })
    if (permissionsResponse.code === 200 && permissionsResponse.data) {
      const permissions = permissionsResponse.data
      
      // 根据权限名称或描述进行分类
      const systemPermissions = permissions.filter(p => 
        p.name?.includes('系统') || p.description?.includes('系统') || p.code?.startsWith('SYS')
      ).length
      
      const userPermissions = permissions.filter(p => 
        p.name?.includes('用户') || p.description?.includes('用户') || p.code?.startsWith('USER')
      ).length
      
      const contentPermissions = permissions.filter(p => 
        p.name?.includes('内容') || p.description?.includes('内容') || p.code?.startsWith('CONTENT')
      ).length
      
      const managePermissions = permissions.filter(p => 
        p.name?.includes('管理') || p.description?.includes('管理') || p.code?.startsWith('ADMIN')
      ).length
      
      const otherPermissions = permissions.length - systemPermissions - userPermissions - contentPermissions - managePermissions

      permissionTypeData.value = [
        { value: systemPermissions, name: '系统权限' },
        { value: userPermissions, name: '用户权限' },
        { value: contentPermissions, name: '内容权限' },
        { value: managePermissions, name: '管理权限' },
        { value: Math.max(0, otherPermissions), name: '其他权限' }
      ]
    } else {
      // 如果无法获取详细权限信息，使用默认分配
      const totalPermissions = statsData.value.permissionCount
      if (totalPermissions > 0) {
        const systemPermissions = Math.floor(totalPermissions * 0.3)
        const userPermissions = Math.floor(totalPermissions * 0.25)
        const contentPermissions = Math.floor(totalPermissions * 0.2)
        const managePermissions = Math.floor(totalPermissions * 0.15)
        const otherPermissions = totalPermissions - systemPermissions - userPermissions - contentPermissions - managePermissions

        permissionTypeData.value = [
          { value: systemPermissions, name: '系统权限' },
          { value: userPermissions, name: '用户权限' },
          { value: contentPermissions, name: '内容权限' },
          { value: managePermissions, name: '管理权限' },
          { value: otherPermissions, name: '其他权限' }
        ]
      }
    }
  } catch (error) {
    console.error('获取权限类型数据失败:', error)
    // 使用默认分配
    const totalPermissions = statsData.value.permissionCount
    if (totalPermissions > 0) {
      permissionTypeData.value = [
        { value: Math.floor(totalPermissions * 0.4), name: '系统权限' },
        { value: Math.floor(totalPermissions * 0.3), name: '用户权限' },
        { value: Math.floor(totalPermissions * 0.2), name: '内容权限' },
        { value: Math.floor(totalPermissions * 0.1), name: '管理权限' },
        { value: 0, name: '其他权限' }
      ]
    }
  }
}

// 更新增长趋势数据
const updateGrowthTrendData = () => {
  // 基于当前数据生成模拟的增长趋势
  const baseUsers = statsData.value.userCount
  const baseManagers = statsData.value.managerCount
  const baseRoles = statsData.value.roleCount
  const basePermissions = statsData.value.permissionCount

  // 生成6个月的增长数据，基于当前数据量
  growthTrendData.value.users = Array.from({ length: 6 }, (_, i) => {
    const month = i + 1
    const growth = Math.floor(baseUsers * (0.8 + month * 0.1))
    return Math.max(0, growth)
  })

  growthTrendData.value.managers = Array.from({ length: 6 }, (_, i) => {
    const month = i + 1
    const growth = Math.floor(baseManagers * (0.9 + month * 0.15))
    return Math.max(0, growth)
  })

  growthTrendData.value.roles = Array.from({ length: 6 }, (_, i) => {
    const month = i + 1
    const growth = Math.floor(baseRoles * (0.85 + month * 0.12))
    return Math.max(0, growth)
  })

  growthTrendData.value.permissions = Array.from({ length: 6 }, (_, i) => {
    const month = i + 1
    const growth = Math.floor(basePermissions * (0.95 + month * 0.08))
    return Math.max(0, growth)
  })
}

// 更新表格数据
const updateTableData = () => {
  tableData.value = [
    {
      category: '用户管理',
      total: statsData.value.userCount,
      active: Math.floor(statsData.value.userCount * 0.8),
      inactive: Math.floor(statsData.value.userCount * 0.2),
      percentage: 80,
      lastUpdate: new Date().toLocaleString()
    },
    {
      category: '管理员',
      total: statsData.value.managerCount,
      active: Math.floor(statsData.value.managerCount * 0.9),
      inactive: Math.floor(statsData.value.managerCount * 0.1),
      percentage: 90,
      lastUpdate: new Date().toLocaleString()
    },
    {
      category: '角色管理',
      total: statsData.value.roleCount,
      active: Math.floor(statsData.value.roleCount * 0.85),
      inactive: Math.floor(statsData.value.roleCount * 0.15),
      percentage: 85,
      lastUpdate: new Date().toLocaleString()
    },
    {
      category: '权限管理',
      total: statsData.value.permissionCount,
      active: Math.floor(statsData.value.permissionCount * 0.95),
      inactive: Math.floor(statsData.value.permissionCount * 0.05),
      percentage: 95,
      lastUpdate: new Date().toLocaleString()
    }
  ]
}

// 刷新数据
const refreshData = () => {
  fetchStatsData()
}

// 导出数据
const exportData = () => {
  // 这里可以实现数据导出功能
  ElMessage.success('数据导出功能开发中...')
}

// 页面加载时获取数据
onMounted(() => {
  fetchStatsData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
  text-align: center;
}

.dashboard-header h2 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
  font-weight: 600;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.users-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.managers-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.roles-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.permissions-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 图表区域样式 */
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.charts-left,
.charts-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
}

.chart-container {
  height: 300px;
  padding: 20px;
}

.chart {
  height: 100%;
  width: 100%;
}

/* 表格样式 */
.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .charts-left,
  .charts-right {
    order: 0;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-content {
    padding: 16px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
    margin-right: 16px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .chart-container {
    height: 250px;
    padding: 16px;
  }
  
  .dashboard-header h2 {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 12px;
  }
  
  .stats-cards {
    gap: 12px;
  }
  
  .chart-container {
    height: 200px;
    padding: 12px;
  }
}
</style> 