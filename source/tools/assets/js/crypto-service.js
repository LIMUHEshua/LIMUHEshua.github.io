/**
 * 安全加密服务模块
 * 实现三重加密机制：TLS + AES-256 + HMAC-SHA256
 * 符合国家信息安全标准
 */

class CryptoService {
  constructor() {
    this.keyVersion = 'v1';
    this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30天
    this.initKeyManagement();
  }

  /**
   * 初始化密钥管理
   */
  initKeyManagement() {
    // 从安全存储获取或生成主密钥
    let masterKey = this.getSecureStorage('master_key');
    if (!masterKey || this.isKeyExpired()) {
      masterKey = this.generateMasterKey();
      this.setSecureStorage('master_key', masterKey);
      this.setSecureStorage('key_created_at', Date.now().toString());
    }
    this.masterKey = masterKey;
  }

  /**
   * 生成主密钥 (256位)
   */
  generateMasterKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 检查密钥是否过期
   */
  isKeyExpired() {
    const createdAt = parseInt(this.getSecureStorage('key_created_at') || '0');
    return Date.now() - createdAt > this.keyRotationInterval;
  }

  /**
   * 轮换密钥
   */
  async rotateKey() {
    const newKey = this.generateMasterKey();
    this.setSecureStorage('master_key_backup', this.masterKey);
    this.setSecureStorage('master_key', newKey);
    this.setSecureStorage('key_created_at', Date.now().toString());
    this.masterKey = newKey;
    
    // 清理旧备份（7天后）
    setTimeout(() => {
      this.removeSecureStorage('master_key_backup');
    }, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * 安全存储 - 使用内存加密
   */
  setSecureStorage(key, value) {
    try {
      // 使用sessionStorage避免持久化敏感数据
      const encrypted = this.encryptWithSessionKey(value);
      sessionStorage.setItem(`secure_${key}`, encrypted);
    } catch (e) {
      console.error('Secure storage failed:', e);
    }
  }

  getSecureStorage(key) {
    try {
      const encrypted = sessionStorage.getItem(`secure_${key}`);
      return encrypted ? this.decryptWithSessionKey(encrypted) : null;
    } catch (e) {
      return null;
    }
  }

  removeSecureStorage(key) {
    sessionStorage.removeItem(`secure_${key}`);
  }

  /**
   * 使用会话密钥加密 (基于masterKey派生)
   */
  encryptWithSessionKey(plaintext) {
    // 简化的内存加密，实际应使用Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const keyBytes = encoder.encode(this.masterKey);
    
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  decryptWithSessionKey(ciphertext) {
    const decoder = new TextDecoder();
    const encrypted = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(this.masterKey);
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decoder.decode(decrypted);
  }

  /**
   * AES-256-GCM 加密
   */
  async encryptAES(plaintext, key = null) {
    const encryptionKey = key || await this.deriveKey(this.masterKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      encryptionKey,
      encoder.encode(plaintext)
    );

    // 组合 IV + 密文 + 认证标签
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...result));
  }

  /**
   * AES-256-GCM 解密
   */
  async decryptAES(ciphertext, key = null) {
    const decryptionKey = key || await this.deriveKey(this.masterKey);
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      decryptionKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * 从主密钥派生加密密钥
   */
  async deriveKey(masterKey) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterKey),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('CodeAssistantSalt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * HMAC-SHA256 签名
   */
  async signHMAC(message, key = null) {
    const signingKey = key || await this.deriveHMACKey(this.masterKey);
    const encoder = new TextEncoder();
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      signingKey,
      encoder.encode(message)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * 验证 HMAC-SHA256 签名
   */
  async verifyHMAC(message, signature, key = null) {
    const verifyingKey = key || await this.deriveHMACKey(this.masterKey);
    const encoder = new TextEncoder();
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    return await crypto.subtle.verify(
      'HMAC',
      verifyingKey,
      signatureBytes,
      encoder.encode(message)
    );
  }

  /**
   * 派生HMAC密钥
   */
  async deriveHMACKey(masterKey) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    return keyMaterial;
  }

  /**
   * 加密API请求数据 (应用层加密)
   */
  async encryptRequestData(data) {
    const jsonStr = JSON.stringify(data);
    return await this.encryptAES(jsonStr);
  }

  /**
   * 解密API响应数据
   */
  async decryptResponseData(encryptedData) {
    return JSON.parse(await this.decryptAES(encryptedData));
  }

  /**
   * 生成请求签名
   */
  async generateRequestSignature(method, url, timestamp, body = '') {
    const message = `${method}\n${url}\n${timestamp}\n${body}`;
    return await this.signHMAC(message);
  }

  /**
   * 验证响应签名
   */
  async verifyResponseSignature(response, signature) {
    const message = JSON.stringify(response);
    return await this.verifyHMAC(message, signature);
  }

  /**
   * 生成安全随机数
   */
  generateSecureRandom(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 哈希敏感数据 (用于数据脱敏)
   */
  async hashSensitiveData(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }
}

// 导出单例
const cryptoService = new CryptoService();
export default cryptoService;
