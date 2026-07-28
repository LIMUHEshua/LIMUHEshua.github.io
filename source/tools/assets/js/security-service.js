class SecurityService {
  constructor() {
    this.crawlerDetectors = [];
    this.rateLimiters = new Map();
    this.browserFingerprints = new Map();
    this.securityEvents = [];
    this.initSecuritySystem();
  }

  initSecuritySystem() {
    this.initAntiCrawling();
    this.initSourceCodeProtection();
    this.initDDoSProtection();
    this.initHighTrafficHandling();
    this.initLogging();
  }

  // 1. 反爬机制
  initAntiCrawling() {
    this.crawlerDetectors.push(
      this.detectUserBehavior,
      this.detectRequestFrequency,
      this.detectBrowserFingerprint
    );
  }

  detectUserBehavior(userAgent, headers, behavior) {
    const suspiciousPatterns = [
      { name: 'Quick Page Nav', pattern: behavior.pageNavSpeed < 500 },
      { name: 'No Mouse Movement', pattern: !behavior.mouseMovement },
      { name: 'No Scroll', pattern: !behavior.scroll },
      { name: 'Unusual Click Pattern', pattern: behavior.clickPattern === 'robot' }
    ];

    const detected = suspiciousPatterns.filter(pattern => pattern.pattern);
    if (detected.length > 1) {
      this.logSecurityEvent('Crawler Detection', `User behavior analysis: ${detected.map(d => d.name).join(', ')}`);
      return true;
    }
    return false;
  }

  detectRequestFrequency(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    if (!this.rateLimiters.has(ip)) {
      this.rateLimiters.set(ip, { requests: [], lastReset: now });
    }

    const limiter = this.rateLimiters.get(ip);
    const recentRequests = limiter.requests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length > maxRequests) {
      this.logSecurityEvent('Rate Limit Exceeded', `IP ${ip} exceeded rate limit: ${recentRequests.length} requests in ${windowMs/1000}s`);
      return true;
    }

    limiter.requests = [...recentRequests, now];
    return false;
  }

  detectBrowserFingerprint(fingerprint) {
    const hash = this.hashFingerprint(fingerprint);
    const stored = this.browserFingerprints.get(hash);
    
    if (stored) {
      const now = Date.now();
      const sessionGap = now - stored.lastSeen;
      
      if (sessionGap < 1000 && stored.visits > 5) {
        this.logSecurityEvent('Browser Fingerprint', 'Rapid session creation detected');
        return true;
      }
      
      stored.lastSeen = now;
      stored.visits += 1;
    } else {
      this.browserFingerprints.set(hash, {
        lastSeen: Date.now(),
        visits: 1,
        fingerprint: fingerprint
      });
    }
    
    return false;
  }

  hashFingerprint(fingerprint) {
    const str = JSON.stringify(fingerprint);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // 2. 源代码保护
  initSourceCodeProtection() {
    this.obfuscateCode = this.obfuscateCode.bind(this);
    this.encryptSensitiveData = this.encryptSensitiveData.bind(this);
  }

  obfuscateCode(code) {
    // 简单的代码混淆
    const obfuscated = code
      .replace(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, (match, name) => {
        const randomName = this.generateRandomName(8);
        return `function ${randomName}(`;
      })
      .replace(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, (match, name) => {
        const randomName = this.generateRandomName(8);
        return `const ${randomName} =`;
      })
      .replace(/let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, (match, name) => {
        const randomName = this.generateRandomName(8);
        return `let ${randomName} =`;
      })
      .replace(/var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, (match, name) => {
        const randomName = this.generateRandomName(8);
        return `var ${randomName} =`;
      });
    
    return obfuscated;
  }

  generateRandomName(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  encryptSensitiveData(data, key) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const keyBuffer = encoder.encode(key);
      
      return btoa(String.fromCharCode(...dataBuffer));
    } catch (error) {
      this.logSecurityEvent('Encryption Error', error.message);
      return data;
    }
  }

  // 3. DDoS和恶意软件保护
  initDDoSProtection() {
    this.trafficFilter = this.trafficFilter.bind(this);
    this.virusScanner = this.virusScanner.bind(this);
  }

  trafficFilter(request) {
    const suspiciousSignatures = [
      { pattern: /\b(script|iframe)\b/i, score: 2 },
      { pattern: /\b(eval|exec|system)\b/i, score: 3 },
      { pattern: /\b(xss|sql|injection)\b/i, score: 4 }
    ];

    let threatScore = 0;
    suspiciousSignatures.forEach(sig => {
      if (sig.pattern.test(JSON.stringify(request))) {
        threatScore += sig.score;
      }
    });

    if (threatScore > 5) {
      this.logSecurityEvent('DDoS Protection', `High threat score detected: ${threatScore}`);
      return false;
    }

    return true;
  }

  virusScanner(data) {
    const malwareSignatures = [
      'eval(',
      'document.write(',
      'innerHTML',
      'execScript',
      'ActiveXObject',
      'XMLHttpRequest',
      'fetch(',
      'new Function(',
      'setInterval(',
      'setTimeout('
    ];

    const found = malwareSignatures.filter(sig => data.includes(sig));
    if (found.length > 3) {
      this.logSecurityEvent('Malware Detection', `Malware signatures found: ${found.join(', ')}`);
      return true;
    }

    return false;
  }

  // 4. 高流量处理
  initHighTrafficHandling() {
    this.distributedArchitecture = {
      servers: [],
      loadBalancing: true,
      autoScaling: true
    };
  }

  distributeRequest(request) {
    if (this.distributedArchitecture.servers.length === 0) {
      return 'local';
    }

    const serverIndex = Math.floor(Math.random() * this.distributedArchitecture.servers.length);
    return this.distributedArchitecture.servers[serverIndex];
  }

  autoScale(trafficLevel) {
    const serverCount = this.distributedArchitecture.servers.length;
    
    if (trafficLevel > 80 && serverCount < 10) {
      this.addServer();
      this.logSecurityEvent('Auto Scaling', `Added server. Total: ${this.distributedArchitecture.servers.length}`);
    } else if (trafficLevel < 30 && serverCount > 1) {
      this.removeServer();
      this.logSecurityEvent('Auto Scaling', `Removed server. Total: ${this.distributedArchitecture.servers.length}`);
    }
  }

  addServer() {
    const serverId = `server-${Date.now()}`;
    this.distributedArchitecture.servers.push(serverId);
  }

  removeServer() {
    this.distributedArchitecture.servers.pop();
  }

  // 5. 日志记录和文档
  initLogging() {
    this.logSecurityEvent = this.logSecurityEvent.bind(this);
    this.rotateLogs = this.rotateLogs.bind(this);
  }

  logSecurityEvent(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details: details,
      recommendedSolution: this.getRecommendedSolution(eventType)
    };

    this.securityEvents.push(event);
    console.log(`[SECURITY] ${eventType}: ${details}`);

    if (this.securityEvents.length > 1000) {
      this.rotateLogs();
    }
  }

  getRecommendedSolution(eventType) {
    const solutions = {
      'Crawler Detection': 'Implement CAPTCHA and increase rate limits',
      'Rate Limit Exceeded': 'Temporarily block IP and monitor for further activity',
      'Browser Fingerprint': 'Implement session validation and device fingerprinting',
      'DDoS Protection': 'Enable traffic filtering and CDN protection',
      'Malware Detection': 'Isolate affected resources and scan for malicious code',
      'Auto Scaling': 'Monitor server performance and adjust resources accordingly',
      'Encryption Error': 'Check encryption keys and update security protocols'
    };

    return solutions[eventType] || 'Review security logs and implement appropriate measures';
  }

  rotateLogs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `security-log-${timestamp}.json`;
    
    try {
      // 在实际应用中，这里会将日志保存到文件系统
      console.log(`Rotating logs to ${logFileName}`);
      this.securityEvents = [];
    } catch (error) {
      console.error('Error rotating logs:', error);
    }
  }

  // 6. 事件响应
  handleSecurityIncident(incident) {
    const { type, details, timestamp } = incident;
    
    console.log(`[INCIDENT RESPONSE] ${type} at ${timestamp}: ${details}`);
    
    // 实施响应措施
    switch (type) {
      case 'Crawler Detection':
        return this.handleCrawlerIncident(incident);
      case 'DDoS Protection':
        return this.handleDDoSIncident(incident);
      case 'Malware Detection':
        return this.handleMalwareIncident(incident);
      default:
        return this.handleGenericIncident(incident);
    }
  }

  handleCrawlerIncident(incident) {
    return {
      action: 'Return empty data',
      duration: '5 minutes',
      monitoring: true
    };
  }

  handleDDoSIncident(incident) {
    return {
      action: 'Implement traffic filtering',
      duration: '1 hour',
      monitoring: true
    };
  }

  handleMalwareIncident(incident) {
    return {
      action: 'Isolate affected resources',
      duration: 'Until cleaned',
      scanning: true
    };
  }

  handleGenericIncident(incident) {
    return {
      action: 'Monitor activity',
      duration: 'Ongoing',
      alert: true
    };
  }

  // 主安全检查函数
  performSecurityChecks(request, userAgent, headers, behavior) {
    const ip = headers['x-forwarded-for'] || '127.0.0.1';
    const fingerprint = {
      userAgent: userAgent,
      screenSize: behavior.screenSize,
      timezone: new Date().getTimezoneOffset(),
      language: navigator.language
    };

    // 执行反爬检测
    const isCrawler = this.crawlerDetectors.some(detector => 
      detector.call(this, userAgent, headers, behavior)
    );

    // 执行DDoS检测
    const isMalicious = !this.trafficFilter(request);

    // 执行恶意软件检测
    const hasMalware = this.virusScanner(JSON.stringify(request));

    // 执行速率限制检查
    const rateLimited = this.detectRequestFrequency(ip);

    if (isCrawler || isMalicious || hasMalware || rateLimited) {
      this.logSecurityEvent('Security Check Failed', `IP: ${ip}, User-Agent: ${userAgent}`);
      return {
        blocked: true,
        reason: [
          isCrawler && 'Crawler detected',
          isMalicious && 'Malicious request',
          hasMalware && 'Malware detected',
          rateLimited && 'Rate limit exceeded'
        ].filter(Boolean).join(', ')
      };
    }

    return { blocked: false };
  }
}

// 导出安全服务实例
const securityService = new SecurityService();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = securityService;
} else if (typeof window !== 'undefined') {
  window.securityService = securityService;
}
