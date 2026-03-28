<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="nav-left">
        <h1 class="app-title">📚 91AI小说生成器</h1>
      </div>
      <div class="nav-right">
        <el-button @click="showStatsDialog = true">
          <el-icon class="mr-2"><DataAnalysis /></el-icon>
          文章统计
        </el-button>
        <el-button @click="showCorpusDialog = true">
          <el-icon class="mr-2"><Collection /></el-icon>
          语料库
        </el-button>
        <el-button @click="showTemplateDialog = true">
          <el-icon class="mr-2"><Setting /></el-icon>
          模板管理
        </el-button>
        <el-button @click="showSummaryDialog = true">
          <el-icon class="mr-2"><Document /></el-icon>
          文章摘要
        </el-button>
        <el-button @click="showChapterManagerDialog = true">
          <el-icon class="mr-2"><Notebook /></el-icon>
          章节管理
        </el-button>
        <el-button @click="showWritingGoalsDialog = true">
          <el-icon class="mr-2"><Aim /></el-icon>
          写作目标
        </el-button>
        <el-button @click="showBackupDialog = true">
          <el-icon class="mr-2"><FolderOpened /></el-icon>
          备份管理
        </el-button>
        <el-button @click="showApiConfigDialog = true" :type="isApiConfigured ? 'success' : 'warning'">
          <el-icon class="mr-2"><Key /></el-icon>
          {{ isApiConfigured ? 'API已配置' : 'API配置' }}
        </el-button>
        <el-button @click="openAnnouncement" type="primary">
          <el-icon class="mr-2"><Bell /></el-icon>
          公告及教程
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="📝 创作设置" name="settings">
            <!-- 关键词输入 -->
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>🔑 关键词</span>
                </div>
              </template>
              <el-input
                v-model="keywords"
                placeholder="请输入小说关键词，如：玄幻、修仙、都市..."
                clearable
              />
            </el-card>

            <!-- 模板选择 -->
            <el-card shadow="hover" style="margin-top: 16px;">
              <template #header>
                <div class="card-header">
                  <span>📄 写作模板</span>
                </div>
              </template>
              <el-select 
                v-model="selectedTemplate" 
                placeholder="请选择写作模板"
                style="width: 100%"
                value-key="id"
                @change="handleTemplateChange"
              >
                <el-option
                  v-for="template in templates"
                  :key="template.id"
                  :label="template.name"
                  :value="template"
                >
                  <span>{{ template.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ template.description }}
                  </span>
                </el-option>
              </el-select>
            </el-card>

            <!-- 大纲区域 -->
            <el-card class="outline-card" style="margin-top: 16px;">
              <template #header>
                <div class="card-header">
                  <span>📋 小说大纲</span>
                  <div>
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="generateOutline"
                      :loading="isGeneratingOutline"
                      :disabled="!keywords.trim()"
                    >
                      {{ isGeneratingOutline ? '生成中...' : '生成大纲' }}
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="clearOutlineContent"
                      :disabled="!outline"
                    >
                      清空
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="outline-container">
                <el-input
                  v-model="outline"
                  type="textarea"
                  :rows="6"
                  placeholder="点击'生成大纲'按钮，AI将根据关键词为您生成小说大纲..."
                  resize="none"
                />
              </div>
            </el-card>

            <!-- 章节管理区域 -->
            <el-card class="chapters-card" v-if="chapters.length > 0" shadow="hover" style="margin-top: 16px;">
              <template #header>
                <div class="card-header">
                  <span>📖 章节管理</span>
                  <el-button 
                    type="success" 
                    size="small" 
                    @click="generateChapterContent"
                    :loading="isGeneratingChapter"
                    :disabled="!selectedChapter"
                  >
                    {{ isGeneratingChapter ? '生成中...' : '生成内容' }}
                  </el-button>
                </div>
              </template>
              <div class="chapters-container">
                <div class="chapters-list">
                  <div 
                    v-for="chapter in chapters" 
                    :key="chapter.id"
                    class="chapter-item"
                    :class="{ 'selected': selectedChapter?.id === chapter.id, 'completed': chapter.isCompleted }"
                    @click="selectChapter(chapter)"
                  >
                    <div class="chapter-title">{{ chapter.title }}</div>
                    <div class="chapter-status">
                      <el-tag v-if="chapter.isCompleted" type="success" size="small">已生成</el-tag>
                      <el-tag v-else type="info" size="small">待生成</el-tag>
                    </div>
                  </div>
                </div>
                <div v-if="selectedChapter" class="chapter-detail">
                  <div class="chapter-content">
                    <h4>{{ selectedChapter.title }}</h4>
                    <p>{{ selectedChapter.content }}</p>
                    <div v-if="selectedChapter.generatedText" class="generated-content">
                      <h5>生成的内容：</h5>
                      <div class="generated-text">{{ selectedChapter.generatedText }}</div>
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="addChapterToEditor"
                        style="margin-top: 10px;"
                      >
                        添加到编辑器
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- AI写作助手 -->
            <el-card class="ai-chat-card" shadow="hover" style="margin-top: 16px;">
              <template #header>
                <div class="card-header">
                  <span>🤖 AI写作助手</span>
                  <el-button 
                    size="small" 
                    @click="clearChatHistory"
                    :disabled="aiChatHistory.length === 0"
                  >
                    清空对话
                  </el-button>
                </div>
              </template>
              <div class="ai-chat-container">
                <div class="chat-history">
                  <div 
                    v-for="message in aiChatHistory" 
                    :key="message.id"
                    class="chat-message"
                    :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }"
                  >
                    <div class="message-content">{{ message.content }}</div>
                    <div class="message-time">{{ message.timestamp }}</div>
                  </div>
                  <div v-if="aiChatHistory.length === 0" class="empty-chat">
                    💡 向AI助手提问，获取写作建议和灵感
                  </div>
                </div>
                <div class="chat-input">
                  <el-input
                    v-model="currentChatInput"
                    placeholder="向AI助手提问...（如：如何让对话更生动？）"
                    @keyup.enter="sendChatMessage"
                    :disabled="isAiChatting"
                  >
                    <template #append>
                      <el-button 
                        @click="sendChatMessage"
                        :loading="isAiChatting"
                        :disabled="!currentChatInput.trim()"
                      >
                        发送
                      </el-button>
                    </template>
                  </el-input>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="🛠️ 写作工具" name="tools">
            <WritingTools />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中间编辑区 -->
      <div class="center-panel">
        <el-card class="editor-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>小说编辑区</span>
              <div>
                <el-button size="small" @click="generateContent" :loading="isGenerating" :disabled="!keywords.trim()">
                  {{ isGenerating ? '生成中...' : '生成内容' }}
                </el-button>
                <el-button size="small" @click="exportNovel">
                  导出
                </el-button>
                <el-button size="small" @click="clearNovel">
                  清空
                </el-button>
              </div>
            </div>
          </template>
          
          <!-- 生成状态提示 -->
          <div v-if="isGenerating || isGeneratingOutline || isGeneratingChapter" class="generation-status">
            <el-alert
              :title="getGenerationStatusText()"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="status-content">
                  <el-icon class="rotating"><Loading /></el-icon>
                  <span>{{ getGenerationStatusText() }}</span>
                </div>
              </template>
            </el-alert>
          </div>
          
          <div class="editor-container">
            <div class="editor-wrapper">
              <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
              />
              <Editor
                style="height: 400px; overflow-y: hidden;"
                v-model="currentNovel"
                :defaultConfig="editorConfig"
                mode="default"
                @onCreated="handleCreated"
              />
            </div>
            
            <!-- 编辑器底部工具栏 -->
            <div class="editor-toolbar">
              <div class="editor-stats">
                <span>字数: {{ wordCount }}</span>
                <span class="ml-2">预计阅读: {{ readingTime }}分钟</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧生成结果区 -->
      <div class="right-panel">
        <el-card class="result-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>生成结果</span>
              <div>
                <el-button 
                  size="small" 
                  @click="copyToClipboard"
                  :disabled="!generatedContent"
                >
                  复制
                </el-button>
                <el-button 
                  size="small" 
                  @click="addToNovel"
                  :disabled="!generatedContent"
                >
                  加入编辑区
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="result-container">
            <div v-if="generatedContent" class="generated-content">
              <div class="content-text">{{ generatedContent }}</div>
            </div>
            <div v-else class="empty-result">
              <p>暂无生成内容</p>
              <p class="empty-tip">输入关键词并点击生成按钮开始创作</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 文章统计对话框 -->
    <el-dialog v-model="showStatsDialog" title="文章统计" width="600px">
      <ArticleStats />
    </el-dialog>

    <!-- 语料库对话框 -->
    <el-dialog v-model="showCorpusDialog" title="语料库管理" width="800px">
      <CorpusManager />
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog v-model="showTemplateDialog" title="模板管理" width="900px">
      <TemplateManager />
    </el-dialog>

    <!-- API配置对话框 -->
    <el-dialog v-model="showApiConfigDialog" title="API配置" width="1000px">
      <ApiConfig />
    </el-dialog>

    <!-- 文章摘要对话框 -->
    <el-dialog v-model="showSummaryDialog" title="文章摘要" width="800px">
      <SummaryGenerator />
    </el-dialog>

    <!-- 章节管理对话框 -->
    <el-dialog v-model="showChapterManagerDialog" title="章节管理" width="1200px" top="5vh">
      <ChapterManager />
    </el-dialog>

    <!-- 写作目标对话框 -->
    <el-dialog v-model="showWritingGoalsDialog" title="写作目标" width="1000px">
      <WritingGoals />
    </el-dialog>

    <!-- 备份管理对话框 -->
    <el-dialog v-model="showBackupDialog" title="备份管理" width="1100px">
      <BackupManager />
    </el-dialog>

    <!-- 公告对话框 -->
    <AnnouncementDialog
      v-model:visible="showAnnouncementDialog"
      :announcement="currentAnnouncement"
      @close="handleAnnouncementClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef, onBeforeUnmount, watch } from 'vue'
import { useNovelStore } from '@/stores/novel'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Collection, Setting, Key, Document, Loading, Notebook, Aim, FolderOpened, Bell } from '@element-plus/icons-vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { createEditor, createToolbar } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import WritingTools from '../components/WritingTools.vue'
import ArticleStats from '@/components/ArticleStats.vue'
import CorpusManager from '@/components/CorpusManager.vue'
import TemplateManager from '@/components/TemplateManager.vue'
import ApiConfig from '@/components/ApiConfig.vue'
import SummaryGenerator from '@/components/SummaryGenerator.vue'
import ChapterManager from '@/components/ChapterManager.vue'
import WritingGoals from '@/components/WritingGoals.vue'
import BackupManager from '@/components/BackupManager.vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import { getLatestAnnouncement } from '@/config/announcements.js'

const novelStore = useNovelStore()

// 编辑器实例
const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = {
  placeholder: '在这里编辑您的小说内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/upload-image',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*']
    }
  }
}

// 响应式数据
const activeTab = ref('settings')
const selectedTemplate = computed({
  get: () => novelStore.selectedTemplate,
  set: (value) => novelStore.setTemplate(value)
})
const keywords = ref('')
const wordLimit = ref(500)
const creativity = ref('medium')
const showStatsDialog = ref(false)
const showCorpusDialog = ref(false)
const showTemplateDialog = ref(false)
const showApiConfigDialog = ref(false)
const showSummaryDialog = ref(false)
const showChapterManagerDialog = ref(false)
const showWritingGoalsDialog = ref(false)
const showBackupDialog = ref(false)
const showAnnouncementDialog = ref(false)
const currentAnnouncement = ref({})

// 新增章节和AI对话相关状态
const chapters = computed(() => novelStore.chapters)
const selectedChapter = computed(() => novelStore.selectedChapter)
const isGeneratingChapter = computed(() => novelStore.isGeneratingChapter)
const aiChatHistory = computed(() => novelStore.aiChatHistory)
const currentChatInput = computed({
  get: () => novelStore.currentChatInput,
  set: (value) => novelStore.setChatInput(value)
})
const isAiChatting = computed(() => novelStore.isAiChatting)

// 计算属性
const templates = computed(() => novelStore.templates)
const currentNovel = computed({
  get: () => novelStore.currentNovel,
  set: async (value) => await novelStore.setCurrentNovel(value)
})
const generatedContent = computed(() => novelStore.generatedContent)
const outline = computed(() => novelStore.outline)
const isGenerating = computed(() => novelStore.isGenerating)
const isGeneratingOutline = computed(() => novelStore.isGeneratingOutline)
const wordCount = computed(() => novelStore.wordCount)
const readingTime = computed(() => novelStore.readingTime)
const isApiConfigured = computed(() => novelStore.isApiConfigured)

// 监听模板变化，自动填充关键词
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate && newTemplate.keywords) {
    // 如果模板有关键词，自动填充到关键词输入框
    if (Array.isArray(newTemplate.keywords)) {
      // 如果是数组，转换为逗号分隔的字符串
      keywords.value = newTemplate.keywords.join('，')
    } else if (typeof newTemplate.keywords === 'string') {
      // 如果是字符串，直接使用
      keywords.value = newTemplate.keywords
    }
    ElMessage.success(`已应用模板：${newTemplate.name}`)
  }
}, { immediate: false })

// 方法
const handleTemplateChange = (template) => {
  // selectedTemplate是computed属性，会自动调用setTemplate
  console.log('模板已切换:', template?.name)
}

const clearInputs = () => {
  keywords.value = ''
  novelStore.setTemplate(null)
}

const generateOutline = async () => {
  if (!keywords.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }

  novelStore.setKeywords(keywords.value)

  try {
    if (isApiConfigured.value) {
      // 使用真实API流式生成大纲
      await novelStore.generateOutlineWithAPIStream(keywords.value)
      ElMessage.success('大纲生成成功！')
    } else {
      // 使用模拟数据
      novelStore.setGeneratingOutline(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const keywordList = keywords.value.split('，').map(k => k.trim())
      const template = selectedTemplate.value
      
      let generatedOutline = generateMockOutline(keywordList, template)
      
      novelStore.setOutline(generatedOutline)
      novelStore.parseOutlineToChapters()
      ElMessage.success('大纲生成成功！（使用模拟数据）')
      novelStore.setGeneratingOutline(false)
    }
  } catch (error) {
    ElMessage.error('大纲生成失败：' + error.message)
    if (!isApiConfigured.value) {
      novelStore.setGeneratingOutline(false)
    }
  }
}

// 选择章节
const selectChapter = (chapter) => {
  novelStore.setSelectedChapter(chapter)
}

// 生成章节内容
const generateChapterContent = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择章节')
    return
  }
  
  try {
    if (isApiConfigured.value) {
      // 使用真实API生成章节内容
      await novelStore.generateChapterWithAPI(selectedChapter.value)
      ElMessage.success('章节内容生成成功！')
    } else {
      // 使用模拟数据
      novelStore.setGeneratingChapter(true)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const chapterText = `${selectedChapter.value.title}

${selectedChapter.value.content}

这是根据大纲生成的详细章节内容。主角在这一章中经历了重要的转折点，故事情节紧张刺激，人物性格得到了进一步的发展和深化。通过精彩的对话和生动的场景描写，读者能够深入感受到故事的魅力和人物的内心世界。`
      
      novelStore.setChapterGenerated(selectedChapter.value.id, chapterText)
      // 同时更新右侧生成结果区的内容
      novelStore.setGeneratedContent(chapterText)
      ElMessage.success('章节内容生成成功！（使用模拟数据）')
      novelStore.setGeneratingChapter(false)
    }
  } catch (error) {
    ElMessage.error('生成章节内容失败：' + error.message)
    if (!isApiConfigured.value) {
      novelStore.setGeneratingChapter(false)
    }
  }
}

// AI对话功能
const sendChatMessage = async () => {
  if (!currentChatInput.value.trim()) {
    return
  }
  
  const userMessage = currentChatInput.value
  novelStore.addChatMessage(userMessage, true)
  novelStore.setChatInput('')
  
  try {
    if (isApiConfigured.value) {
      // 使用真实API进行对话
      await novelStore.sendChatMessageWithAPI(userMessage)
    } else {
      // 使用模拟数据
      novelStore.setAiChatting(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiResponse = `关于"${userMessage}"，我建议您可以从以下几个角度来发展情节：\n\n1. 人物心理描写：深入挖掘角色的内心世界\n2. 环境渲染：通过场景描写营造氛围\n3. 对话设计：让人物对话更加生动自然\n4. 情节转折：适当加入意外元素增加可读性\n\n您觉得哪个方向比较符合您的创作思路？`
      
      novelStore.addChatMessage(aiResponse, false)
      novelStore.setAiChatting(false)
    }
  } catch (error) {
    novelStore.addChatMessage('抱歉，AI助手暂时无法回应，请稍后再试。', false)
    if (!isApiConfigured.value) {
      novelStore.setAiChatting(false)
    }
  }
}

// 添加章节内容到编辑器
const addChapterToEditor = () => {
  if (!selectedChapter.value || !selectedChapter.value.generatedText) {
    ElMessage.warning('请先生成章节内容')
    return
  }
  
  const currentContent = editorRef.value.getHtml()
  const newContent = currentContent + '<br><br>' + selectedChapter.value.generatedText.replace(/\n/g, '<br>')
  editorRef.value.setHtml(newContent)
  novelStore.setCurrentNovel(newContent)
  ElMessage.success('章节内容已添加到编辑器')
}

const generateContent = async () => {
  if (!keywords.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }

  novelStore.setGenerating(true)
  novelStore.setKeywords(keywords.value)

  try {
    if (isApiConfigured.value) {
      // 使用真实API流式生成内容
      await novelStore.generateContentWithAPIStream(keywords.value, selectedTemplate.value, outline.value, wordLimit.value)
      ElMessage.success('内容生成成功！')
    } else {
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const keywordList = keywords.value.split('，').map(k => k.trim())
      const template = selectedTemplate.value
      const currentOutline = outline.value
      
      let generatedText = generateMockContent(keywordList, template, wordLimit.value, currentOutline)
      
      novelStore.setGeneratedContent(generatedText)
      ElMessage.success('内容生成成功！（使用模拟数据）')
    }
  } catch (error) {
    ElMessage.error('生成失败：' + error.message)
  } finally {
    novelStore.setGenerating(false)
  }
}

const generateMockOutline = (keywords, template) => {
  const outlineTemplates = {
    1: { // 玄幻小说
      structure: ['第一章：初入修仙界', '第二章：奇遇与机缘', '第三章：修炼之路', '第四章：面临挑战', '第五章：突破与成长']
    },
    2: { // 都市言情
      structure: ['第一章：初次相遇', '第二章：渐生情愫', '第三章：误会与分离', '第四章：重新认识', '第五章：携手未来']
    },
    3: { // 悬疑推理
      structure: ['第一章：案件发生', '第二章：初步调查', '第三章：线索梳理', '第四章：真相浮现', '第五章：水落石出']
    },
    4: { // 科幻未来
      structure: ['第一章：未来世界', '第二章：科技奇迹', '第三章：危机降临', '第四章：团结抗敌', '第五章：新的希望']
    },
    5: { // 历史穿越
      structure: ['第一章：意外穿越', '第二章：适应古代', '第三章：历史洪流', '第四章：改变命运', '第五章：功成身退']
    }
  }

  const templateId = template ? template.id : 1
  const structure = outlineTemplates[templateId].structure
  
  let outline = '# 小说大纲\n\n'
  outline += `## 主题关键词\n${keywords.join('、')}\n\n`
  outline += '## 章节结构\n\n'
  
  structure.forEach((chapter, index) => {
    outline += `### ${chapter}\n`
    outline += `- 主要情节：围绕"${keywords[index % keywords.length]}"展开\n`
    outline += `- 人物发展：主角在此阶段的成长变化\n`
    outline += `- 冲突设置：面临的主要挑战或矛盾\n\n`
  })
  
  return outline
}

const generateMockContent = (keywords, template, wordLimit, currentOutline) => {
  const templateStyles = {
    1: { // 玄幻小说
      opening: ['在这个充满灵气的世界里', '修仙之路漫漫', '天地间灵气涌动'],
      elements: ['修炼', '仙人', '法宝', '灵石', '境界', '天劫']
    },
    2: { // 都市言情
      opening: ['在这个繁华的都市中', '阳光透过落地窗洒进来', '咖啡厅里人来人往'],
      elements: ['爱情', '职场', '梦想', '坚持', '温暖', '成长']
    },
    3: { // 悬疑推理
      opening: ['夜色深沉，雨声淅沥', '案发现场一片狼藉', '真相往往隐藏在细节中'],
      elements: ['线索', '推理', '真相', '秘密', '调查', '揭露']
    },
    4: { // 科幻未来
      opening: ['2157年，人类已经征服了银河系', '量子计算机的光芒闪烁', '星际飞船划破虚空'],
      elements: ['科技', '未来', '星际', '人工智能', '探索', '进化']
    },
    5: { // 历史穿越
      opening: ['一阵眩晕过后，眼前的景象让人震惊', '古代的街道上人声鼎沸', '穿越到了另一个时代'],
      elements: ['古代', '穿越', '历史', '宫廷', '江湖', '命运']
    }
  }

  const style = template ? templateStyles[template.id] : templateStyles[1]
  const opening = style.opening[Math.floor(Math.random() * style.opening.length)]
  
  let content = opening + '。'
  
  // 根据关键词、模板和大纲生成内容
  if (currentOutline) {
    content += '根据既定大纲，故事按照预定的节奏发展。'
  }
  
  keywords.forEach(keyword => {
    content += `关于${keyword}的故事正在展开。`
  })
  
  // 添加模板相关元素
  const randomElements = style.elements.sort(() => 0.5 - Math.random()).slice(0, 3)
  randomElements.forEach(element => {
    content += `${element}在这个故事中扮演着重要的角色。`
  })
  
  // 确保字数符合要求
  while (content.length < wordLimit * 0.8) {
    content += '故事继续发展，情节愈发精彩。'
  }
  
  return content.substring(0, wordLimit)
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const addToNovel = async () => {
  await novelStore.addToNovel()
  ElMessage.success('已添加到编辑区')
}

const clearNovel = async () => {
  await novelStore.clearNovel()
  ElMessage.success('已清空编辑区')
}

const clearOutlineContent = () => {
  novelStore.clearOutline()
  novelStore.setSelectedChapter(null)
  ElMessage.success('已清空大纲')
}

// 清空AI对话历史
const clearChatHistory = () => {
  novelStore.clearChatHistory()
  ElMessage.success('对话历史已清空')
}

// 公告相关功能
const openAnnouncement = () => {
  try {
    currentAnnouncement.value = getLatestAnnouncement()
    showAnnouncementDialog.value = true
  } catch (error) {
    ElMessage.error('获取公告失败')
    console.error('获取公告错误:', error)
  }
}

const handleAnnouncementClose = () => {
  showAnnouncementDialog.value = false
}

const exportNovel = () => {
  if (!currentNovel.value.trim()) {
    ElMessage.warning('编辑区内容为空')
    return
  }
  
  const blob = new Blob([currentNovel.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `小说_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const generateSummary = () => {
  if (!currentNovel.value.trim()) {
    ElMessage.warning('请先输入小说内容')
    return
  }
  showSummaryDialog.value = true
}

const generateCover = () => {
  ElMessage.info('封面生成功能开发中...')
}

const generateToc = () => {
  if (!currentNovel.value.trim()) {
    ElMessage.warning('请先输入小说内容')
    return
  }
  ElMessage.info('目录生成功能开发中...')
}

// 获取生成状态文本
const getGenerationStatusText = () => {
  if (isGeneratingOutline.value) {
    return 'AI正在生成大纲，请稍候...'
  }
  if (isGeneratingChapter.value) {
    return 'AI正在生成章节内容，请稍候...'
  }
  if (isGenerating.value) {
    return 'AI正在生成内容，请稍候...'
  }
  return ''
}

// 编辑器相关方法
const handleCreated = (editor) => {
  editorRef.value = editor
}

onMounted(() => {
  // 阻止自动显示公告
  if (!localStorage.getItem('lastReadAnnouncementVersion')) {
    // 标记最新公告为已读
    const latestAnnouncement = getLatestAnnouncement()
    localStorage.setItem('lastReadAnnouncementVersion', latestAnnouncement.version)
  }
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})


</script>

<style scoped>
.home-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.top-nav {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-left .app-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
  display: flex;
  align-items: center;
}

.nav-right {
  display: flex;
  gap: 12px;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.left-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: calc(100vh - 92px); /* 减去顶部导航和padding的高度 */
}

.center-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 320px;
  flex-shrink: 0;
}

.input-card {
  flex-shrink: 0;
}

.outline-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-card,
.result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.generation-status {
  margin-bottom: 16px;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}

.generation-settings {
  margin-top: 8px;
}

.setting-label {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 4px;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.editor-wrapper .w-e-toolbar {
  border-bottom: 1px solid #e4e7ed !important;
}

.editor-wrapper .w-e-text-container {
  border: none !important;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.editor-stats {
  font-size: 14px;
  color: #909399;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 500px;
}

.generated-content {
  flex: 1;
  overflow-y: auto;
  max-height: 100%;
}

.content-text {
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 10px;
}

.empty-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-tip {
  font-size: 12px;
  margin-top: 8px;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* 左侧面板标签页样式优化 */
:deep(.left-panel .el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.left-panel .el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.left-panel .el-tab-pane) {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}

/* 优化各个卡片的高度 */
.left-panel .el-card {
  margin-bottom: 16px;
}

.left-panel .el-card:last-child {
  margin-bottom: 0;
}

/* 大纲卡片高度优化 */
.outline-card {
  min-height: 250px;
}

/* 章节管理卡片高度优化 */
.chapters-card {
  min-height: 300px;
}

/* AI对话卡片高度优化 */
.ai-chat-card {
  min-height: 350px;
}

.outline-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.outline-container .el-textarea {
  flex: 1;
}

.outline-container .el-textarea__inner {
  height: 100% !important;
  min-height: 200px;
}

/* 章节管理样式 */
.chapters-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.chapter-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.chapter-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.chapter-item.completed {
  background-color: #f0f9ff;
}

.chapter-title {
  font-weight: 500;
  color: #303133;
}

.chapter-detail {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  background-color: #fafafa;
}

.chapter-content h4 {
  margin: 0 0 8px 0;
  color: #409eff;
}

.chapter-content p {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
}

.generated-content {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.generated-content h5 {
  margin: 0 0 8px 0;
  color: #67c23a;
}

.generated-text {
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #303133;
}

/* AI对话样式 */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 300px;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
  background-color: #fafafa;
}

.chat-message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.user-message {
  background-color: #409eff;
  color: white;
  margin-left: auto;
  text-align: right;
}

.ai-message {
  background-color: #f0f0f0;
  color: #303133;
  margin-right: auto;
}

.message-content {
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.empty-chat {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
  font-style: italic;
}

.chat-input {
  margin-top: auto;
}

:deep(.el-textarea__inner) {
  resize: none;
}
</style>
