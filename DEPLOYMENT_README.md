# Hexo博客项目部署说明

## 项目概述

本项目是一个基于Hexo框架的静态博客网站，专门用于展示proe.py铅笔画转换工具的功能特性和相关技术教程。

### 项目信息

- **项目名称**: LIMUHEshua博客
- **框架**: Hexo 8.1.1
- **主题**: livemylife (自定义主题)
- **部署目标**: GitHub Pages
- **访问地址**: https://limuheshua.github.io/

## 项目结构

```
hexo-blog/
├── source/                 # 源文件目录
│   └── _posts/            # 博客文章
│       ├── hello-world.md
│       ├── deepseek-local-deployment.md
│       ├── pencil-sketch-converter.md
│       └── gradio-image-processing-guide.md
├── themes/               # 主题目录
│   └── livemylife/      # 自定义主题
│       ├── layout/      # 布局文件
│       └── source/      # 主题资源
├── public/              # 生成的静态文件（部署目标）
├── _config.yml          # Hexo主配置文件
├── _config.livemylife.yml  # 主题配置文件
├── package.json         # 项目依赖
└── proe.py             # 铅笔画转换工具源码
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
# 启动本地服务器
npm run server

# 访问 http://localhost:4000
```

### 3. 构建静态文件

```bash
npm run build
```

### 4. 部署到GitHub Pages

```bash
npm run deploy
```

## 博客内容

### 文章列表

1. **Hello World**
   - Hexo框架入门介绍
   - 基本使用方法

2. **DeepSeek本地部署指南**
   - DeepSeek大模型本地部署教程
   - 配置和使用方法

3. **使用Gradio创建图片铅笔画转换工具**
   - proe.py功能详细介绍
   - 技术原理和应用场景
   - 使用方法和扩展功能

4. **Gradio图像处理应用开发实战指南**
   - Gradio框架深度教程
   - 项目架构设计
   - 性能优化和部署方案

### 内容特点

- ✅ 详细的功能介绍
- ✅ 清晰的技术原理说明
- ✅ 实用的使用方法
- ✅ 完整的代码示例（已做隐私处理）
- ✅ 扩展功能建议
- ✅ 学习价值总结

## 主题特性

### livemylife主题功能

- 🎨 简洁美观的设计风格
- 📱 完全响应式布局
- 🔍 内置搜索功能
- 📊 网站统计功能
- 🏷️ 分类和标签系统
- 📅 文章归档功能
- ⚡ 快速加载性能
- 🎯 良好的用户体验

### 响应式设计

- 桌面端 (1920x1080+): 完整布局
- 平板端 (768x1024): 适配布局
- 移动端 (375x667): 单列布局
- 超小屏幕 (320x568): 基础功能

## 部署流程

### 方式一：手动部署

1. **准备GitHub仓库**
   ```bash
   # 创建名为 LIMUHEshua.github.io 的仓库
   # 必须设置为Public仓库
   ```

2. **配置部署信息**
   ```yaml
   # _config.yml
   deploy:
     type: git
     repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
     branch: main
   ```

3. **执行部署命令**
   ```bash
   hexo clean && hexo generate && hexo deploy
   ```

4. **配置GitHub Pages**
   - 进入仓库Settings -> Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - 保存设置

### 方式二：GitHub Actions自动化部署

1. **创建工作流文件**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./public
   ```

2. **推送代码**
   ```bash
   git add .
   git commit -m "Update blog"
   git push origin main
   ```

3. **自动部署**
   - GitHub Actions会自动构建和部署
   - 访问 https://limuheshua.github.io/

## 配置说明

### Hexo主配置 (_config.yml)

```yaml
# 网站信息
title: LIMUHEshua博客
subtitle: 探索技术，分享知识
description: 专注于AI、Python、大模型应用、前端框架搭建与硬件开发
author: LIMUHEshua
language: zh-CN

# URL设置
url: https://LIMUHEshua.github.io
permalink: :year/:month/:day/:title/

# 主题设置
theme: livemylife

# 部署配置
deploy:
  type: git
  repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
  branch: main
```

### 主题配置 (_config.livemylife.yml)

```yaml
# SEO设置
SEOTitle: 我的技术博客 | 探索技术，分享知识
email: 14778471462@sina.cn
keywords: "Python,AI,DeepSeek,Gradio,技术博客"

# 侧边栏设置
sidebar: true
sidebar-about-description: "I don't know where I am going, but I am on my way..."

# 社交媒体
github_username: LIMUHEshua
gitee_username: oneernt
```

## 维护指南

### 添加新文章

```bash
# 创建新文章
hexo new "文章标题"

# 编辑文章
vim source/_posts/文章标题.md

# 生成并部署
hexo clean && hexo generate && hexo deploy
```

### 更新主题

```bash
cd themes/livemylife
git pull origin master
cd ../..
hexo clean && hexo generate && hexo deploy
```

### 备份数据

```bash
# 备份文章
tar -czf posts-backup-$(date +%Y%m%d).tar.gz source/_posts/

# 备份配置
cp _config.yml _config.yml.backup
```

## 性能优化

### 已实现的优化

- ✅ CSS和JavaScript压缩
- ✅ 静态资源优化
- ✅ 图片响应式处理
- ✅ 代码分割和懒加载
- ✅ 浏览器缓存策略

### 建议的优化

- ⏳ 启用Gzip压缩
- ⏳ 实现图片懒加载
- ⏳ 使用CDN加速
- ⏳ 添加Service Worker

## 测试报告

详细的测试报告请参考 [DEPLOYMENT_TEST_REPORT.md](./DEPLOYMENT_TEST_REPORT.md)

### 测试结果摘要

- ✅ 功能完整性: 100%
- ✅ 页面加载性能: 优秀
- ✅ 响应式设计: 完全兼容
- ✅ 浏览器兼容性: 主流浏览器全部支持
- ✅ SEO优化: 良好
- ✅ 用户体验: 优秀

## 常见问题

### Q1: 部署后网站无法访问？

A: 检查以下几点：
1. GitHub Pages设置是否正确
2. 仓库名称是否与用户名匹配
3. 分支设置是否为main
4. 等待1-2分钟让部署完成

### Q2: 如何自定义域名？

A: 
1. 在仓库根目录创建CNAME文件
2. 文件内容为你的域名
3. 在DNS中添加CNAME记录

### Q3: 如何添加评论功能？

A: 可以集成以下评论系统：
- Gitalk (基于GitHub Issues)
- Valine (基于LeanCloud)
- Disqus (第三方服务)

### Q4: 如何优化图片加载？

A: 
1. 使用图片压缩工具
2. 实现图片懒加载
3. 使用WebP格式
4. 配置CDN加速

## 安全建议

1. 🔒 定期更新依赖包
2. 🔒 使用HTTPS加密
3. 🔒 不在代码中暴露敏感信息
4. 🔒 定期备份重要数据
5. 🔒 配置CSP头部

## 技术支持

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/LIMUHEshua/LIMUHEshua.github.io/issues
- Email: 14778471462@sina.cn

## 相关资源

- [Hexo官方文档](https://hexo.io/docs/)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [Gradio官方文档](https://gradio.app/docs/)
- [OpenCV Python教程](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)

## 许可证

本项目仅供学习交流使用，如有侵权请联系删除。

---

**最后更新**: 2026-02-26
**版本**: 1.0
**维护者**: LIMUHEshua
