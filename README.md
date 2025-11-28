# 🏋️ 健身记录 - 移动端健身追踪应用

一个简洁、美观、强大的移动端健身记录网页应用，专为个人健身追踪设计。

## ✨ 功能特点

### 核心功能
- 📝 **训练记录** - 快速记录每次训练的动作、组数、重量和次数
- 📖 **历史查看** - 按日期分组查看所有训练历史，支持搜索和排序
- 📊 **数据统计** - 可视化训练量趋势和单个动作的进步曲线
- ⏱️ **倒计时器** - 组间休息倒计时，支持自定义时长和声音/震动提醒

### 设计亮点
- 🎨 **现代化UI** - 渐变背景、玻璃态效果、流畅的微动画
- 🌙 **深色模式** - 支持浅色/深色主题切换
- 📱 **响应式设计** - 完美适配各种移动设备屏幕
- 💾 **离线可用** - PWA支持，可添加到主屏幕像原生应用一样使用

### 技术特性
- ⚡ **零依赖** - 纯HTML/CSS/JavaScript实现，快速加载
- 🔒 **数据安全** - 所有数据存储在本地浏览器，完全私密
- 📤 **导入导出** - 支持数据备份和迁移
- 🌐 **免费部署** - 可轻松部署到任何静态网站托管平台

## 🚀 快速开始

### 本地运行

1. 克隆或下载项目文件
2. 使用任何Web服务器打开`index.html`，例如：

```bash
# 使用Python 3
python -m http.server 8000

# 使用Node.js的http-server
npx http-server

# 使用PHP
php -S localhost:8000
```

3. 在浏览器中访问 `http://localhost:8000`

### 文件结构

```
Workout/
├── index.html       # 主HTML文件
├── styles.css       # 样式文件
├── app.js          # JavaScript应用逻辑
├── manifest.json   # PWA配置文件
└── README.md       # 项目说明
```

## 🌐 部署到免费平台

### 部署到 GitHub Pages

1. 创建GitHub仓库并上传所有文件
2. 进入仓库设置 → Pages
3. 选择分支（通常是main）
4. 保存，几分钟后即可通过 `https://用户名.github.io/仓库名` 访问

### 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 导入GitHub仓库或直接拖放文件夹
3. 部署完成后自动获得HTTPS域名

### 部署到 Netlify

1. 访问 [netlify.com](https://netlify.com)
2. 拖放项目文件夹到Netlify
3. 自动部署并获得域名

### 部署到 Cloudflare Pages

1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 连接GitHub仓库
3. 选择项目并部署

## 📱 使用指南

### 添加训练记录

1. 在"记录"页面填写动作名称
2. 输入每组的重量和次数（可添加多组）
3. 可选添加备注
4. 点击"保存记录"

### 使用倒计时器

1. 选择预设时长（1分钟、1.5分钟、2分钟、3分钟）
2. 点击"开始"按钮
3. 倒计时结束时会震动和声音提醒

### 查看统计数据

1. 切换到"统计"页面
2. 选择时间周期（周/月/全部）
3. 查看训练量趋势图
4. 在动作选择器中选择特定动作查看进步曲线

### 数据备份

1. 进入"设置"页面
2. 点击"导出数据"下载JSON文件
3. 需要恢复时点击"导入数据"选择文件

## 🎨 自定义

### 修改主题颜色

编辑 `styles.css` 中的CSS变量：

```css
:root {
    --primary: #6366f1;  /* 主色调 */
    --secondary: #ec4899; /* 辅助色 */
    /* 其他颜色... */
}
```

### 添加预设动作

编辑 `index.html` 中的 `datalist`：

```html
<datalist id="exercise-list">
    <option value="你的动作名称">
    <!-- 添加更多... -->
</datalist>
```

## 🔧 技术栈

- **HTML5** - 语义化结构
- **CSS3** - 现代化样式（Grid、Flexbox、动画）
- **Vanilla JavaScript** - 纯JavaScript实现
- **LocalStorage API** - 本地数据持久化
- **Chart.js 4.4.0** - 图表可视化
- **Google Fonts (Inter)** - 现代化字体

## 📊 数据格式

数据以JSON格式存储在LocalStorage中：

```json
{
  "workouts": [
    {
      "id": "唯一ID",
      "date": "ISO日期时间",
      "exercise": "动作名称",
      "sets": [
        {
          "weight": 重量,
          "reps": 次数
        }
      ],
      "notes": "备注"
    }
  ],
  "settings": {
    "theme": "dark"
  }
}
```

## 🌟 未来改进计划

- [ ] 添加训练计划功能
- [ ] 支持自定义动作分类
- [ ] 添加体重记录
- [ ] 训练成就系统
- [ ] 数据云同步（可选）

## 📄 许可证

本项目为个人使用工具，可自由修改和分发。

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**开始你的健身之旅吧！💪**
