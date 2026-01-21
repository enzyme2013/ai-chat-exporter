# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI Chat Exporter 是一个浏览器扩展，用于导出 Gemini、DeepSeek 等 AI 聊天平台的对话记录为 Markdown 文件。

## 开发指南

### 项目构建

这是一个 **Manifest V3** 浏览器扩展项目，使用 **CRXJS + Vite** 作为构建工具。

**项目结构：**
- 源代码位于 `src/` 目录
- 构建输出到 `dist/` 目录
- 开发时支持热更新（HMR）

**常用命令：**
- `npm install` - 安装依赖
- `npm run dev` - 启动开发服务器（支持热更新）
- `npm run build` - 构建生产版本
- `npm run build:zip` - 构建并打包为 zip（用于发布）

**加载扩展进行测试：**
1. 首次使用运行 `npm install` 安装依赖
2. 运行 `npm run dev` 启动开发服务器（或 `npm run build` 构建一次）
3. Chrome/Edge: 访问 `chrome://extensions/`, 开启"开发者模式", 点击"加载已解压的扩展程序", 选择 `dist` 文件夹
4. Firefox: 访问 `about:debugging#/runtime/this-firefox`, 点击"临时加载附加组件", 选择 `dist/manifest.json`

**开发模式特点：**
- 修改源代码后 Vite 会自动重新构建
- Content Scripts 和 Popup 修改会自动生效（需在扩展页面点击刷新）
- 无需手动重新加载扩展

### 项目架构

扩展采用 **Content Script + Popup 消息传递** 架构：

**核心流程：**
1. 用户在 AI 平台聊天页面点击扩展图标
2. Popup 打开并检测当前平台（通过 URL 匹配）
3. Popup 向对应的 Content Script 发送 `extract` 消息
4. Content Script 滚动加载所有消息（处理虚拟滚动）并提取数据
5. Popup 接收数据并生成 Markdown 文件下载

**关键组件：**

- **popup.js**: 主控制器，负责平台检测、消息通信、Markdown 生成和文件下载
  - `detectPlatform()`: 根据 URL 返回平台配置（名称和脚本文件）
  - `Exporter.export()`: 生成 Markdown 并触发浏览器下载
  - 支持中英双语（基于 `navigator.language` 自动切换）

- **content/\*.js**: 平台特定的内容脚本，负责从页面 DOM 提取聊天数据
  - 每个平台一个独立的 `Extractor` 类
  - `isChatPage()`: 验证当前页面是否为有效的聊天页面
  - `loadAllMessages()`: 处理虚拟滚动，向上滚动加载历史消息
  - `getMessages()`: 从 DOM 选择器提取用户消息和 AI 回复
  - `htmlToMarkdown()`: 递归转换 HTML 到 Markdown（保留格式）
  - 通过 `chrome.runtime.onMessage` 监听 `extract` 动作

- **manifest.json**: 定义扩展配置
  - `content_scripts`: 为每个平台匹配 URL 并注入对应脚本
  - `permissions`: `activeTab`（访问当前标签）、`scripting`（动态注入脚本）、`downloads`（可选，当前使用 Blob 下载）

### 添加新平台支持

在 `src/content/` 目录下创建新脚本（如 `claude.js`）：

```javascript
class ClaudeExtractor {
  static isChatPage() {
    // 返回 true/false 检查是否为有效聊天页面
  }

  static getTitle() {
    // 从 DOM 提取会话标题
  }

  static async loadAllMessages() {
    // 处理虚拟滚动，向上滚动加载所有消息
    // 参考现有平台的实现模式
  }

  static htmlToMarkdown(element) {
    // 可复用 gemini.js 或 deepseek.js 的实现
  }

  static getMessages() {
    // 使用平台特定的 DOM 选择器提取消息
    // 返回格式: [{ user: '...', ai: '...' }]
  }

  static async extract() {
    await this.loadAllMessages();
    return {
      platform: 'Claude',
      title: this.getTitle(),
      messages: this.getMessages(),
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    ClaudeExtractor.extract().then(data => sendResponse(data));
    return true;
  }
});
```

然后在以下文件中添加配置：

1. **src/manifest.json**: 在 `content_scripts` 数组中添加：
```json
{
  "matches": ["https://claude.ai/*"],
  "js": ["content/claude.js"],
  "run_at": "document_idle"
}
```

2. **src/popup.js**: 在 `detectPlatform()` 方法中添加：
```javascript
if (url.includes('claude.ai')) {
  return { name: 'Claude', scriptFile: 'content/claude.js' };
}
```

### 关键技术点

**虚拟滚动处理：**
- Gemini 和 DeepSeek 都使用虚拟滚动，需要向上滚动到顶部触发历史消息加载
- 通过监测消息数量变化判断是否加载完成（连续 3 次无新增则停止）
- 最大迭代次数限制防止无限循环（30-50 次）

**HTML 到 Markdown 转换：**
- 递归遍历 DOM 树，根据标签名生成对应 Markdown 语法
- 支持标题、列表、代码块、链接、引用等常见格式
- 清理多余空行保持输出整洁

**消息提取模式差异：**
- Gemini: 每个对话容器包含用户消息（`.query-text`）和 AI 消息（`.markdown-main-panel`）
- DeepSeek: 用户消息和 AI 消息是独立的 `.ds-message` 元素，通过 `.ds-markdown` 区分

### 国际化 (i18n)

项目内置中英双语支持，不使用 Chrome i18n API：

- `popup.js` 顶部定义 `i18n` 对象包含所有翻译文本
- `getLanguage()`: 检测浏览器语言（中文返回 `zh`，其他返回 `en`）
- `t(key, params)`: 获取翻译文本并支持参数替换（如 `{count}`）
- `applyTranslations()`: 在 DOM 加载完成后应用所有翻译

添加新翻译文本时：
1. 在 `i18n.zh` 和 `i18n.en` 中添加相同 key
2. 在代码中使用 `t('key')` 调用

### 调试技巧

**调试 Content Script：**
- 在目标网页按 `F12` 打开开发者工具
- 在 Console 中直接测试 DOM 选择器：`document.querySelectorAll('.ds-message')`
- 查看滚动加载效果：监测元素数量变化

**调试 Popup：**
- 在扩展图标右键选择"检查弹出窗口"（需先打开 popup）
- 或在 `chrome://extensions/` 页面点击"检查视图"

**常见问题：**
- Content Script 未加载：检查 `manifest.json` 中的 `matches` 规则是否匹配目标 URL
- 消息提取失败：使用 `console.log` 输出 DOM 选择器结果验证
- 虚拟滚动问题：调整 `loadAllMessages()` 中的等待时间和迭代次数
