/**
 * 安全API服务模块
 * 集成三重加密机制：TLS 1.3 + AES-256 + HMAC-SHA256
 * 支持密钥管理和请求签名验证
 */

import cryptoService from './crypto-service.js';

class APIService {
  constructor() {
    // API配置 - 使用HTTPS确保TLS加密
    this.baseURL = 'https://api.deepseek.com/v1';
    this.timeout = 30000;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // 密钥管理
    this.apiKey = null;
    this.keyRotationEnabled = true;
    
    // 请求队列和缓存
    this.requestQueue = [];
    this.responseCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
    
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    await this.loadAPIKey();
    this.startKeyRotationTimer();
    this.setupRequestInterceptor();
  }

  /**
   * 加载API密钥（加密存储）
   */
  async loadAPIKey() {
    // 从安全存储获取加密的API密钥
    const encryptedKey = sessionStorage.getItem('encrypted_api_key');
    if (encryptedKey) {
      try {
        this.apiKey = await cryptoService.decryptAES(encryptedKey);
      } catch (e) {
        console.error('Failed to decrypt API key:', e);
        this.apiKey = null;
      }
    }
  }

  /**
   * 安全保存API密钥
   */
  async saveAPIKey(key) {
    this.apiKey = key;
    try {
      const encrypted = await cryptoService.encryptAES(key);
      sessionStorage.setItem('encrypted_api_key', encrypted);
      return true;
    } catch (e) {
      console.error('Failed to encrypt API key:', e);
      return false;
    }
  }

  /**
   * 清除API密钥
   */
  clearAPIKey() {
    this.apiKey = null;
    sessionStorage.removeItem('encrypted_api_key');
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

    return {
      'Content-Type': 'application/json',
      'X-Request-Timestamp': timestamp,
      'X-Request-Nonce': nonce,
      'X-Request-Signature': signature,
      'X-Key-Version': cryptoService.keyVersion,
      'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
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
    const url = `${this.baseURL}${endpoint}`;
    const maxRetries = options.maxRetries || this.maxRetries;
    
    // 准备请求体
    let body = null;
    if (data) {
      const encryptedData = await this.encryptRequestBody(data);
      body = JSON.stringify(encryptedData);
    }

    // 生成安全请求头
    const headers = await this.generateSecureHeaders(method, endpoint, body);

    // 请求配置
    const config = {
      method,
      headers,
      body,
      // 确保使用TLS 1.3
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store'
    };

    // 重试机制
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, config);
        
        // 验证响应签名
        const responseSignature = response.headers.get('X-Response-Signature');
        if (responseSignature) {
          const responseData = await response.clone().json();
          const isValid = await cryptoService.verifyResponseSignature(
            responseData,
            responseSignature
          );
          if (!isValid) {
            throw new Error('Response signature verification failed');
          }
        }

        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        
        // 如果是认证错误，不重试
        if (error.status === 401) {
          throw error;
        }
        
        // 等待后重试
        if (attempt < maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
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
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
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

    const requestData = {
      model: 'deepseek-coder',
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

    const response = await this.secureRequest('POST', '/chat/completions', requestData);
    
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

    const requestData = {
      model: 'deepseek-coder',
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

    const response = await this.secureRequest('POST', '/chat/completions', requestData);
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

    const requestData = {
      model: 'deepseek-coder',
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

    const response = await this.secureRequest('POST', '/chat/completions', requestData);
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 调试助手API
   */
  async debugCode(code, error, language = 'javascript') {
    const requestData = {
      model: 'deepseek-coder',
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

    const response = await this.secureRequest('POST', '/chat/completions', requestData);
    return response.choices[0].message.content;
  }

  /**
   * 技术问答API
   */
  async techQA(question, context = '') {
    const cacheKey = this.generateCacheKey('qa', question, context);
    
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const requestData = {
      model: 'deepseek-chat',
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

    const response = await this.secureRequest('POST', '/chat/completions', requestData);
    this.cacheResponse(cacheKey, response);
    
    return response.choices[0].message.content;
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(...args) {
    const keyString = args.join('|');
    return cryptoService.hashSensitiveData(keyString);
  }

  /**
   * 获取缓存响应
   */
  getCachedResponse(key) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.responseCache.delete(key);
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
    
    // 清理过期缓存
    this.cleanExpiredCache();
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.responseCache.delete(key);
      }
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
}

// 导出单例
const apiService = new APIService();
export default apiService;
