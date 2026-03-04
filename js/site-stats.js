class SiteStats {
  constructor() {
    this.statsFile = '/data/stats.json';
    this.visitorIdKey = 'hexo_blog_visitor_id';
    this.performanceDataKey = 'hexo_blog_performance_data';
    this.startTime = performance.now();
  }

  // 生成唯一访客ID
  generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // 获取访客ID
  getVisitorId() {
    let visitorId = localStorage.getItem(this.visitorIdKey);
    if (!visitorId) {
      visitorId = this.generateVisitorId();
      localStorage.setItem(this.visitorIdKey, visitorId);
    }
    return visitorId;
  }

  // 加载统计数据
  async loadStats() {
    try {
      const response = await fetch(this.statsFile);
      if (response.ok) {
        return await response.json();
      }
      return {
        last_updated: new Date().toISOString(),
        total_visitors: 0,
        visitors: []
      };
    } catch (error) {
      console.error('Error loading stats:', error);
      return {
        last_updated: new Date().toISOString(),
        total_visitors: 0,
        visitors: []
      };
    }
  }

  // 保存统计数据
  async saveStats(stats) {
    // 在客户端环境中，我们无法直接写入文件
    // 这里我们可以通过API或其他方式将数据发送到服务器
    // 但由于这是静态网站，我们将使用localStorage作为临时存储
    localStorage.setItem('site_stats', JSON.stringify(stats));
  }

  // 记录访问
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

  // 更新统计显示
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

  // 采集性能数据
  collectPerformanceData() {
    // 验证性能API是否可用
    if (!window.performance || !window.performance.timing) {
      console.warn('Performance API not available');
      return null;
    }

    // 计算响应时间，确保值有效
    let responseTime = 0;
    if (performance.timing.responseEnd > performance.timing.requestStart) {
      responseTime = performance.timing.responseEnd - performance.timing.requestStart;
    }

    // 计算渲染时间，确保值有效
    let renderTime = 0;
    const currentTime = performance.now();
    if (currentTime > this.startTime) {
      renderTime = currentTime - this.startTime;
    }

    const performanceData = {
      timestamp: new Date().toISOString(),
      visitorId: this.getVisitorId(),
      pageUrl: window.location.href,
      performance: {
        responseTime: responseTime,
        renderTime: renderTime
      }
    };
    return performanceData;
  }

  // 存储性能数据
  savePerformanceData(performanceData) {
    // 确保性能数据有效
    if (!performanceData || !performanceData.performance) {
      console.warn('Invalid performance data');
      return;
    }

    const existingData = JSON.parse(localStorage.getItem(this.performanceDataKey) || '[]');
    existingData.push(performanceData);
    // 只保留最近100条性能数据
    if (existingData.length > 100) {
      existingData.shift();
    }
    localStorage.setItem(this.performanceDataKey, JSON.stringify(existingData));
  }

  // 获取性能数据
  getPerformanceData() {
    return JSON.parse(localStorage.getItem(this.performanceDataKey) || '[]');
  }

  // 分析性能数据
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

  // 更新最新更新时间
  async updateLastUpdated() {
    const stats = await this.loadStats();
    stats.last_updated = new Date().toISOString();
    await this.saveStats(stats);
    this.updateStatsDisplay(stats);
  }

  // 更新性能数据显示
  updatePerformanceDisplay() {
    const performanceAnalysis = this.analyzePerformanceData();
    const performanceElement = document.getElementById('performance-stats');
    if (performanceElement) {
      if (performanceAnalysis) {
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
    }
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
    
    // 立即更新性能统计显示，避免显示"加载中..."
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
      // 出错时也更新显示，确保不会一直显示"加载中..."
      if (window.SiteStats) {
        window.SiteStats.updatePerformanceDisplay();
      }
    }
  } else {
    console.error('SiteStats实例不存在');
  }
});