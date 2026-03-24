/**
 * 平台配置管理模块
 * 支持多种AI平台的API配置
 */

class PlatformConfig {
  constructor() {
    this.platforms = {
      alibaba: {
        name: '阿里云百炼',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        models: {
          default: 'deepseek-v3.2',
          options: ['deepseek-v3.2', 'qwen-max', 'qwen-plus']
        },
        apiKeyPattern: /^sk-\w{32}$/,
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          type: 'bearer',
          header: 'Authorization',
          format: 'Bearer {{apiKey}}'
        },
        endpoints: {
          chat: '/chat/completions'
        },
        tutorial: '/tools/api-key-tutorial.html#alibaba'
      },
      deepseek: {
        name: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        models: {
          default: 'deepseek-chat',
          options: ['deepseek-chat', 'deepseek-coder']
        },
        apiKeyPattern: /^sk-\w{40}$/,
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          type: 'bearer',
          header: 'Authorization',
          format: 'Bearer {{apiKey}}'
        },
        endpoints: {
          chat: '/chat/completions'
        },
        tutorial: '/tools/api-key-tutorial.html#deepseek'
      },
      openai: {
        name: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        models: {
          default: 'gpt-3.5-turbo',
          options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
        },
        apiKeyPattern: /^sk-[a-zA-Z0-9-]{20,}$/,
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          type: 'bearer',
          header: 'Authorization',
          format: 'Bearer {{apiKey}}'
        },
        endpoints: {
          chat: '/chat/completions'
        },
        tutorial: '/tools/api-key-tutorial.html#openai'
      },
      google: {
        name: 'Google AI',
        baseURL: 'https://generativelanguage.googleapis.com/v1',
        models: {
          default: 'gemini-1.5-flash',
          options: ['gemini-1.5-flash', 'gemini-1.5-pro']
        },
        apiKeyPattern: /^AIza[\w-]+$/,
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          type: 'query',
          param: 'key',
          format: '{{apiKey}}'
        },
        endpoints: {
          chat: '/models/{{model}}:generateContent'
        },
        tutorial: '/tools/api-key-tutorial.html#google'
      },
      anthropic: {
        name: 'Anthropic',
        baseURL: 'https://api.anthropic.com/v1',
        models: {
          default: 'claude-3-opus-20240229',
          options: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
        },
        apiKeyPattern: /^sk-ant-api03-\w+$/,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '{{apiKey}}',
          'anthropic-version': '2023-06-01'
        },
        auth: {
          type: 'header',
          header: 'x-api-key',
          format: '{{apiKey}}'
        },
        endpoints: {
          chat: '/messages'
        },
        tutorial: '/tools/api-key-tutorial.html#anthropic'
      }
    };
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig(platform) {
    return this.platforms[platform] || null;
  }

  /**
   * 获取所有支持的平台
   */
  getSupportedPlatforms() {
    return Object.keys(this.platforms).map(key => ({
      id: key,
      name: this.platforms[key].name
    }));
  }

  /**
   * 检测API密钥所属平台
   */
  detectPlatform(apiKey) {
    // 按优先级检测，避免模式冲突
    const detectionOrder = ['anthropic', 'google', 'openai', 'deepseek', 'alibaba'];
    
    for (const platform of detectionOrder) {
      const config = this.platforms[platform];
      if (config.apiKeyPattern.test(apiKey)) {
        return platform;
      }
    }
    return null;
  }

  /**
   * 获取平台的认证头
   */
  getAuthHeaders(platform, apiKey) {
    const config = this.getPlatformConfig(platform);
    if (!config) return {};

    const headers = { ...config.headers };
    
    // 替换headers中的apiKey
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string' && value.includes('{{apiKey}}')) {
        headers[key] = value.replace('{{apiKey}}', apiKey);
      }
    }

    // 处理认证
    if (config.auth.type === 'bearer') {
      headers[config.auth.header] = config.auth.format.replace('{{apiKey}}', apiKey);
    } else if (config.auth.type === 'header') {
      headers[config.auth.header] = config.auth.format.replace('{{apiKey}}', apiKey);
    }

    return headers;
  }

  /**
   * 获取API端点URL
   */
  getEndpointUrl(platform, endpoint, model = null) {
    const config = this.getPlatformConfig(platform);
    if (!config || !config.endpoints[endpoint]) return null;

    let url = `${config.baseURL}${config.endpoints[endpoint]}`;
    
    // 替换URL中的变量
    if (model) {
      url = url.replace('{{model}}', model);
    }

    return url;
  }

  /**
   * 获取平台的默认模型
   */
  getDefaultModel(platform) {
    const config = this.getPlatformConfig(platform);
    return config ? config.models.default : null;
  }

  /**
   * 获取平台的可用模型列表
   */
  getModelOptions(platform) {
    const config = this.getPlatformConfig(platform);
    return config ? config.models.options : [];
  }

  /**
   * 验证API密钥格式
   */
  validateApiKey(platform, apiKey) {
    const config = this.getPlatformConfig(platform);
    if (!config) return false;
    return config.apiKeyPattern.test(apiKey);
  }
}

// 导出单例
const platformConfig = new PlatformConfig();
export default platformConfig;