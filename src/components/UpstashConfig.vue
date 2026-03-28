<template>
  <el-card class="upstash-config-card">
    <template #header>
      <div class="card-header">
        <span>Upstash 配置</span>
      </div>
    </template>
    
    <el-form :model="upstashForm" label-width="80px">
      <el-form-item label="Upstash URL">
        <el-input 
          v-model="upstashForm.url" 
          placeholder="请输入 Upstash Redis URL"
          style="width: 100%"
          :disabled="isUsingEnvVars"
        />
      </el-form-item>
      
      <el-form-item label="Upstash Token">
        <el-input 
          v-model="upstashForm.token" 
          type="password"
          placeholder="请输入 Upstash Redis Token"
          style="width: 100%"
          :disabled="isUsingEnvVars"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="saveConfig" :loading="isSaving" :disabled="isUsingEnvVars">
          保存配置
        </el-button>
        <el-button @click="resetConfig" :disabled="isUsingEnvVars">
          重置
        </el-button>
      </el-form-item>
      
      <el-alert
        v-if="isUsingEnvVars"
        title="当前使用环境变量中的Upstash配置（Vercel部署）"
        type="info"
        :closable="false"
        style="margin-top: 10px"
      />
      
      <el-alert
        v-else-if="isUpstashConfigured"
        title="Upstash 已配置"
        type="success"
        :closable="false"
        style="margin-top: 10px"
      />
      
      <el-alert
        v-else
        title="Upstash 未配置"
        type="warning"
        :closable="false"
        style="margin-top: 10px"
      />
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useNovelStore } from '../stores/novel.js'
import { ElMessage } from 'element-plus'

const novelStore = useNovelStore()
const isSaving = ref(false)
const isUsingEnvVars = ref(false)

const upstashForm = ref({
  url: novelStore.upstashConfig.url || '',
  token: novelStore.upstashConfig.token || ''
})

const isUpstashConfigured = computed(() => novelStore.isUpstashConfigured)

// 检查是否使用环境变量
const checkEnvVars = () => {
  const envUrl = import.meta.env.VITE_UPSTASH_URL
  const envToken = import.meta.env.VITE_UPSTASH_TOKEN
  isUsingEnvVars.value = !!envUrl && !!envToken
}

// 监听store中的配置变化，同步到表单
watch(
  () => novelStore.upstashConfig,
  (newConfig) => {
    upstashForm.value = {
      url: newConfig.url || '',
      token: newConfig.token || ''
    }
  },
  { deep: true }
)

const saveConfig = async () => {
  if (isUsingEnvVars.value) {
    ElMessage.info('当前使用环境变量配置，无法在界面修改')
    return
  }
  
  isSaving.value = true
  try {
    novelStore.updateUpstashConfig(upstashForm.value)
    await novelStore.saveCorpusToUpstash()
    ElMessage.success('Upstash配置保存成功')
  } catch (error) {
    console.error('保存Upstash配置失败:', error)
    ElMessage.error('保存失败，请检查网络连接')
  } finally {
    isSaving.value = false
  }
}

const resetConfig = () => {
  if (isUsingEnvVars.value) {
    ElMessage.info('当前使用环境变量配置，无法重置')
    return
  }
  
  upstashForm.value = {
    url: '',
    token: ''
  }
}

// 初始化时检查环境变量
onMounted(() => {
  checkEnvVars()
})
</script>

<style scoped>
.upstash-config-card {
  margin: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
