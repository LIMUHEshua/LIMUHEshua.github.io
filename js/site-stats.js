class SiteStats {
  constructor() {
    this.statsFile = '/data/stats.json';
    this.visitorIdKey = 'hexo_blog_visitor_id';
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

  // 更新最新更新时间
  async updateLastUpdated() {
    const stats = await this.loadStats();
    stats.last_updated = new Date().toISOString();
    await this.saveStats(stats);
    this.updateStatsDisplay(stats);
  }
}

// 初始化统计功能
document.addEventListener('DOMContentLoaded', async () => {
  const stats = new SiteStats();
  await stats.recordVisit();
  
  // 暴露全局方法，以便其他脚本调用
  window.SiteStats = stats;
});