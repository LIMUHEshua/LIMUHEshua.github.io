/**
 * 安全存储服务模块
 * 提供加密的数据持久化和历史记录管理
 * 支持本地存储和内存缓存
 */

import cryptoService from './crypto-service.js';

class StorageService {
  constructor() {
    this.dbName = 'CodeAssistantDB';
    this.dbVersion = 1;
    this.db = null;
    this.memoryCache = new Map();
    this.maxHistoryItems = 100;
    this.maxFavorites = 50;
    
    this.init();
  }

  /**
   * 初始化存储服务
   */
  async init() {
    await this.initIndexedDB();
    this.setupStorageCleanup();
  }

  /**
   * 初始化 IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 历史记录存储
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('type', 'type', { unique: false });
          historyStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        }
        
        // 收藏存储
        if (!db.objectStoreNames.contains('favorites')) {
          const favStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favStore.createIndex('addedAt', 'addedAt', { unique: false });
        }
        
        // 设置存储
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * 设置存储清理定时器
   */
  setupStorageCleanup() {
    // 每天清理一次过期数据
    setInterval(() => {
      this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 保存历史记录
   */
  async saveHistory(item) {
    const historyItem = {
      id: this.generateId(),
      type: item.type,
      input: await cryptoService.encryptAES(item.input),
      output: await cryptoService.encryptAES(item.output),
      language: item.language || 'javascript',
      timestamp: Date.now(),
      isFavorite: false
    };

    // 检查数量限制
    const count = await this.getHistoryCount();
    if (count >= this.maxHistoryItems) {
      await this.removeOldestHistory();
    }

    await this.saveToStore('history', historyItem);
    
    // 更新内存缓存
    this.memoryCache.set(`history_${historyItem.id}`, historyItem);
    
    return historyItem.id;
  }

  /**
   * 获取历史记录列表
   */
  async getHistoryList(options = {}) {
    const { type, limit = 50, offset = 0 } = options;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      const results = [];
      let skipped = 0;
      
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        
        if (!cursor || results.length >= limit) {
          // 解密数据
          const decrypted = await Promise.all(
            results.map(async (item) => ({
              ...item,
              input: await cryptoService.decryptAES(item.input),
              output: await cryptoService.decryptAES(item.output)
            }))
          );
          resolve(decrypted);
          return;
        }
        
        if (type && cursor.value.type !== type) {
          cursor.continue();
          return;
        }
        
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        results.push(cursor.value);
        cursor.continue();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取单个历史记录
   */
  async getHistoryItem(id) {
    // 先检查内存缓存
    const cached = this.memoryCache.get(`history_${id}`);
    if (cached) {
      return {
        ...cached,
        input: await cryptoService.decryptAES(cached.input),
        output: await cryptoService.decryptAES(cached.output)
      };
    }

    const item = await this.getFromStore('history', id);
    if (!item) return null;

    // 更新缓存
    this.memoryCache.set(`history_${id}`, item);

    return {
      ...item,
      input: await cryptoService.decryptAES(item.input),
      output: await cryptoService.decryptAES(item.output)
    };
  }

  /**
   * 添加到收藏
   */
  async addToFavorites(historyId) {
    const historyItem = await this.getHistoryItem(historyId);
    if (!historyItem) return false;

    // 检查收藏数量限制
    const favCount = await this.getFavoritesCount();
    if (favCount >= this.maxFavorites) {
      throw new Error('收藏数量已达上限');
    }

    const favoriteItem = {
      id: historyId,
      type: historyItem.type,
      input: await cryptoService.encryptAES(historyItem.input),
      output: await cryptoService.encryptAES(historyItem.output),
      language: historyItem.language,
      timestamp: historyItem.timestamp,
      addedAt: Date.now()
    };

    await this.saveToStore('favorites', favoriteItem);
    
    // 更新历史记录标记
    await this.updateHistoryItem(historyId, { isFavorite: true });
    
    return true;
  }

  /**
   * 从收藏移除
   */
  async removeFromFavorites(historyId) {
    await this.deleteFromStore('favorites', historyId);
    await this.updateHistoryItem(historyId, { isFavorite: false });
    return true;
  }

  /**
   * 获取收藏列表
   */
  async getFavoritesList(options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readonly');
      const store = transaction.objectStore('favorites');
      const index = store.index('addedAt');
      
      const request = index.openCursor(null, 'prev');
      const results = [];
      let skipped = 0;
      
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        
        if (!cursor || results.length >= limit) {
          const decrypted = await Promise.all(
            results.map(async (item) => ({
              ...item,
              input: await cryptoService.decryptAES(item.input),
              output: await cryptoService.decryptAES(item.output)
            }))
          );
          resolve(decrypted);
          return;
        }
        
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        results.push(cursor.value);
        cursor.continue();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 保存设置
   */
  async saveSetting(key, value) {
    const encrypted = await cryptoService.encryptAES(JSON.stringify(value));
    await this.saveToStore('settings', { key, value: encrypted });
  }

  /**
   * 获取设置
   */
  async getSetting(key, defaultValue = null) {
    const item = await this.getFromStore('settings', key);
    if (!item) return defaultValue;
    
    const decrypted = await cryptoService.decryptAES(item.value);
    return JSON.parse(decrypted);
  }

  /**
   * 删除历史记录
   */
  async deleteHistory(id) {
    await this.deleteFromStore('history', id);
    this.memoryCache.delete(`history_${id}`);
    
    // 如果已收藏，也删除收藏
    await this.deleteFromStore('favorites', id);
  }

  /**
   * 清空历史记录
   */
  async clearHistory() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.clear();
      
      request.onsuccess = () => {
        // 清空相关缓存
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith('history_')) {
            this.memoryCache.delete(key);
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 导出数据
   */
  async exportData() {
    const history = await this.getHistoryList({ limit: 1000 });
    const favorites = await this.getFavoritesList({ limit: 1000 });
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      history,
      favorites
    };
  }

  /**
   * 导入数据
   */
  async importData(data) {
    if (data.history) {
      for (const item of data.history) {
        await this.saveHistory({
          type: item.type,
          input: item.input,
          output: item.output,
          language: item.language
        });
      }
    }
    
    if (data.favorites) {
      for (const item of data.favorites) {
        // 重新添加到收藏
        const historyList = await this.getHistoryList({ limit: 1000 });
        const match = historyList.find(h => 
          h.input === item.input && h.output === item.output
        );
        if (match) {
          await this.addToFavorites(match.id);
        }
      }
    }
  }

  /**
   * 获取历史记录数量
   */
  async getHistoryCount() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取收藏数量
   */
  async getFavoritesCount() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新历史记录项
   */
  async updateHistoryItem(id, updates) {
    const item = await this.getFromStore('history', id);
    if (!item) return;
    
    Object.assign(item, updates);
    await this.saveToStore('history', item);
    
    // 更新缓存
    this.memoryCache.set(`history_${id}`, item);
  }

  /**
   * 删除最旧的历史记录
   */
  async removeOldestHistory() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // 删除最旧的非收藏记录
          if (!cursor.value.isFavorite) {
            store.delete(cursor.value.id);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData() {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const index = store.index('timestamp');
      
      const request = index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // 只删除非收藏的过期数据
          if (!cursor.value.isFavorite) {
            store.delete(cursor.value.id);
            this.memoryCache.delete(`history_${cursor.value.id}`);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 保存到存储
   */
  saveToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从存储获取
   */
  getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从存储删除
   */
  deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 导出单例
const storageService = new StorageService();
export default storageService;
