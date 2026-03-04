/**
 * ContentDetector 类 - 负责检测网站内容更新并自动刷新
 * 功能包括：版本检查、内容更新检测、自动刷新、错误处理
 */
class ContentDetector {
  constructor() {
    /**
     * 当前版本
     * @type {string|null}
     */
    this.currentVersion = null;
    
    /**
     * 最后检查时间
     * @type {string|null}
     */
    this.lastCheckedTime = null;
    
    /**
     * 检查间隔（毫秒）
     * @type {number}
     */
    this.checkInterval = 60000; // 60秒检查一次
    
    /**
     * 最大重试次数
     * @type {number}
     */
    this.maxRetries = 3;
    
    /**
     * 重试延迟（毫秒）
     * @type {number}
     */
    this.retryDelay = 5000;
    
    /**
     * 更新日志
     * @type {Array}
     */
    this.updateLog = [];
    
    /**
     * 是否正在检查
     * @type {boolean}
     */
    this.isChecking = false;
  }

  /**
   * 初始化检测器
   * @returns {Promise<void>}
   */
  async init() {
    try {
      await this.loadCurrentVersion();
      await this.loadUpdateLog();
      this.startAutoCheck();
      console.log('[ContentDetector] 初始化完成');
    } catch (error) {
      console.error('[ContentDetector] 初始化失败:', error);
      this.handleError(error, '初始化');
    }
  }

  /**
   * 加载当前版本信息
   * @returns {Promise<Object>} 版本信息对象
   */
  async loadCurrentVersion() {
    try {
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.currentVersion = data.version;
      this.lastCheckedTime = new Date().toISOString();
      
      console.log('[ContentDetector] 当前版本:', this.currentVersion);
      console.log('[ContentDetector] 最后更新:', data.lastUpdated);
      
      return data;
    } catch (error) {
      console.error('[ContentDetector] 加载版本信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否有更新
   * @returns {Promise<boolean>} 是否有新内容
   */
  async checkForUpdates() {
    if (this.isChecking) {
      console.log('[ContentDetector] 正在检查中，跳过本次检查');
      return false;
    }

    this.isChecking = true;
    
    try {
      const remoteVersion = await this.loadCurrentVersion();
      const localVersion = this.getStoredVersion();
      
      if (this.hasNewContent(remoteVersion, localVersion)) {
        console.log('[ContentDetector] 检测到新内容');
        await this.handleNewContent(remoteVersion);
        return true;
      } else {
        console.log('[ContentDetector] 无新内容');
        return false;
      }
    } catch (error) {
      console.error('[ContentDetector] 检查更新失败:', error);
      await this.handleError(error, '检查更新');
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * 检查是否有新内容
   * @param {Object} remoteVersion 远程版本
   * @param {string} localVersion 本地版本
   * @returns {boolean} 是否有新内容
   */
  hasNewContent(remoteVersion, localVersion) {
    if (!localVersion) {
      return true;
    }
    
    if (remoteVersion !== localVersion) {
      console.log('[ContentDetector] 版本不匹配:', {
        remote: remoteVersion,
        local: localVersion
      });
      return true;
    }
    
    return false;
  }

  /**
   * 获取存储的版本
   * @returns {string|null} 存储的版本
   */
  getStoredVersion() {
    return localStorage.getItem('site_version');
  }

  /**
   * 存储版本
   * @param {string} version 版本号
   */
  setStoredVersion(version) {
    localStorage.setItem('site_version', version);
    console.log('[ContentDetector] 保存版本:', version);
  }

  /**
   * 处理新内容
   * @param {string} newVersion 新版本
   * @returns {Promise<void>}
   */
  async handleNewContent(newVersion) {
    try {
      this.showUpdateNotification();
      
      const shouldAutoRefresh = await this.promptForRefresh();
      
      if (shouldAutoRefresh) {
        await this.refreshContent(newVersion);
      } else {
        this.setStoredVersion(newVersion);
      }
      
      await this.logUpdate(newVersion, '检测到新内容');
    } catch (error) {
      console.error('[ContentDetector] 处理新内容失败:', error);
      await this.handleError(error, '处理新内容');
    }
  }

  /**
   * 显示更新通知
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <div class="update-icon">🔄</div>
        <div class="update-message">
          <strong>发现新内容</strong>
          <p>网站有新的文章或更新，点击刷新查看最新内容</p>
        </div>
        <div class="update-actions">
          <button class="btn-refresh" onclick="window.contentDetector.refreshContent()">
            立即刷新
          </button>
          <button class="btn-later" onclick="window.contentDetector.dismissNotification()">
            稍后提醒
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  /**
   * 关闭通知
   */
  dismissNotification() {
    const notification = document.querySelector('.update-notification');
    if (notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }

  /**
   * 提示是否刷新
   * @returns {Promise<boolean>} 是否刷新
   */
  async promptForRefresh() {
    return new Promise((resolve) => {
      const autoRefresh = localStorage.getItem('auto_refresh');
      
      if (autoRefresh === 'true') {
        resolve(true);
        return;
      }
      
      const dialog = document.createElement('div');
      dialog.className = 'refresh-dialog';
      dialog.innerHTML = `
        <div class="refresh-dialog-content">
          <h3>发现新内容</h3>
          <p>网站有新的更新，是否立即刷新？</p>
          <div class="refresh-dialog-actions">
            <button class="btn-primary" id="btn-refresh-now">立即刷新</button>
            <button class="btn-secondary" id="btn-refresh-auto">自动刷新</button>
            <button class="btn-tertiary" id="btn-refresh-later">稍后</button>
          </div>
          <label class="refresh-remember">
            <input type="checkbox" id="remember-choice">
            记住我的选择
          </label>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      document.getElementById('btn-refresh-now').addEventListener('click', () => {
        const remember = document.getElementById('remember-choice').checked;
        if (remember) {
          localStorage.setItem('auto_refresh', 'false');
        }
        dialog.remove();
        resolve(true);
      });
      
      document.getElementById('btn-refresh-auto').addEventListener('click', () => {
        const remember = document.getElementById('remember-choice').checked;
        if (remember) {
          localStorage.setItem('auto_refresh', 'true');
        }
        dialog.remove();
        resolve(true);
      });
      
      document.getElementById('btn-refresh-later').addEventListener('click', () => {
        const remember = document.getElementById('remember-choice').checked;
        if (remember) {
          localStorage.setItem('auto_refresh', 'false');
        }
        dialog.remove();
        resolve(false);
      });
    });
  }

  /**
   * 刷新内容
   * @param {string} newVersion 新版本
   * @returns {Promise<void>}
   */
  async refreshContent(newVersion) {
    try {
      console.log('[ContentDetector] 开始刷新内容');
      
      this.showRefreshIndicator();
      
      await this.clearCache();
      
      await this.reloadPage();
      
      this.setStoredVersion(newVersion);
      
      await this.logUpdate(newVersion, '内容已刷新');
      
      console.log('[ContentDetector] 内容刷新完成');
    } catch (error) {
      console.error('[ContentDetector] 刷新内容失败:', error);
      await this.handleError(error, '刷新内容');
      this.showRefreshError(error);
    }
  }

  /**
   * 显示刷新指示器
   */
  showRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'refresh-indicator';
    indicator.innerHTML = `
      <div class="refresh-indicator-content">
        <div class="spinner"></div>
        <p>正在刷新内容...</p>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  /**
   * 隐藏刷新指示器
   */
  hideRefreshIndicator() {
    const indicator = document.querySelector('.refresh-indicator');
    if (indicator) {
      indicator.classList.add('hide');
      setTimeout(() => {
        indicator.remove();
      }, 300);
    }
  }

  /**
   * 显示刷新错误
   * @param {Error} error 错误对象
   */
  showRefreshError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'refresh-error';
    errorDiv.innerHTML = `
      <div class="refresh-error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <strong>刷新失败</strong>
          <p>${this.getErrorMessage(error)}</p>
        </div>
        <div class="error-actions">
          <button class="btn-retry" onclick="window.contentDetector.refreshContent()">
            重试
          </button>
          <button class="btn-manual" onclick="location.reload()">
            手动刷新
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.classList.add('show');
    }, 100);
  }

  /**
   * 获取错误消息
   * @param {Error} error 错误对象
   * @returns {string} 错误消息
   */
  getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return '网络连接失败，请检查网络连接';
    } else if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    } else if (error.message.includes('404')) {
      return '内容不存在，请检查网站地址';
    } else if (error.message.includes('500')) {
      return '服务器错误，请稍后重试';
    } else {
      return '刷新失败，请手动刷新页面';
    }
  }

  /**
   * 清除缓存
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[ContentDetector] 缓存已清除');
      }
      
      localStorage.removeItem('site_version');
      localStorage.removeItem('last_check_time');
      
    } catch (error) {
      console.error('[ContentDetector] 清除缓存失败:', error);
    }
  }

  /**
   * 重新加载页面
   * @returns {Promise<void>}
   */
  async reloadPage() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        location.reload();
        resolve();
      }, 500);
    });
  }

  /**
   * 启动自动检查
   */
  startAutoCheck() {
    console.log('[ContentDetector] 启动自动检查，间隔:', this.checkInterval / 1000, '秒');
    
    setInterval(async () => {
      await this.checkForUpdates();
    }, this.checkInterval);
  }

  /**
   * 停止自动检查
   */
  stopAutoCheck() {
    console.log('[ContentDetector] 停止自动检查');
  }

  /**
   * 加载更新日志
   * @returns {Promise<void>}
   */
  async loadUpdateLog() {
    try {
      const stored = localStorage.getItem('update_log');
      this.updateLog = stored ? JSON.parse(stored) : [];
      console.log('[ContentDetector] 加载更新日志:', this.updateLog.length, '条记录');
    } catch (error) {
      console.error('[ContentDetector] 加载更新日志失败:', error);
      this.updateLog = [];
    }
  }

  /**
   * 保存更新日志
   * @returns {Promise<void>}
   */
  async saveUpdateLog() {
    try {
      localStorage.setItem('update_log', JSON.stringify(this.updateLog));
      console.log('[ContentDetector] 保存更新日志');
    } catch (error) {
      console.error('[ContentDetector] 保存更新日志失败:', error);
    }
  }

  /**
   * 记录更新
   * @param {string} version 版本号
   * @param {string} action 操作
   * @returns {Promise<void>}
   */
  async logUpdate(version, action) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      version: version,
      action: action,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.updateLog.unshift(logEntry);
    
    if (this.updateLog.length > 50) {
      this.updateLog = this.updateLog.slice(0, 50);
    }
    
    await this.saveUpdateLog();
    
    console.log('[ContentDetector] 记录更新:', logEntry);
  }

  /**
   * 处理错误
   * @param {Error} error 错误对象
   * @param {string} context 上下文
   * @returns {Promise<void>}
   */
  async handleError(error, context) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context: context,
      error: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    let errorHistory = [];
    try {
      const stored = localStorage.getItem('error_log');
      errorHistory = stored ? JSON.parse(stored) : [];
    } catch (e) {
      errorHistory = [];
    }
    
    errorHistory.unshift(errorLog);
    
    if (errorHistory.length > 20) {
      errorHistory = errorHistory.slice(0, 20);
    }
    
    localStorage.setItem('error_log', JSON.stringify(errorHistory));
    
    console.error('[ContentDetector] 错误已记录:', errorLog);
  }

  /**
   * 获取更新历史
   * @returns {Array} 更新历史
   */
  getUpdateHistory() {
    return this.updateLog;
  }

  /**
   * 获取错误历史
   * @returns {Array} 错误历史
   */
  getErrorHistory() {
    try {
      const stored = localStorage.getItem('error_log');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取版本信息
   * @returns {Object} 版本信息
   */
  getVersionInfo() {
    return {
      current: this.currentVersion,
      stored: this.getStoredVersion(),
      lastChecked: this.lastCheckedTime
    };
  }

  /**
   * 强制检查更新
   * @returns {Promise<boolean>} 是否有新内容
   */
  async forceCheck() {
    console.log('[ContentDetector] 强制检查更新');
    return await this.checkForUpdates();
  }

  /**
   * 重置检测器
   * @returns {Promise<void>}
   */
  async reset() {
    console.log('[ContentDetector] 重置检测器');
    await this.clearCache();
    localStorage.removeItem('update_log');
    localStorage.removeItem('error_log');
    localStorage.removeItem('auto_refresh');
    this.updateLog = [];
    this.currentVersion = null;
    this.lastCheckedTime = null;
  }
}

window.ContentDetector = ContentDetector;