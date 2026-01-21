# AI Chat Exporter

导出 Gemini、DeepSeek 等 AI 聊天平台记录为 Markdown 文件的浏览器扩展。

## 当前功能

- ✅ 支持 Gemini 聊天记录导出
- ✅ 支持 DeepSeek 聊天记录导出
- ✅ 支持 ChatGPT 聊天记录导出
- 🚧 更多平台计划中

## 安装方法

### 从发布版本安装（推荐用户）

1. 在 [Releases](../../releases) 页面下载最新版本的 `.zip` 文件
2. 解压缩下载的文件
3. 打开浏览器，进入 `chrome://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

### Chrome / Edge（从源码）

1. 克隆此仓库
2. 安装依赖：`npm install`
3. 构建扩展：`npm run build`
4. 打开浏览器，进入 `chrome://extensions/`
5. 开启右上角的"开发者模式"
6. 点击"加载已解压的扩展程序"
7. 选择 `dist` 文件夹

### Firefox

1. 克隆此仓库
2. 安装依赖：`npm install`
3. 构建扩展：`npm run build`
4. 打开浏览器，进入 `about:debugging#/runtime/this-firefox`
5. 点击"临时加载附加组件"
6. 选择 `dist` 文件夹中的 `manifest.json`

## 使用方法

### Gemini
1. 登录 [Gemini](https://gemini.google.com)
2. 打开一个聊天会话
3. 点击浏览器工具栏中的扩展图标
4. 点击"导出 Markdown"按钮
5. 选择保存位置

### DeepSeek
1. 登录 [DeepSeek](https://chat.deepseek.com)
2. 打开一个聊天会话
3. 点击浏览器工具栏中的扩展图标
4. 点击"导出 Markdown"按钮
5. 选择保存位置

### ChatGPT
1. 登录 [ChatGPT](https://chatgpt.com)
2. 打开一个聊天会话
3. 点击浏览器工具栏中的扩展图标
4. 点击"导出 Markdown"按钮
5. 选择保存位置

## 项目结构

```
ai-chat-exporter/
├── src/                  # 源代码目录
│   ├── manifest.json     # 扩展配置文件
│   ├── popup.html        # 弹窗界面
│   ├── popup.js          # 弹窗逻辑
│   ├── content/          # 内容脚本
│   │   ├── gemini.js     # Gemini 页面脚本
│   │   ├── deepseek.js   # DeepSeek 页面脚本
│   │   └── chatgpt.js    # ChatGPT 页面脚本
│   └── icons/            # 扩展图标
├── dist/                 # 构建输出目录（自动生成）
├── package.json          # 项目配置和依赖
├── vite.config.js        # Vite 构建配置
├── .gitignore            # Git 忽略文件
├── CLAUDE.md             # 开发指南
└── README.md             # 项目说明
```

## 开发

### 前置要求

- Node.js 18+ 和 npm

### 安装依赖

```bash
npm install
```

### 开发模式

启动开发服务器，支持热更新：

```bash
npm run dev
```

然后在浏览器中加载 `dist` 文件夹作为未打包的扩展。修改源代码后会自动重新构建。

### 构建

构建生产版本：

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 打包

打包为 `.zip` 文件（用于发布）：

```bash
npm run build:zip
```

将在项目根目录生成 `ai-chat-exporter-v{version}.zip` 文件。

## 发布流程

本项目使用 GitHub Actions 自动化发布流程：

### 创建新版本

1. 更新 `package.json` 中的版本号
2. 提交变更：`git commit -am "chore: bump version to x.x.x"`
3. 推送到 GitHub：`git push`
4. 创建并推送版本标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### 自动化构建

推送标签后，GitHub Actions 将自动：
- ✅ 构建扩展
- ✅ 打包为 zip 文件
- ✅ 创建 GitHub Release
- ✅ 上传构建产物到 Release

用户即可在 [Releases](../../releases) 页面下载最新版本。

### CI/CD

- **CI**: 每次 push 和 pull request 都会自动运行构建测试
- **Release**: 推送 `v*.*.*` 标签时自动创建 Release

## 导出格式

导出的 Markdown 文件包含：

- 会话标题
- 平台信息
- 导出时间
- 完整对话记录（用户消息用 👤 标识，AI 回复用 🤖 标识）

## 开发计划

- [x] DeepSeek 支持
- [x] ChatGPT 支持
- [ ] Claude 支持
- [ ] 批量导出会话
- [ ] 更多导出格式（JSON、HTML、PDF）
- [ ] 导出历史记录

## 许可证

MIT License
