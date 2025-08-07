# 原子Markdown编辑器
# AtomicMarkDown
[![star](https://gitee.com/honghutechnology/AtomicMarkDown/badge/star.svg?theme=dark)](https://gitee.com/honghutechnology/AtomicMarkDown/stargazers)
![GitHub Repo stars](https://gihub.com/honghutechnology/AtomicMarkDown/)
## 项目概述

原子Markdown编辑器是由鸿鹄科技开发的，基于React开发的现代化在线Markdown编辑器，提供了强大的编辑功能、实时预览、多主题支持和多种导出格式。该项目采用最新的前端技术栈，为用户提供流畅、高效的Markdown编辑体验。

## 技术栈

### 核心技术
- **React 19.1.1** - 前端框架，提供组件化开发
- **React DOM 19.1.1** - DOM操作支持
- **React Redux 9.2.0** - 状态管理
- **Redux 5.0.1** - 状态管理库

### 编辑器相关
- **Monaco Editor 4.7.0** - 代码编辑器内核（VS Code同款）
- **Monaco Editor React 1.0.2** - Monaco Editor的React封装

### Markdown处理
- **Marked 16.1.2** - Markdown解析器
- **DOMPurify 3.2.6** - HTML内容净化，防止XSS攻击
- **Highlight.js 11.11.1** - 代码语法高亮

### 导出功能
- **html2canvas 1.4.1** - 将HTML转换为Canvas
- **jsPDF 3.0.1** - PDF生成库

### 开发工具
- **React Scripts 5.0.1** - Create React App工具链

## 核心功能

### 1. 实时编辑与预览
- 左右分栏布局，左侧编辑，右侧实时预览
- 支持标准Markdown语法
- 实时渲染，所见即所得

### 2. 多主题支持
- **经典白** - 明亮主题，适合白天使用
- **深邃黑** - 暗色主题，保护眼睛
- **科技蓝** - 蓝色主题，科技感十足
- **清新绿** - 绿色主题，护眼舒适
- **优雅紫** - 紫色主题，优雅大方

### 3. 代码编辑器功能
- 基于Monaco Editor，提供VS Code级别的编辑体验
- 语法高亮支持
- 自动换行
- 行号显示
- 平滑滚动
- 主题自适应

### 4. 工具栏功能
- **标题插入** - H1、H2、H3标题快捷插入
- **文本格式** - 加粗、斜体、删除线
- **引用和代码** - 引用块、代码块插入
- **列表功能** - 有序/无序列表
- **分割线** - 快速插入分割线

### 5. 多格式导出
- **PNG图片导出** - 高分辨率截图，支持3倍缩放
- **PDF文档导出** - 自动分页，高质量输出
- **HTML文件导出** - 完整HTML页面，包含样式
- **Markdown文件导出** - 原始Markdown文本

### 6. 数据持久化
- 自动保存到localStorage
- 防抖机制避免频繁保存
- 主题选择记忆功能

### 7. 响应式设计
- 适配不同屏幕尺寸
- 灵活的布局系统
- 优雅的过渡动画

## 项目结构

```
atomicmarkdown/
├── public/
│   └── index.html              # 主HTML文件
├── src/
│   ├── components/
│   │   ├── Editor.js           # 编辑器组件
│   │   ├── Preview.js          # 预览组件
│   │   └── Toolbar.js          # 工具栏组件
│   ├── App.css                 # 应用样式
│   ├── App.js                  # 主应用组件
│   ├── index.css               # 全局样式
│   └── index.js                # 入口文件
├── package.json                # 项目配置和依赖
├── .env                        # 环境变量
├── .gitignore                  # Git忽略文件
└── LICENSE                     # 许可证
```

## 部署指南

### 环境要求
- **Node.js** 版本 16.0.0 或更高
- **npm** 版本 8.0.0 或更高
- **Git** （用于版本控制）

### 本地开发部署

#### 1. 克隆项目
```bash
git clone <项目地址>
cd atomicmarkdown
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 启动开发服务器
```bash
npm start
```

开发服务器将在 `http://localhost:3000` 启动，支持热重载。

#### 4. 构建生产版本
```bash
npm run build
```

构建完成后，生成的文件将位于 `build/` 目录中。

### 生产环境部署

#### 静态文件部署
1. 执行构建命令：
   ```bash
   npm run build
   ```

2. 将 `build/` 目录中的文件部署到Web服务器

#### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Docker部署
1. 创建 `Dockerfile`：
   ```dockerfile
   FROM node:18-alpine as builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/build /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. 构建Docker镜像：
   ```bash
   docker build -t atomic-markdown .
   ```

3. 运行容器：
   ```bash
   docker run -p 80:80 atomic-markdown
   ```

### 云平台部署

#### Vercel部署
1. 推送代码到GitHub仓库
2. 在Vercel中导入项目
3. 自动检测为React应用并部署

#### Netlify部署
1. 推送代码到GitHub仓库
2. 在Netlify中连接仓库
3. 设置构建设置：
   - Build command: `npm run build`
   - Publish directory: `build`

#### 阿里云/腾讯云部署
1. 构建项目：`npm run build`
2. 上传 `build/` 目录到对象存储
3. 配置静态网站托管
4. 绑定自定义域名

## 性能优化

### 代码分割
- React.lazy 实现组件懒加载
- 路由级别的代码分割

### 缓存策略
- 静态资源长期缓存
- Service Worker离线缓存

### 构建优化
- 生产环境代码压缩
- Tree-shaking移除无用代码
- Source Map生成

## 安全考虑

### XSS防护
- 使用DOMPurify净化HTML内容
- 严格的CSP策略

### 内容安全
- 禁用危险的Markdown特性
- 限制文件上传类型

## 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清除缓存后重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. 样式问题
- 检查CSS文件路径
- 确认主题切换逻辑
- 验证浏览器兼容性

#### 3. 导出功能异常
- 确认浏览器支持Canvas API
- 检查跨域资源访问
- 验证文件下载权限

### 调试技巧
- 使用React Developer Tools
- 浏览器开发者工具网络面板
- 控制台错误日志分析

## 贡献指南

### 开发流程
1. Fork项目仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -m 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循React最佳实践
- 组件化开发模式

## 许可证

本项目采用 ISC 许可证，详见 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

原子Markdown编辑器致力于为用户提供最佳Markdown编辑体验，持续更新和改进功能。感谢您的使用和支持！
        