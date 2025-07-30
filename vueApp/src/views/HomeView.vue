<template>
    <div class="home_layout">
        <header>后台管理</header>
        <div class="home_content">
            <div class="home_menu">
                <el-radio-group v-model="isCollapse" style="margin-bottom: 20px">
                    <el-radio-button :value="false">expand</el-radio-button>
                    <el-radio-button :value="true">collapse</el-radio-button>
                </el-radio-group>
                <el-menu 
                default-active="2" 
                class="el-menu-vertical-demo" 
                :collapse="isCollapse" 
                @open="handleOpen"
                @close="handleClose"
                router="true"
                >
                    <el-menu-item index="/first">
                        <template #title>
                            <el-icon>
                                <location />
                            </el-icon>
                            <span>首页概况</span>
                        </template></el-menu-item>
                    <el-sub-menu index="1">
                        <template #title>
                            <el-icon>
                                <location />
                            </el-icon>
                            <span>用户管理</span>
                        </template>
                        <el-menu-item index="/users">普通用户管理</el-menu-item>
                        <el-menu-item index="/up">主播管理</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="2">
                        <template #title>
                            <el-icon>
                                <location />
                            </el-icon>
                            <span>内容管理</span>
                        </template>
                        <el-menu-item index="/clip">视频管理</el-menu-item>
                        <el-menu-item index="/live">直播管理</el-menu-item>
                    </el-sub-menu>

                </el-menu>
            </div>
            <div>
                <router-view></router-view>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
    Document,
    Menu as IconMenu,
    Location,
    Setting,
} from '@element-plus/icons-vue'

const isCollapse = ref(true)
const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const router = useRouter()

</script>

<style>
* {
    margin: 0;
    padding: 0;
}

.home_layout {
    height: 100vh;
}

.home_content {
    display: flex;
}

.home_menu {
    width: 200px;
    height: 100%;
    /* background-color: #f0f0f0; */
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
}
</style>