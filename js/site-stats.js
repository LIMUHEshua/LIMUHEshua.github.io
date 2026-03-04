/**
 * SiteStats 类 - 负责网站统计和性能监控
 * 功能包括：访客统计、性能数据采集、分析和显示
 */
class SiteStats {
  constructor() {
    /**
     * 统计文件路径
     * @type {string}
     */
    this.statsFile = '/data/stats.json';
    
    /**
     * 访客ID存储键
     * @type {string}
     */
    this.visitorIdKey = 'hexo_blog_visitor_id';
    
    /**
     * 性能数据存储键
     * @type {string}
     */
    this.performanceDataKey = 'hexo_blog_performance_data';
    
    /**
     * 页面加载开始时间
     * @type {number}
     */
    this.startTime = performance.now();
  }

  /**
   * 生成唯一访客ID
   * @returns {string} 唯一访客ID
   */
  generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * 获取访客ID，不存在则生成新的
   * @returns {string} 访客ID
   */
  getVisitorId() {
    let visitorId = localStorage.getItem(this.visitorIdKey);
    if (!visitorId) {
      visitorId = this.generateVisitorId();
      localStorage.setItem(this.visitorIdKey, visitorId);
    }
    return visitorId;
  }

  /**
   * 加载统计数据
   * @returns {Promise<Object>} 统计数据对象
   */
  async loadStats() {
    try {
      const response = await fetch(this.statsFile);
      if (response.ok) {
        return await response.json();
      }
      // 返回默认统计数据
      return {
        last_updated: new Date().toISOString(),
        total_visitors: 0,
        visitors: []
      };
    } catch (error) {
      console.error('Error loading stats:', error);
      // 出错时返回默认统计数据
      return {
        last_updated: new Date().toISOString(),
        total_visitors: 0,
        visitors: []
      };
    }
  }

  /**
   * 保存统计数据
   * @param {Object} stats 统计数据对象
   * @returns {Promise<void>}
   */
  async saveStats(stats) {
    // 在客户端环境中，使用localStorage作为临时存储
    localStorage.setItem('site_stats', JSON.stringify(stats));
  }

  /**
   * 记录访问
   * @returns {Promise<void>}
   */
  async recordVisit() {
    const visitorId = this.getVisitorId();
    const stats = await this.loadStats();

    // 检查是否已经访问过
    const hasVisited = stats.visitors.includes(visitorId);
    if (!hasVisited) {
      stats.visitors.push(visitorId);
      stats.total_visitors = stats.visitors.length;
      await this.saveStats(stats);
      this.updateStatsDisplay(stats);
    } else {
      this.updateStatsDisplay(stats);
    }
  }

  /**
   * 更新统计显示
   * @param {Object} stats 统计数据对象
   */
  updateStatsDisplay(stats) {
    const statsElement = document.getElementById('site-stats');
    if (statsElement) {
      statsElement.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">最新更新：</span>
          <span class="stat-value">${new Date(stats.last_updated).toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">访客总数：</span>
          <span class="stat-value">${stats.total_visitors}</span>
        </div>
      `;
    }
  }

  /**
   * 采集性能数据
   * @returns {Object|null} 性能数据对象或null
   */
  collectPerformanceData() {
    // 验证性能API是否可用
    if (!window.performance || !window.performance.timing) {
      console.warn('Performance API not available');
      return null;
    }

    // 计算响应时间
    let responseTime = 0;
    if (performance.timing.responseEnd && performance.timing.requestStart) {
      responseTime = performance.timing.responseEnd - performance.timing.requestStart;
    }

    // 计算渲染时间
    let renderTime = 0;
    const currentTime = performance.now();
    if (currentTime && this.startTime) {
      renderTime = currentTime - this.startTime;
    }

    // 确保值为正数
    responseTime = Math.max(0, responseTime);
    renderTime = Math.max(0, renderTime);

    const performanceData = {
      timestamp: new Date().toISOString(),
      visitorId: this.getVisitorId(),
      pageUrl: window.location.href,
      performance: {
        responseTime: responseTime,
        renderTime: renderTime
      }
    };

    console.log('采集的性能数据:', performanceData);
    return performanceData;
  }

  /**
   * 存储性能数据
   * @param {Object} performanceData 性能数据对象
   */
  savePerformanceData(performanceData) {
    // 确保性能数据有效
    if (!performanceData || !performanceData.performance) {
      console.warn('Invalid performance data');
      return;
    }

    try {
      const existingData = JSON.parse(localStorage.getItem(this.performanceDataKey) || '[]');
      existingData.push(performanceData);
      // 只保留最近100条性能数据
      if (existingData.length > 100) {
        existingData.shift();
      }
      localStorage.setItem(this.performanceDataKey, JSON.stringify(existingData));
      console.log('性能数据保存成功，当前数据量:', existingData.length);
    } catch (error) {
      console.error('保存性能数据出错:', error);
    }
  }

  /**
   * 获取性能数据
   * @returns {Array} 性能数据数组
   */
  getPerformanceData() {
    try {
      const data = JSON.parse(localStorage.getItem(this.performanceDataKey) || '[]');
      console.log('获取的性能数据量:', data.length);
      return data;
    } catch (error) {
      console.error('获取性能数据出错:', error);
      return [];
    }
  }

  /**
   * 分析性能数据
   * @returns {Object|null} 分析结果对象或null
   */
  analyzePerformanceData() {
    const data = this.getPerformanceData();
    console.log('性能数据总量:', data.length);
    if (data.length === 0) {
      console.log('没有性能数据');
      return null;
    }

    // 过滤有效数据
    const validData = data.filter(item => {
      return item && item.performance && 
             typeof item.performance.responseTime === 'number' && 
             typeof item.performance.renderTime === 'number' &&
             item.performance.responseTime >= 0 &&
             item.performance.renderTime >= 0;
    });

    console.log('有效性能数据量:', validData.length);
    if (validData.length === 0) {
      console.log('没有有效性能数据');
      return null;
    }

    // 计算平均值
    const avgResponseTime = validData.reduce((sum, item) => sum + item.performance.responseTime, 0) / validData.length;
    const avgRenderTime = validData.reduce((sum, item) => sum + item.performance.renderTime, 0) / validData.length;

    console.log('平均响应时间:', avgResponseTime);
    console.log('平均渲染时间:', avgRenderTime);

    return {
      average: {
        responseTime: avgResponseTime.toFixed(2),
        renderTime: avgRenderTime.toFixed(2)
      },
      latest: validData[validData.length - 1].performance,
      count: validData.length
    };
  }

  /**
   * 更新最新更新时间
   * @returns {Promise<void>}
   */
  async updateLastUpdated() {
    const stats = await this.loadStats();
    stats.last_updated = new Date().toISOString();
    await this.saveStats(stats);
    this.updateStatsDisplay(stats);
  }

  /**
   * 更新性能数据显示
   */
  updatePerformanceDisplay() {
    console.log('开始更新性能统计显示');
    const performanceAnalysis = this.analyzePerformanceData();
    const performanceElement = document.getElementById('performance-stats');
    
    if (performanceElement) {
      if (performanceAnalysis) {
        console.log('有性能数据，更新显示');
        performanceElement.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">平均响应时间：</span>
            <span class="stat-value">${performanceAnalysis.average.responseTime}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均渲染时间：</span>
            <span class="stat-value">${performanceAnalysis.average.renderTime}ms</span>
          </div>
        `;
      } else {
        console.log('没有性能数据，显示默认值');
        // 没有性能数据时显示默认值
        performanceElement.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">平均响应时间：</span>
            <span class="stat-value">0ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均渲染时间：</span>
            <span class="stat-value">0ms</span>
          </div>
        `;
      }
    } else {
      console.error('性能统计元素未找到');
    }
  }

  /**
   * 强制更新性能数据
   */
  forceUpdatePerformance() {
    console.log('强制更新性能数据');
    const performanceData = this.collectPerformanceData();
    if (performanceData) {
      this.savePerformanceData(performanceData);
    }
    this.updatePerformanceDisplay();
  }
}

// 初始化统计功能
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM加载完成，初始化SiteStats');
  try {
    const stats = new SiteStats();
    console.log('SiteStats实例创建成功');
    await stats.recordVisit();
    console.log('访问记录成功');
    
    // 立即更新性能统计显示
    stats.updatePerformanceDisplay();
    console.log('性能统计显示初始化成功');
    
    // 暴露全局方法，以便其他脚本调用
    window.SiteStats = stats;
    console.log('SiteStats实例已暴露到全局');
  } catch (error) {
    console.error('SiteStats初始化过程中出错:', error);
  }
});

// 页面加载完成后采集性能数据
window.addEventListener('load', () => {
  console.log('页面加载完成，开始采集性能数据');
  if (window.SiteStats) {
    console.log('SiteStats实例存在，开始采集性能数据');
    try {
      const performanceData = window.SiteStats.collectPerformanceData();
      if (performanceData) {
        console.log('性能数据采集成功:', performanceData);
        window.SiteStats.savePerformanceData(performanceData);
        console.log('性能数据保存成功');
      } else {
        console.warn('性能数据采集失败，跳过保存');
      }
      // 无论采集是否成功，都更新显示
      window.SiteStats.updatePerformanceDisplay();
      console.log('性能数据显示更新成功');
    } catch (error) {
      console.error('性能数据采集和显示过程中出错:', error);
      // 出错时也更新显示
      if (window.SiteStats) {
        window.SiteStats.updatePerformanceDisplay();
      }
    }
  } else {
    console.error('SiteStats实例不存在');
  }
});

// 定期更新性能数据
setInterval(() => {
  if (window.SiteStats) {
    console.log('定期更新性能数据');
    window.SiteStats.forceUpdatePerformance();
  }
}, 30000); // 每30秒更新一次