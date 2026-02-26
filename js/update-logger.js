class UpdateLogger {
  constructor() {
    this.logContainer = null;
    this.isInitialized = false;
  }

  init() {
    try {
      this.createLogContainer();
      this.loadLogs();
      this.isInitialized = true;
      console.log('[UpdateLogger] 初始化完成');
    } catch (error) {
      console.error('[UpdateLogger] 初始化失败:', error);
    }
  }

  createLogContainer() {
    const container = document.createElement('div');
    container.className = 'update-logger-container';
    container.innerHTML = `
      <div class="update-logger-header">
        <h3>更新日志</h3>
        <div class="logger-actions">
          <button class="btn-export" onclick="window.updateLogger.exportLogs()">
            导出日志
          </button>
          <button class="btn-clear" onclick="window.updateLogger.clearLogs()">
            清除日志
          </button>
          <button class="btn-close" onclick="window.updateLogger.toggleLogger()">
            关闭
          </button>
        </div>
      </div>
      <div class="update-logger-content">
        <div class="log-filters">
          <label>
            <input type="checkbox" id="filter-updates" checked>
            更新记录
          </label>
          <label>
            <input type="checkbox" id="filter-errors" checked>
            错误记录
          </label>
        </div>
        <div class="log-list" id="log-list"></div>
      </div>
    `;

    document.body.appendChild(container);
    this.logContainer = container;

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('filter-updates').addEventListener('change', () => {
      this.filterLogs();
    });

    document.getElementById('filter-errors').addEventListener('change', () => {
      this.filterLogs();
    });
  }

  async loadLogs() {
    try {
      const updateLogs = await this.getUpdateLogs();
      const errorLogs = await this.getErrorLogs();
      
      this.displayLogs(updateLogs, errorLogs);
      
      console.log('[UpdateLogger] 加载日志:', {
        updates: updateLogs.length,
        errors: errorLogs.length
      });
    } catch (error) {
      console.error('[UpdateLogger] 加载日志失败:', error);
      this.showError('加载日志失败');
    }
  }

  async getUpdateLogs() {
    try {
      const stored = localStorage.getItem('update_log');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[UpdateLogger] 获取更新日志失败:', error);
      return [];
    }
  }

  async getErrorLogs() {
    try {
      const stored = localStorage.getItem('error_log');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[UpdateLogger] 获取错误日志失败:', error);
      return [];
    }
  }

  displayLogs(updateLogs, errorLogs) {
    const logList = document.getElementById('log-list');
    logList.innerHTML = '';

    const showUpdates = document.getElementById('filter-updates').checked;
    const showErrors = document.getElementById('filter-errors').checked;

    if (!showUpdates && !showErrors) {
      logList.innerHTML = '<div class="log-empty">请选择要显示的日志类型</div>';
      return;
    }

    if (showUpdates && updateLogs.length === 0) {
      logList.innerHTML += '<div class="log-empty">暂无更新记录</div>';
    }

    if (showErrors && errorLogs.length === 0) {
      logList.innerHTML += '<div class="log-empty">暂无错误记录</div>';
    }

    if (showUpdates) {
      const updatesSection = document.createElement('div');
      updatesSection.className = 'log-section';
      updatesSection.innerHTML = '<h4>更新记录</h4>';
      
      updateLogs.forEach(log => {
        const logItem = this.createLogItem(log, 'update');
        updatesSection.appendChild(logItem);
      });
      
      logList.appendChild(updatesSection);
    }

    if (showErrors) {
      const errorsSection = document.createElement('div');
      errorsSection.className = 'log-section';
      errorsSection.innerHTML = '<h4>错误记录</h4>';
      
      errorLogs.forEach(log => {
        const logItem = this.createLogItem(log, 'error');
        errorsSection.appendChild(logItem);
      });
      
      logList.appendChild(errorsSection);
    }
  }

  createLogItem(log, type) {
    const item = document.createElement('div');
    item.className = `log-item log-item-${type}`;
    
    const timestamp = new Date(log.timestamp).toLocaleString('zh-CN');
    const icon = type === 'update' ? '✅' : '❌';
    
    item.innerHTML = `
      <div class="log-item-header">
        <span class="log-icon">${icon}</span>
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-type">${type === 'update' ? '更新' : '错误'}</span>
      </div>
      <div class="log-item-content">
        <div class="log-version">版本: ${log.version || 'N/A'}</div>
        <div class="log-action">${log.action}</div>
        ${log.context ? `<div class="log-context">上下文: ${log.context}</div>` : ''}
        ${log.error ? `<div class="log-error-message">错误: ${log.error}</div>` : ''}
      </div>
      ${log.userAgent ? `<div class="log-useragent">用户代理: ${this.truncateUserAgent(log.userAgent)}</div>` : ''}
      ${log.url ? `<div class="log-url">URL: ${log.url}</div>` : ''}
    `;
    
    return item;
  }

  truncateUserAgent(userAgent) {
    const maxLength = 100;
    if (userAgent.length <= maxLength) {
      return userAgent;
    }
    return userAgent.substring(0, maxLength) + '...';
  }

  filterLogs() {
    this.loadLogs();
  }

  async exportLogs() {
    try {
      const updateLogs = await this.getUpdateLogs();
      const errorLogs = await this.getErrorLogs();
      
      const exportData = {
        exportTime: new Date().toISOString(),
        updateLogs: updateLogs,
        errorLogs: errorLogs
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `update-logs-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[UpdateLogger] 日志已导出');
      this.showSuccess('日志已导出');
    } catch (error) {
      console.error('[UpdateLogger] 导出日志失败:', error);
      this.showError('导出日志失败');
    }
  }

  async clearLogs() {
    if (!confirm('确定要清除所有日志吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      localStorage.removeItem('update_log');
      localStorage.removeItem('error_log');
      
      await this.loadLogs();
      
      console.log('[UpdateLogger] 日志已清除');
      this.showSuccess('日志已清除');
    } catch (error) {
      console.error('[UpdateLogger] 清除日志失败:', error);
      this.showError('清除日志失败');
    }
  }

  toggleLogger() {
    if (this.logContainer) {
      this.logContainer.classList.toggle('show');
    }
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  async addLog(logData) {
    try {
      let logs = [];
      
      if (logData.type === 'update') {
        logs = await this.getUpdateLogs();
        logs.unshift(logData);
        
        if (logs.length > 50) {
          logs = logs.slice(0, 50);
        }
        
        localStorage.setItem('update_log', JSON.stringify(logs));
      } else if (logData.type === 'error') {
        logs = await this.getErrorLogs();
        logs.unshift(logData);
        
        if (logs.length > 20) {
          logs = logs.slice(0, 20);
        }
        
        localStorage.setItem('error_log', JSON.stringify(logs));
      }
      
      console.log('[UpdateLogger] 日志已添加:', logData);
    } catch (error) {
      console.error('[UpdateLogger] 添加日志失败:', error);
    }
  }

  getStats() {
    return new Promise(async (resolve) => {
      try {
        const updateLogs = await this.getUpdateLogs();
        const errorLogs = await this.getErrorLogs();
        
        const stats = {
          totalUpdates: updateLogs.length,
          totalErrors: errorLogs.length,
          lastUpdate: updateLogs.length > 0 ? updateLogs[0].timestamp : null,
          lastError: errorLogs.length > 0 ? errorLogs[0].timestamp : null,
          updateFrequency: this.calculateUpdateFrequency(updateLogs),
          errorRate: this.calculateErrorRate(updateLogs, errorLogs)
        };
        
        resolve(stats);
      } catch (error) {
        console.error('[UpdateLogger] 获取统计信息失败:', error);
        resolve(null);
      }
    });
  }

  calculateUpdateFrequency(updateLogs) {
    if (updateLogs.length < 2) {
      return 'N/A';
    }
    
    const firstUpdate = new Date(updateLogs[updateLogs.length - 1].timestamp);
    const lastUpdate = new Date(updateLogs[0].timestamp);
    const daysDiff = (lastUpdate - firstUpdate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) {
      return '1天内多次';
    }
    
    const frequency = daysDiff / updateLogs.length;
    
    if (frequency < 1) {
      return '每天多次';
    } else if (frequency < 7) {
      return '每周';
    } else if (frequency < 30) {
      return '每月';
    } else {
      return '不定期';
    }
  }

  calculateErrorRate(updateLogs, errorLogs) {
    if (updateLogs.length === 0) {
      return 'N/A';
    }
    
    const errorRate = (errorLogs.length / updateLogs.length * 100).toFixed(1);
    return `${errorRate}%`;
  }

  destroy() {
    if (this.logContainer) {
      this.logContainer.remove();
      this.logContainer = null;
    }
    this.isInitialized = false;
    console.log('[UpdateLogger] 已销毁');
  }
}

window.UpdateLogger = UpdateLogger;
