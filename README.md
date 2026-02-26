# 我的技术博客

基于 Hexo 框架搭建的个人技术博客，采用 LiveMyLife 主题，部署在 GitHub Pages。

![Hexo](https://img.shields.io/badge/Hexo-6.3.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 项目简介

这是一个简洁、专业的个人技术博客，专注于分享 AI、Python 和大模型应用开发的学习心得和实践经验。博客采用 Hexo 静态网站生成器，支持 Markdown 写作，部署在 GitHub Pages 上。

## 特性

- **快速构建**：基于 Hexo，一键生成静态网站
- **Markdown 写作**：支持 Markdown 语法，写作体验流畅
- **响应式设计**：完美适配桌面端和移动端
- **SEO 优化**：内置 SEO 优化配置
- **免费托管**：部署在 GitHub Pages，完全免费
- **自定义主题**：采用 LiveMyLife 主题，简洁美观
- **代码高亮**：内置代码高亮功能
- **分类标签**：支持文章分类和标签管理

## 快速开始

### 环境要求

- Node.js 18+
- Git
- npm 或 yarn

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/your-username/your-username.github.io.git
cd your-username.github.io

# 安装依赖
npm install

# 启动本地服务器
hexo server
```

访问 `http://localhost:4000` 查看博客。

### 创建新文章

```bash
# 创建新文章
hexo new "文章标题"

# 编辑文章
vim source/_posts/文章标题.md
```

### 部署到 GitHub Pages

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

## 项目结构

```
hexo-blog/
├── _config.yml              # Hexo 主配置文件
├── _config.livemylife.yml   # 主题配置文件
├── package.json             # 项目依赖
├── scaffolds/               # 文章模板
├── source/                  # 源文件目录
│   ├── _posts/             # 博客文章
│   ├── images/             # 图片资源
│   └── _data/              # 数据文件
├── themes/                  # 主题目录
│   └── livemylife/         # LiveMyLife 主题
├── public/                  # 生成的静态文件（自动生成）
└── DEPLOYMENT_GUIDE.md      # 详细部署指南
```

## 配置说明

### 基本配置

编辑 `_config.yml` 文件：

```yaml
# Site
title: 我的技术博客 | 探索技术，分享知识
subtitle: 探索技术，分享知识
description: 热爱技术的开发者，专注于 AI、Python 和大模型应用开发。
keywords: Python,AI, DeepSeek,Gradio,技术博客
author: LIMUHEshua
language: zh-CN
timezone: Asia/Shanghai

# URL
url: https://LIMUHEshua.github.io/
```

### 主题配置

编辑 `_config.livemylife.yml` 文件：

```yaml
# Site
SEOTitle: 我的技术博客 | 探索技术，分享知识
email: 14778471462@sina.cn
description: "热爱技术的开发者，专注于 AI、Python 和大模型应用开发。"

# Sidebar
sidebar: true
sidebar-about-description: "I don't know where I am going, but I am on my way."

# SNS
github_username: LIMUHEshua
gitee_username: oneernt
```

### 部署配置

编辑 `_config.yml` 文件的部署部分：

```yaml
# Deployment
deploy:
  type: git
  repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
  branch: main
```

## 常用命令

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

# 组合命令
hexo clean && hexo g && hexo d
```

## 文章格式

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

## 二级标题

### 三级标题

代码示例：

```python
def hello():
    print("Hello, World!")
```

引用示例：

> 这是一段引用文本。
```

## 已发布文章

1. [基于 DeepSeek 的本地部署大模型助手](https://LIMUHEshua.github.io/2026/02/23/deepseek-local-deployment/) - 2026-02-23

## 主题说明

本项目使用 [LiveMyLife](https://github.com/oneernt/hexo-theme-livemylife) 主题，这是一个简洁美观的 Hexo 主题，具有以下特点：

- 响应式设计
- 侧边栏导航
- 文章分类和标签
- 友好的阅读体验
- 自定义配色方案

## 部署指南

详细的部署指南请查看 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)，包含：

- 环境准备
- Hexo 安装和初始化
- 主题配置
- 内容迁移
- GitHub Pages 部署
- 常用命令
- 故障排除

## 自定义域名

如果需要使用自定义域名，请按照以下步骤操作：

1. 在 `source/` 目录下创建 `CNAME` 文件
2. 在文件中写入你的域名
3. 在域名 DNS 设置中添加 A 记录或 CNAME 记录

## 备份建议

建议将博客源码备份到单独的 Git 仓库：

```bash
# 创建源码仓库
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/LIMUHEshua/blog-source.git
git push -u origin main
```

## 更新和维护

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

## 故障排除

遇到问题？请查看 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) 中的故障排除部分，常见问题包括：

- PowerShell 执行策略错误
- 端口被占用
- 部署失败
- 主题不生效
- 图片无法显示

## 技术栈

- **Hexo**：快速、简洁且强大的博客框架
- **Node.js**：JavaScript 运行环境
- **LiveMyLife 主题**：简洁美观的博客主题
- **GitHub Pages**：免费的静态网站托管服务
- **Markdown**：轻量级标记语言

## 浏览器支持

- Chrome（推荐）
- Firefox
- Safari
- Edge
- 其他现代浏览器

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证。

## 联系方式

- GitHub: [@LIMUHEshua](https://github.com/LIMUHEshua)
- Email: 14778471462@sina.cn

## 致谢

- [Hexo](https://hexo.io/) - 强大的博客框架
- [LiveMyLife](https://github.com/oneernt/hexo-theme-livemylife) - 精美的主题
- [GitHub Pages](https://pages.github.com/) - 免费的托管服务

## 参考资源

- [Hexo 官方文档](https://hexo.io/docs/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [LiveMyLife 主题文档](https://github.com/oneernt/hexo-theme-livemylife)
- [Markdown 语法指南](https://www.markdownguide.org/)

---

**享受写作，分享知识！** 🚀