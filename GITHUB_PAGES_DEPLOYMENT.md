# GitHub Pages 部署指南

## 前置条件

1. 拥有GitHub账号
2. 已安装Git
3. 已完成Hexo博客的本地构建

## 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub网站
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 仓库名称设置为：`LIMUHEshua.github.io`（注意：必须与你的GitHub用户名匹配）
4. 选择 "Public" 或 "Private"（GitHub Pages需要Public仓库）
5. 点击 "Create repository"

### 2. 配置本地Git仓库

如果还没有初始化Git仓库，执行以下命令：

```bash
git init
```

### 3. 添加远程仓库

```bash
git remote add origin git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
```

### 4. 配置Hexo部署

Hexo的部署配置已经在 `_config.yml` 文件中设置好了：

```yaml
deploy:
  type: git
  repo: git@github.com:LIMUHEshua/LIMUHEshua.github.io.git
  branch: main
```

### 5. 安装部署插件

确保已安装 `hexo-deployer-git` 插件：

```bash
npm install hexo-deployer-git --save
```

### 6. 生成静态文件

```bash
hexo generate
```

### 7. 部署到GitHub Pages

```bash
hexo deploy
```

或者使用组合命令：

```bash
hexo clean && hexo generate && hexo deploy
```

### 8. 配置GitHub Pages

1. 进入GitHub仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Build and deployment" 部分：
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 `main` 分支和 `/ (root)` 目录
5. 点击 "Save"

### 9. 等待部署完成

GitHub Pages会自动构建和部署你的网站。通常需要1-2分钟时间。

### 10. 访问你的网站

部署完成后，你的博客可以通过以下地址访问：

```
https://LIMUHEshua.github.io/
```

## 常见问题

### 1. SSH密钥配置

如果遇到SSH权限问题，需要配置SSH密钥：

```bash
# 生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥添加到GitHub
cat ~/.ssh/id_rsa.pub
```

然后在GitHub的 "Settings" -> "SSH and GPG keys" 中添加公钥。

### 2. HTTPS部署

如果使用HTTPS而不是SSH，修改 `_config.yml` 中的部署配置：

```yaml
deploy:
  type: git
  repo: https://github.com/LIMUHEshua/LIMUHEshua.github.io.git
  branch: main
```

### 3. 自定义域名

如果需要使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名，例如：`blog.example.com`
3. 在域名DNS设置中添加CNAME记录指向 `LIMUHEshua.github.io`

### 4. 部署失败

如果部署失败，尝试以下步骤：

```bash
# 清理缓存
hexo clean

# 重新生成
hexo generate

# 检查部署配置
hexo deploy --debug
```

## 自动化部署

### 使用GitHub Actions

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Generate static files
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

## 维护和更新

### 更新博客内容

1. 创建或编辑文章：`hexo new "文章标题"`
2. 编辑文章内容
3. 生成并部署：

```bash
hexo clean && hexo generate && hexo deploy
```

### 更新主题

```bash
cd themes/livemylife
git pull origin master
cd ../..
hexo clean && hexo generate && hexo deploy
```

### 更新依赖

```bash
npm update
npm audit fix
hexo clean && hexo generate && hexo deploy
```

## 性能优化

### 1. 启用压缩

安装压缩插件：

```bash
npm install hexo-generator-feed hexo-generator-sitemap --save
```

### 2. 图片优化

使用图片压缩工具优化图片大小：

```bash
npm install hexo-image-optimizer --save
```

### 3. CDN加速

将静态资源上传到CDN，修改配置文件中的资源路径。

## 监控和分析

### 1. Google Analytics

在 `_config.yml` 中添加：

```yaml
google_analytics: UA-XXXXXXXXX-X
```

### 2. 评论系统

集成第三方评论系统，如Gitalk、Valine等。

## 安全建议

1. 定期更新依赖包
2. 使用HTTPS
3. 不在代码中暴露敏感信息
4. 定期备份博客数据

## 备份策略

定期备份重要文件：

```bash
# 备份配置文件
cp _config.yml _config.yml.backup

# 备份文章
tar -czf posts-backup-$(date +%Y%m%d).tar.gz source/_posts/
```

## 总结

通过以上步骤，你已经成功将Hexo博客部署到GitHub Pages。现在你可以通过 `https://LIMUHEshua.github.io/` 访问你的博客网站。

如需进一步定制或遇到问题，请参考Hexo官方文档或GitHub Pages文档。

## 相关资源

- [Hexo官方文档](https://hexo.io/docs/)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [Hexo部署指南](https://hexo.io/docs/one-command-deployment)
