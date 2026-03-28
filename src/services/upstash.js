import { Redis } from '@upstash/redis'

class UpstashService {
  constructor() {
    // 从localStorage或环境变量获取Upstash配置
    const config = this.loadConfig()
    if (config.url && config.token) {
      this.redis = new Redis({
        url: config.url,
        token: config.token
      })
      this.initialized = true
    } else {
      this.initialized = false
      console.warn('Upstash未配置，请在设置中配置Upstash连接信息')
    }
  }

  // 加载Upstash配置
  loadConfig() {
    try {
      // 优先从环境变量获取配置（Vercel部署时使用）
      const envUrl = import.meta.env.UPSTASH_URL
      const envToken = import.meta.env.UPSTASH_TOKEN
      
      if (envUrl && envToken) {
        console.log('从环境变量加载Upstash配置')
        return {
          url: envUrl,
          token: envToken
        }
      }
      
      // 从localStorage获取配置（本地开发时使用）
      const config = localStorage.getItem('upstashConfig')
      return config ? JSON.parse(config) : {}
    } catch (error) {
      console.error('加载Upstash配置失败:', error)
      return {}
    }
  }

  // 保存Upstash配置
  saveConfig(config) {
    try {
      localStorage.setItem('upstashConfig', JSON.stringify(config))
      this.redis = new Redis({
        url: config.url,
        token: config.token
      })
      this.initialized = true
    } catch (error) {
      console.error('保存Upstash配置失败:', error)
      this.initialized = false
    }
  }

  // 检查是否已配置
  isConfigured() {
    return this.initialized
  }

  // 生成用户唯一键前缀
  getUserKeyPrefix() {
    // 可以使用用户ID或其他唯一标识
    // 这里使用一个固定前缀，实际应用中应该使用用户唯一标识
    return 'user:'
  }

  // 保存数据
  async set(key, value, expiration = null) {
    if (!this.initialized) {
      console.warn('Upstash未初始化，无法保存数据')
      return false
    }

    try {
      const fullKey = this.getUserKeyPrefix() + key
      const options = expiration ? { ex: expiration } : {}
      await this.redis.set(fullKey, value, options)
      return true
    } catch (error) {
      console.error('保存数据失败:', error)
      return false
    }
  }

  // 获取数据
  async get(key) {
    if (!this.initialized) {
      console.warn('Upstash未初始化，无法获取数据')
      return null
    }

    try {
      const fullKey = this.getUserKeyPrefix() + key
      return await this.redis.get(fullKey)
    } catch (error) {
      console.error('获取数据失败:', error)
      return null
    }
  }

  // 删除数据
  async del(key) {
    if (!this.initialized) {
      console.warn('Upstash未初始化，无法删除数据')
      return false
    }

    try {
      const fullKey = this.getUserKeyPrefix() + key
      await this.redis.del(fullKey)
      return true
    } catch (error) {
      console.error('删除数据失败:', error)
      return false
    }
  }

  // 保存小说数据
  async saveNovel(novelId, novelData) {
    return await this.set(`novel:${novelId}`, novelData, 60 * 60 * 24 * 30) // 30天过期
  }

  // 获取小说数据
  async getNovel(novelId) {
    return await this.get(`novel:${novelId}`)
  }

  // 保存章节数据
  async saveChapter(novelId, chapterId, chapterData) {
    return await this.set(`novel:${novelId}:chapter:${chapterId}`, chapterData, 60 * 60 * 24 * 30)
  }

  // 获取章节数据
  async getChapter(novelId, chapterId) {
    return await this.get(`novel:${novelId}:chapter:${chapterId}`)
  }

  // 保存用户配置
  async saveUserConfig(config) {
    return await this.set('user:config', config, 60 * 60 * 24 * 365) // 1年过期
  }

  // 获取用户配置
  async getUserConfig() {
    return await this.get('user:config')
  }

  // 保存语料库
  async saveCorpus(corpus) {
    return await this.set('user:corpus', corpus, 60 * 60 * 24 * 365)
  }

  // 获取语料库
  async getCorpus() {
    return await this.get('user:corpus')
  }

  // 保存人物设定
  async saveCharacters(characters) {
    return await this.set('user:characters', characters, 60 * 60 * 24 * 365)
  }

  // 获取人物设定
  async getCharacters() {
    return await this.get('user:characters')
  }

  // 保存世界观设定
  async saveWorldSettings(settings) {
    return await this.set('user:worldSettings', settings, 60 * 60 * 24 * 365)
  }

  // 获取世界观设定
  async getWorldSettings() {
    return await this.get('user:worldSettings')
  }

  // 列出用户的所有小说
  async listNovels() {
    if (!this.initialized) {
      console.warn('Upstash未初始化，无法列出小说')
      return []
    }

    try {
      const prefix = this.getUserKeyPrefix() + 'novel:'
      const keys = await this.redis.keys(prefix + '*')
      const novels = []
      
      for (const key of keys) {
        const novelId = key.replace(prefix, '')
        const novel = await this.getNovel(novelId)
        if (novel) {
          novels.push({ id: novelId, ...novel })
        }
      }
      
      return novels
    } catch (error) {
      console.error('列出小说失败:', error)
      return []
    }
  }
}

export default new UpstashService()
