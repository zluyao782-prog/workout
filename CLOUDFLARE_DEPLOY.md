# 🚀 Cloudflare Pages自动部署配置指南

本项目已配置GitHub Actions自动部署到Cloudflare Pages。

## 📋 配置步骤

### 1. 获取Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击右上角头像 → **My Profile** → **API Tokens**
3. 点击 **Create Token**
4. 选择 **Edit Cloudflare Workers** 模板（或创建自定义token）
5. 权限设置：
   - Account - Cloudflare Pages: Edit
6. 点击 **Continue to summary** → **Create Token**
7. **复制并保存**这个Token（只显示一次）

### 2. 获取Cloudflare Account ID

1. 在Cloudflare Dashboard首页
2. 右侧可以看到 **Account ID**
3. 复制这个ID

### 3. 在GitHub配置Secrets

1. 进入GitHub仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加两个secrets：

   **Secret 1:**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: 粘贴步骤1获取的API Token

   **Secret 2:**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: 粘贴步骤2获取的Account ID

### 4. 在Cloudflare创建Pages项目

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
2. 点击 **Create a project**
3. **Direct Upload** 或 **Connect to Git**
4. 项目名称填写：`workout`（与workflow中的project-name一致）
5. 完成创建

## ✅ 完成后

配置完成后，每次你push代码到main分支：

```bash
git add .
git commit -m "更新内容"
git push
```

GitHub Actions会自动：
1. 检测到代码推送
2. 运行部署工作流
3. 将代码部署到Cloudflare Pages
4. 几秒钟后自动上线

## 🔍 查看部署状态

### GitHub Actions
- 仓库页面 → **Actions** 标签
- 查看每次部署的日志和状态

### Cloudflare Pages
- [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
- 查看部署历史和访问URL

## 🌐 访问地址

部署成功后，你的应用会部署到：
- `https://workout.pages.dev`
- 或你的自定义域名

## 🛠️ 自定义配置

### 修改项目名称
编辑 `.github/workflows/deploy.yml`：
```yaml
command: pages deploy . --project-name=你的项目名 --branch=main
```

### 部署特定目录
如果只需部署特定目录（如`dist`或`build`）：
```yaml
command: pages deploy ./dist --project-name=workout --branch=main
```

### 添加构建步骤
如果需要构建过程（本项目不需要）：
```yaml
- name: Build
  run: npm run build

- name: Deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy ./dist --project-name=workout --branch=main
```

## ⚠️ 注意事项

1. **项目名称必须匹配**：workflow中的`--project-name`要和Cloudflare Pages中的项目名一致
2. **API Token权限**：确保Token有Cloudflare Pages的编辑权限
3. **首次部署**：第一次可能需要在Cloudflare手动创建项目
4. **分支名称**：确保workflow触发的分支和部署的分支一致

## 🐛 故障排查

### Actions失败
1. 检查Secrets是否正确配置
2. 查看Actions日志获取详细错误信息
3. 确认API Token权限

### 部署成功但访问404
1. 确认Cloudflare Pages项目已创建
2. 检查项目名称是否匹配
3. 查看Cloudflare Pages的部署日志

---

**配置完成后，你就实现了全自动化部署！** 🎉
