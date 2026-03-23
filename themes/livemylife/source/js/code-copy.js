// 代码复制功能
(function() {
  'use strict';

  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    initCodeCopy();
  });

  function initCodeCopy() {
    // 获取所有代码块
    var codeBlocks = document.querySelectorAll('figure.highlight');
    
    codeBlocks.forEach(function(block) {
      // 创建复制按钮
      var copyBtn = document.createElement('button');
      copyBtn.className = 'code-copy-btn';
      copyBtn.textContent = '复制';
      copyBtn.setAttribute('aria-label', '复制代码');
      
      // 添加点击事件
      copyBtn.addEventListener('click', function() {
        copyCode(block, copyBtn);
      });
      
      // 将按钮添加到代码块
      block.appendChild(copyBtn);
    });
  }

  function copyCode(block, btn) {
    // 获取代码内容
    var codeElement = block.querySelector('.code pre');
    if (!codeElement) return;
    
    var code = codeElement.textContent;
    
    // 使用Clipboard API复制
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(function() {
        showCopied(btn);
      }).catch(function() {
        // 降级方案
        fallbackCopy(code, btn);
      });
    } else {
      // 降级方案
      fallbackCopy(code, btn);
    }
  }

  function fallbackCopy(text, btn) {
    // 创建临时textarea
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    
    // 选择并复制
    textarea.focus();
    textarea.select();
    
    try {
      var successful = document.execCommand('copy');
      if (successful) {
        showCopied(btn);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
    
    // 清理
    document.body.removeChild(textarea);
  }

  function showCopied(btn) {
    var originalText = btn.textContent;
    btn.textContent = '已复制!';
    btn.classList.add('copied');
    
    // 2秒后恢复
    setTimeout(function() {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }
})();
