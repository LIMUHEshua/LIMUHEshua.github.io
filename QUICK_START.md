# 快速开始指南

本指南帮助你快速搭建并部署 Hexo 博客到 GitHub Pages。

## 第一步：环境准备

### 1. 安装 Node.js

访问 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装：

```bash
node --version
npm --version
```

### 2. 安装 Git

访问 [Git 官网](https://git-scm.com/) 下载并安装。

### 3. 配置 Git

```bash
git config --global user.name "你的名字"
git config --global user.email "your.email@example.com"
```

### 4. 配置 PowerShell（Windows 用户）

如果遇到执行策略错误：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 第二步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)
2. 点击右上角 "+" → "New repository"
3. 仓库名称：`your-username.github.io`（替换为你的 GitHub 用户名）
4. 设置为 Public（公开）
5. 点击 "Create repository"

## 第三步：初始化 Hexo 博客

```bash
# 全局安装 Hexo CLI
npm install -g hexo-cli

# 初始化博客
hexo init hexo-blog

# 进入博客目录
cd hexo-blog

# 安装依赖
npm install
```

## 第四步：安装主题

```bash
# 进入主题目录
cd themes

# 克隆 LiveMyLife 主题
git clone https://github.com/V-Vincen/hexo-theme-livemylife.git livemylife

# 返回博客根目录
cd ..
```

## 第五步：配置博客

### 1. 编辑 `_config.yml`

```yaml
# Site
title: 我的技术博客
subtitle: 探索技术，分享知识
description: 热爱技术的开发者，专注于 AI、Python 和大模型应用开发。
keywords: Python,AI,DeepSeek,Gradio,技术博客
author: 你的名字
language: zh-CN
timezone: Asia/Shanghai

# URL
url: https://your-username.github.io

# Extensions
theme: livemylife
```

### 2. 创建主题配置文件 `_config.livemylife.yml`

```yaml
SEOTitle: 我的技术博客 | 探索技术，分享知识
email: your.email@example.com
description: "热爱技术的开发者，专注于 AI、Python 和大模型应用开发。"
keyword: "Python,AI,DeepSeek,Gradio,技术博客"

sidebar: true
sidebar-about-description: "I don't know where I am going, but I am on my way."

github_username: your-github-username
```

## 第六步：安装部署插件

```bash
npm install hexo-deployer-git --save
```

## 第七步：配置部署

编辑 `_config.yml` 文件：

```yaml
# Deployment
deploy:
  type: git
  repo: https://github.com/your-username/your-username.github.io.git
  branch: main
```

**注意：** 将 `your-username` 替换为你的 GitHub 用户名。

## 第八步：本地预览

```bash
# 生成静态文件
hexo generate

# 启动本地服务器
hexo server
```

访问 `http://localhost:4000` 查看博客。

## 第九步：创建第一篇文章

```bash
# 创建新文章
hexo new "我的第一篇文章"
```

编辑 `source/_posts/我的第一篇文章.md`：

```markdown
---
title: 我的第一篇文章
date: 2026-02-23 18:00:00
categories:
- 生活
tags:
- 测试
---

这是我的第一篇文章！
```

## 第十步：部署到 GitHub Pages

```bash
# 清理缓存
hexo clean

# 生成静态文件
hexo generate

# 部署到 GitHub
hexo deploy
```

或使用一条命令：

```bash
hexo clean && hexo g && hexo d
```

## 第十一步：启用 GitHub Pages

1. 访问你的 GitHub 仓库
2. 进入 Settings → Pages
3. 在 "Source" 下选择：
   - Branch: `main`
   - Folder: `/ (root)`
4. 点击 "Save"

## 第十二步：访问博客

等待 2-5 分钟，访问 `https://your-username.github.io` 查看你的博客。

## 常用命令速查

```bash
# 创建新文章
hexo new "文章标题"

# 本地预览
hexo server

# 生成静态文件
hexo generate

# 部署到 GitHub
hexo deploy

# 清理缓存
hexo clean

# 一键部署
hexo clean && hexo g && hexo d
```

## 下一步

- 查看 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 了解更多配置选项
- 阅读 [README.md](README.md) 了解项目详情
- 开始撰写你的第一篇技术博客！

## 遇到问题？

查看 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 中的故障排除部分。

---

**祝你搭建博客顺利！** 🎉