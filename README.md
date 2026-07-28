# Cyber Hexo Blog

一个融合未来感、暗色主题与代码美学的 Hexo 博客主题，灵感来自你提供的赛博朋克视觉提示词：深黑底色、霓虹青紫渐变、发光代码片段、矩阵栅格、玻璃态面板与悬浮卡片。

![Hexo](https://img.shields.io/badge/Hexo-8.1.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 主题概览

本次重构将博客的视觉系统从传统明亮风格切换为未来感暗色 UI，核心特点包括：

- 深黑与霓虹青紫的赛博朋克配色
- 矩阵式网格背景与流光渐变效果
- 发光卡片、玻璃态面板与高科技边框
- 代码块与标题采用等宽字体，增强科技感
- 响应式布局，桌面端与移动端体验一致

## 已完成的界面升级

- 重新设计全站配色，使用深色背景 + 青色/紫色霓虹
- 为文章卡片、侧边栏和分页区域加入玻璃态与发光边框
- 增加网格背景、渐变光晕和悬浮高亮效果
- 优化搜索框、按钮和社交链接的赛博风格视觉表现
- 保留原有内容结构，同时提升阅读体验与视觉辨识度

## 项目结构

```text
hexo-blog/
├── _config.yml
├── package.json
├── source/
│   ├── _posts/
│   ├── images/
│   └── tools/
├── themes/
│   └── livemylife/
│       ├── layout/
│       └── source/css/
└── public/
```

## 本地运行

```bash
npm install
npx hexo server
```

然后访问：

```text
http://localhost:4000
```

## 生成静态站点

```bash
npx hexo generate
```

## 发布部署

```bash
npx hexo deploy
```

## 说明

这个项目当前以“未来感暗色博客 UI”作为主题视觉主线，适合展示技术文章、开发日志、AI 相关内容以及个人项目介绍。你也可以继续扩展为更偏极客、科幻或产品发布页的风格。

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