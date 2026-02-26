# Hexo 博客 GitHub Pages 部署完整指南

本文档详细介绍如何使用 Hexo 框架搭建博客并部署到 GitHub Pages。

## 目录

1. [环境准备](#环境准备)
2. [Hexo 安装和初始化](#hexo-安装和初始化)
3. [主题配置](#主题配置)
4. [内容迁移](#内容迁移)
5. [GitHub Pages 部署](#github-pages-部署)
6. [常用命令](#常用命令)
7. [故障排除](#故障排除)

---

## 环境准备

### 1. 安装 Node.js

Hexo 基于 Node.js，首先需要安装 Node.js。

**Windows:**
- 访问 [Node.js 官网](https://nodejs.org/)
- 下载并安装 LTS 版本
- 验证安装：
  ```bash
  node --version
  npm --version
  ```

**macOS:**
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

### 2. 安装 Git

**Windows:**
- 访问 [Git 官网](https://git-scm.com/)
- 下载并安装

**macOS:**
```bash
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install git
```

### 3. 配置 Git

```bash
git config --global user.name "你的名字"
git config --global user.email "your.email@example.com"
```

### 4. 配置 PowerShell 执行策略（Windows）

如果遇到 PowerShell 执行策略错误：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Hexo 安装和初始化

### 1. 全局安装 Hexo CLI

```bash
npm install -g hexo-cli
```

### 2. 初始化博客项目

```bash
# 创建博客目录
hexo init hexo-blog

# 进入博客目录
cd hexo-blog

# 安装依赖
npm install
```

### 3. 本地预览

```bash
# 生成静态文件
hexo generate
# 或简写为
hexo g

# 启动本地服务器
hexo server
# 或简写为
hexo s
```

访问 `http://localhost:4000` 查看博客。

---

## 主题配置

### 1. 安装 LiveMyLife 主题

```bash
cd themes
git clone https://github.com/V-Vincen/hexo-theme-livemylife.git livemylife
```

### 2. 配置主题

编辑 `_config.yml` 文件：

```yaml
# Extensions
theme: livemylife
```

### 3. 主题配置

创建或编辑 `_config.livemylife.yml` 文件：

```yaml
# Site
SEOTitle: 我的技术博客 | 探索技术，分享知识
email: 14778471462@sina.cn
description: "热爱技术的开发者，专注于 AI、Python 和大模型应用开发。"
keyword: "Python,AI,DeepSeek,Gradio,技术博客"

# Header
header-img: img/header_img/home-bg.jpg

# Sidebar
sidebar: true
sidebar-about-description: "I don't know where I am going, but I am on my way."
sidebar-avatar: img/avatar/avatar.jpg

# Widgets
widgets:
- featured-tags
- short-about
- recent-posts
- friends-blog
- archive
- category

# SNS
github_username: LIMUHEshua
gitee_username: oneernt
```

### 4. 基本配置

编辑 `_config.yml` 文件的基本信息：

```yaml
# Site
title: 我的技术博客
subtitle: 探索技术，分享知识
description: 热爱技术的开发者，专注于 AI、Python 和大模型应用开发。
keywords: Python,AI,DeepSeek,Gradio,技术博客
author: LIMUHEshua
language: zh-CN
timezone: Asia/Shanghai

# URL
url: https://LIMUHEshua.github.io
permalink: :year/:month/:day/:title/
```

---

## 内容迁移

### 1. 创建新文章

```bash
hexo new "文章标题"
```

这会在 `source/_posts/` 目录下创建一个新的 Markdown 文件。

### 2. 文章格式

```markdown
---
title: 文章标题
date: 2026-02-23 18:00:00
categories:
- 分类1
- 分类2
tags:
- 标签1
- 标签2
---

文章内容...
```

### 3. 从 HTML 迁移到 Markdown

如果你有现有的 HTML 文章，可以：

1. 使用在线工具将 HTML 转换为 Markdown
2. 手动转换为 Markdown 格式
3. 使用 Pandoc 工具转换：
   ```bash
   pandoc input.html -o output.md
   ```

### 4. 添加图片

在文章中使用相对路径引用图片：

```markdown
![图片描述](/images/your-image.jpg)
```

将图片放在 `source/images/` 目录下。

---

## GitHub Pages 部署

### 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 创建新仓库，命名为 `LIMUHEshua.github.io`
   - 注意：仓库名必须与你的 GitHub 用户名一致
   - 设置为 Public（公开）

### 2. 安装部署插件

```bash
npm install hexo-deployer-git --save
```

### 3. 配置部署信息

编辑 `_config.yml` 文件：

```yaml
# Deployment
deploy:
  type: git
  repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
  branch: main
```

**注意：**
- 将 `LIMUHEshua` 替换为你的 GitHub 用户名
- 如果使用 SSH，可以将 `repo` 改为：
  ```yaml
  repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
  ```

### 4. 配置 Git 凭证

**方法一：使用 HTTPS（推荐新手）**

首次部署时会要求输入 GitHub 用户名和密码（或 Personal Access Token）。

**方法二：使用 SSH 密钥**

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "14778471462@sina.cn"

# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加密钥
ssh-add ~/.ssh/id_ed25519

# 复制公钥
cat ~/.ssh/id_ed25519.pub
```

将公钥添加到 GitHub：
1. 访问 GitHub Settings → SSH and GPG keys
2. 点击 "New SSH key"
3. 粘贴公钥内容

### 5. 部署到 GitHub Pages

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

### 6. 启用 GitHub Pages

1. 访问你的 GitHub 仓库
2. 进入 Settings → Pages
3. 在 "Source" 下选择：
   - Branch: `main`
   - Folder: `/ (root)`
4. 点击 "Save"

### 7. 访问博客

等待几分钟后，访问 `https://LIMUHEshua.github.io` 查看你的博客。

---

## 常用命令

### 基本命令

```bash
# 创建新文章
hexo new "文章标题"

# 创建新页面
hexo new page "页面名称"

# 生成静态文件
hexo generate
hexo g

# 启动本地服务器
hexo server
hexo s

# 部署到远程服务器
hexo deploy
hexo d

# 清理缓存
hexo clean

# 列出所有文章
hexo list post

# 发布草稿
hexo publish "文章标题"
```

### 组合命令

```bash
# 清理、生成、部署
hexo clean && hexo g && hexo d

# 生成并预览
hexo g && hexo s
```

### 其他有用命令

```bash
# 查看版本
hexo version

# 查看帮助
hexo help

# 查看特定命令的帮助
hexo help new
```

---

## 故障排除

### 1. PowerShell 执行策略错误

**问题：**
```
npm : 无法加载文件 C:\Program Files\nodejs\npm.ps1，因为在此系统上禁止运行脚本。
```

**解决：**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 2. 端口被占用

**问题：**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**解决：**
```bash
# 查找占用端口的进程
netstat -ano | findstr :4000

# 结束进程（替换 PID）
taskkill /PID <进程ID> /F

# 或使用其他端口
hexo server -p 4001
```

### 3. 部署失败

**问题：**
```
fatal: unable to access 'https://limuheshua.github.io/': Recv failure: Connection was reset
```

**解决：**
- 检查网络连接
- 尝试使用 SSH 而不是 HTTPS
- 配置 Git 代理（如果需要）

### 4. 主题不生效

**问题：**
更换主题后没有变化。

**解决：**
```bash
# 清理缓存
hexo clean

# 重新生成
hexo generate

# 重启服务器
hexo server
```

### 5. 图片无法显示

**问题：**
文章中的图片无法显示。

**解决：**
- 确保图片放在 `source/images/` 目录
- 使用相对路径：`/images/your-image.jpg`
- 检查文件名大小写（Linux 区分大小写）

### 6. GitHub Pages 404 错误

**问题：**
部署后访问博客显示 404。

**解决：**
- 确认仓库名称格式正确：`username.github.io`
- 检查 GitHub Pages 设置中的分支是否正确
- 等待几分钟让 GitHub 完成部署
- 检查 `_config.yml` 中的 `url` 配置

### 7. 部署时提示需要认证

**问题：**
```
fatal: Authentication failed
```

**解决：**

**方法一：使用 Personal Access Token**
1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 生成新的 token，选择 `repo` 权限
3. 使用 token 作为密码（不是用户名）

**方法二：使用 SSH**
```bash
# 修改 _config.yml 中的 repo
repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
```

---

## 高级配置

### 1. 自定义域名

1. 在 `source/` 目录下创建 `CNAME` 文件
2. 在文件中写入你的域名：
   ```
   yourdomain.com
   ```
3. 在域名 DNS 设置中添加记录：
   - A 记录：`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 或 CNAME 记录：`your-username.github.io`

### 2. 启用评论系统

安装评论插件（如 Gitalk、Valine 等）：

```bash
npm install hexo-gitalk --save
```

在主题配置中添加评论设置。

### 3. 添加搜索功能

安装搜索插件：

```bash
npm install hexo-generator-searchdb --save
```

在 `_config.yml` 中配置：

```yaml
search:
  path: search.xml
  field: post
  format: html
  limit: 10000
```

### 4. 优化 SEO

安装 SEO 插件：

```bash
npm install hexo-generator-sitemap --save
npm install hexo-generator-robotstxt --save
```

---

## 维护和更新

### 更新 Hexo

```bash
npm update -g hexo-cli
npm update
```

### 更新主题

```bash
cd themes/livemylife
git pull origin master
```

### 备份博客

定期备份以下内容：
- `source/` 目录（文章和资源）
- `_config.yml`（配置文件）
- `themes/` 目录（自定义主题）

---

## 参考资源

- [Hexo 官方文档](https://hexo.io/docs/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [LiveMyLife 主题文档](https://github.com/V-Vincen/hexo-theme-livemylife)
- [Markdown 语法指南](https://www.markdownguide.org/)

---

## 常见问题 FAQ

**Q: Hexo 支持哪些主题？**
A: Hexo 支持数百个主题，可以在 [Hexo Themes](https://hexo.io/themes/) 查看。

**Q: 如何备份博客源码？**
A: 建议将博客源码放在另一个 Git 仓库中，只将生成的 `public/` 目录部署到 GitHub Pages。

**Q: GitHub Pages 有流量限制吗？**
A: GitHub Pages 有 100GB/月的带宽限制，对于个人博客通常足够。

**Q: 可以使用自定义域名吗？**
A: 可以，参考上面的"自定义域名"部分。

**Q: 如何添加 Google Analytics？**
A: 在主题配置文件中添加 Google Analytics ID，或在 `source/_data/` 目录下创建配置文件。

---

**祝你搭建博客顺利！如有问题，请参考故障排除部分或查阅官方文档。**