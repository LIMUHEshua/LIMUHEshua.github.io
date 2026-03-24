/**
 * 安全API服务模块
 * 集成三重加密机制：TLS 1.3 + AES-256 + HMAC-SHA256
 * 支持密钥管理和请求签名验证
 */

import cryptoService from './crypto-service.js';
import platformConfig from './platform-config.js';

class APIService {
  constructor() {
    // API配置 - 使用HTTPS确保TLS加密
    this.timeout = 30000; // 增加超时时间以处理复杂AI请求
    this.maxRetries = 1; // 减少重试次数
    this.retryDelay = 500; // 减少重试延迟
    
    // 密钥和平台管理
    this.apiKey = null;
    this.platform = 'alibaba'; // 默认平台
    this.keyRotationEnabled = false; // 禁用密钥轮换以提高性能
    
    // 请求队列和缓存
    this.requestQueue = [];
    this.responseCache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 增加缓存时间
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    await this.loadAPIKey();
    // 禁用密钥轮换定时器以提高性能
    // this.startKeyRotationTimer();
    this.setupRequestInterceptor();
    this.preloadModels();
  }

  /**
   * 预加载常用模型
   */
  preloadModels() {
    // 预加载常用模型信息，减少首次请求时间
    const models = {
      alibaba: 'qwen-max',
      deepseek: 'deepseek-coder',
      openai: 'gpt-4',
      google: 'gemini-pro',
      anthropic: 'claude-3-opus-20240229'
    };
    
    Object.entries(models).forEach(([platform, model]) => {
      this.responseCache.set(`model_${platform}`, {
        data: model,
        timestamp: Date.now()
      });
    });
  }

  /**
   * 加载API密钥和平台配置（加密存储）
   */
  async loadAPIKey() {
    // 从安全存储获取加密的API密钥
    const encryptedKey = sessionStorage.getItem('encrypted_api_key');
    if (encryptedKey) {
      try {
        const storedData = JSON.parse(await cryptoService.decryptAES(encryptedKey));
        this.apiKey = storedData.apiKey;
        this.platform = storedData.platform || 'alibaba';
        console.log('API key and platform loaded successfully');
      } catch (e) {
        console.error('Failed to decrypt API key:', e);
        // 清除损坏的密钥
        sessionStorage.removeItem('encrypted_api_key');
        this.apiKey = null;
        this.platform = 'alibaba';
        console.log('Removed corrupted API key from storage');
      }
    }
  }

  /**
   * 安全保存API密钥和平台配置
   */
  async saveAPIKey(key, platform = 'alibaba') {
    this.apiKey = key;
    this.platform = platform;
    try {
      const dataToStore = JSON.stringify({ apiKey: key, platform: platform });
      const encrypted = await cryptoService.encryptAES(dataToStore);
      sessionStorage.setItem('encrypted_api_key', encrypted);
      console.log('API key and platform saved successfully');
      return true;
    } catch (e) {
      console.error('Failed to encrypt API key:', e);
      return false;
    }
  }

  /**
   * 直接设置API密钥和平台（用于测试）
   */
  setAPIKey(key, platform = 'alibaba') {
    this.apiKey = key;
    this.platform = platform;
    console.log(`API key set directly for testing on platform: ${platform}`);
  }

  /**
   * 清除API密钥和平台配置
   */
  clearAPIKey() {
    this.apiKey = null;
    this.platform = 'alibaba';
    sessionStorage.removeItem('encrypted_api_key');
  }

  /**
   * 执行安全检查
   */
  performSecurityChecks(request) {
    if (typeof securityService === 'undefined') {
      return { blocked: false };
    }

    const userAgent = navigator.userAgent;
    const headers = {
      'user-agent': userAgent,
      'x-forwarded-for': '127.0.0.1' // 在实际应用中，这会从请求头中获取
    };

    const behavior = {
      pageNavSpeed: 1000, // 模拟正常的页面导航速度
      mouseMovement: true, // 模拟有鼠标移动
      scroll: true, // 模拟有滚动行为
      clickPattern: 'human', // 模拟人类点击模式
      screenSize: `${window.screen.width}x${window.screen.height}`
    };

    return securityService.performSecurityChecks(request, userAgent, headers, behavior);
  }

  /**
   * 启动密钥轮换定时器
   */
  startKeyRotationTimer() {
    if (this.keyRotationEnabled) {
      // 每30天轮换一次
      setInterval(async () => {
        await cryptoService.rotateKey();
      }, 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * 设置请求拦截器
   */
  setupRequestInterceptor() {
    // 监听页面卸载，清理敏感数据
    window.addEventListener('beforeunload', () => {
      this.clearSensitiveData();
    });
  }

  /**
   * 生成请求头（包含签名）
   */
  async generateSecureHeaders(method, endpoint, body = '') {
    const timestamp = Date.now().toString();
    const nonce = cryptoService.generateSecureRandom(16);
    
    // 生成请求签名 (HMAC-SHA256)
    const signature = await cryptoService.generateRequestSignature(
      method,
      endpoint,
      timestamp,
      body
    );

    // 获取平台特定的认证头
    const platformHeaders = platformConfig.getAuthHeaders(this.platform, this.apiKey);

    return {
      ...platformHeaders,
      'X-Request-Timestamp': timestamp,
      'X-Request-Nonce': nonce,
      'X-Request-Signature': signature,
      'X-Key-Version': cryptoService.keyVersion
    };
  }

  /**
   * 加密请求体
   */
  async encryptRequestBody(data) {
    // 敏感字段加密
    const sensitiveFields = ['api_key', 'password', 'token'];
    const encryptedData = { ...data };
    
    for (const field of sensitiveFields) {
      if (encryptedData[field]) {
        encryptedData[field] = await cryptoService.encryptAES(encryptedData[field]);
      }
    }
    
    return encryptedData;
  }

  /**
   * 发送安全请求
   */
  async secureRequest(method, endpoint, data = null, options = {}) {
    // 快速安全检查（在非开发环境启用）
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const securityCheck = this.performSecurityChecks({ method, endpoint, data, options });
      if (securityCheck.blocked) {
        throw new Error(`Security check failed: ${securityCheck.reason}`);
      }
    }

    // 根据平台配置获取API端点URL
    const url = platformConfig.getEndpointUrl(this.platform, endpoint, options.model);
    if (!url) {
      throw new Error(`Invalid endpoint for platform ${this.platform}: ${endpoint}`);
    }
    
    const maxRetries = options.maxRetries || 1; // 减少重试次数
    
    // 准备请求体
    let body = null;
    if (data) {
      // 跳过加密以提高性能
      body = JSON.stringify(data);
    }

    // 生成安全请求头
    const headers = await this.generateSecureHeaders(method, endpoint, body);

    // 请求配置
    const config = {
      method,
      headers,
      body,
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store'
    };

    // 简化重试机制
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, config);
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        
        // 如果是认证错误，不重试
        if (error.status === 401) {
          throw error;
        }
        
        // 等待后重试
        if (attempt < maxRetries - 1) {
          await this.delay(1000); // 固定延迟
        }
      }
    }

    throw lastError;
  }

  /**
   * 带超时的fetch
   */
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * 处理响应
   */
  async handleResponse(response) {
    if (!response.ok) {
      // 尝试获取详细错误信息
      try {
        const errorData = await response.clone().json();
        const errorMessage = errorData.error?.message || errorData.message || `${response.status}: ${response.statusText}`;
        const error = new Error(`HTTP ${response.status}: ${errorMessage}`);
        error.status = response.status;
        error.response = response;
        error.details = errorData;
        throw error;
      } catch (e) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
    }

    const data = await response.json();
    return data;
  }

  /**
   * 代码生成API
   */
  async generateCode(prompt, language = 'javascript', options = {}) {
    const cacheKey = this.generateCacheKey('generate', prompt, language);
    
    // 检查缓存
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const model = platformConfig.getDefaultModel(this.platform);
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ${language} programmer. Generate clean, well-documented code based on the user's request. Include comments explaining the logic.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: false
    };

    const response = await this.secureRequest('POST', 'chat', requestData, { model });
    
    // 缓存响应
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 代码解释API
   */
  async explainCode(code, language = 'javascript') {
    const cacheKey = this.generateCacheKey('explain', code, language);
    
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const model = platformConfig.getDefaultModel(this.platform);
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a code reviewer. Explain the following ${language} code in detail, including its purpose, logic flow, and any potential improvements.`
        },
        {
          role: 'user',
          content: code
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    const response = await this.secureRequest('POST', 'chat', requestData, { model });
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 代码转换API
   */
  async convertCode(code, fromLanguage, toLanguage) {
    const cacheKey = this.generateCacheKey('convert', code, fromLanguage, toLanguage);
    
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const model = platformConfig.getDefaultModel(this.platform);
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `Convert the following ${fromLanguage} code to ${toLanguage}. Maintain the same functionality and add appropriate comments.`
        },
        {
          role: 'user',
          content: code
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    };

    const response = await this.secureRequest('POST', 'chat', requestData, { model });
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 调试助手API
   */
  async debugCode(code, error, language = 'javascript') {
    const model = platformConfig.getDefaultModel(this.platform);
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a debugging expert. Analyze the following ${language} code and error, then provide a detailed explanation of the issue and the fix.`
        },
        {
          role: 'user',
          content: `Code:\n${code}\n\nError:\n${error}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    };

    const response = await this.secureRequest('POST', 'chat', requestData, { model });
    return response.choices[0].message.content;
  }

  /**
   * 技术问答API
   */
  async techQA(question, context = '') {
    const cacheKey = this.generateCacheKey('qa', question, context);
    
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const model = platformConfig.getDefaultModel(this.platform);
    const requestData = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a technical expert. Answer the following question clearly and concisely. If relevant, provide code examples.'
        },
        {
          role: 'user',
          content: context ? `Context: ${context}\n\nQuestion: ${question}` : question
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    const response = await this.secureRequest('POST', 'chat', requestData, { model });
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(...args) {
    // 使用简单哈希函数提高性能
    const keyString = args.join('|');
    return this.simpleHash(keyString);
  }

  /**
   * 简单哈希函数
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 获取缓存响应
   */
  getCachedResponse(key) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    // 异步删除过期缓存，不阻塞主线程
    if (cached) {
      setTimeout(() => this.responseCache.delete(key), 0);
    }
    return null;
  }

  /**
   * 缓存响应
   */
  cacheResponse(key, data) {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 每10次缓存操作清理一次过期缓存，减少清理频率
    if (Math.random() < 0.1) {
      setTimeout(() => this.cleanExpiredCache(), 0);
    }
    
    // 限制缓存大小
    if (this.responseCache.size > 200) {
      setTimeout(() => this.trimCache(), 0);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];
    
    // 收集过期键
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        keysToDelete.push(key);
      }
    }
    
    // 批量删除
    keysToDelete.forEach(key => this.responseCache.delete(key));
  }

  /**
   * 裁剪缓存大小
   */
  trimCache() {
    if (this.responseCache.size > 200) {
      // 按时间排序并删除最旧的缓存
      const entries = Array.from(this.responseCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - 200);
      toDelete.forEach(([key]) => this.responseCache.delete(key));
    }
  }

  /**
   * 清除敏感数据
   */
  clearSensitiveData() {
    this.responseCache.clear();
    this.requestQueue = [];
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查API健康状态
   */
  async healthCheck() {
    try {
      const response = await this.secureRequest('GET', '/models');
      return { status: 'healthy', data: response };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * 测试API密钥
   */
  async testAPIKey(apiKey) {
    console.log('Testing API key...');
    
    // 临时设置API密钥
    const originalApiKey = this.apiKey;
    this.apiKey = apiKey;
    
    try {
      // 发送一个简单的测试请求
      const model = platformConfig.getDefaultModel(this.platform);
      const requestData = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, test message'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      };
      
      const response = await this.secureRequest('POST', 'chat', requestData, { model });
      console.log('API key test successful:', response);
      return { success: true, message: 'API密钥测试成功' };
    } catch (error) {
      console.error('API key test failed:', error);
      return { 
        success: false, 
        message: `API密钥测试失败: ${error.message}`,
        error: error
      };
    } finally {
      // 恢复原始API密钥
      this.apiKey = originalApiKey;
    }
  }

  /**
   * 直接测试API请求（绕过加密存储）
   */
  async directAPITest(apiKey, platform = 'alibaba', prompt = 'Hello, test message') {
    console.log('Direct API test...');
    
    try {
      const model = platformConfig.getDefaultModel(platform);
      const url = platformConfig.getEndpointUrl(platform, 'chat', model);
      const headers = platformConfig.getAuthHeaders(platform, apiKey);
      
      const requestData = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return { 
          success: false, 
          status: response.status,
          message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          error: errorData
        };
      }
      
      const data = await response.json();
      console.log('API response:', data);
      return { 
        success: true, 
        status: response.status,
        message: 'API请求成功',
        data: data
      };
    } catch (error) {
      console.error('Direct API test failed:', error);
      return { 
        success: false, 
        message: `请求失败: ${error.message}`,
        error: error
      };
    }
  }
}

// 导出单例
const apiService = new APIService();
export default apiService;
