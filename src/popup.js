// 国际化翻译
const i18n = {
  'zh': {
    // HTML 文本
    subtitle: '导出 AI 聊天记录为 Markdown',
    loading: '正在检测页面...',
    error: '请在支持的 AI 聊天页面使用此扩展',
    exportBtn: '导出 Markdown',
    exporting: '导出中...',
    exportSuccess: '✓ 导出成功',
    messageCount: '{count} 条消息',

    // Markdown 内容
    mdPlatform: '平台',
    mdExportTime: '导出时间',
    mdMessageCount: '消息数量'
  },
  'en': {
    // HTML 文本
    subtitle: 'Export AI chat history to Markdown',
    loading: 'Detecting page...',
    error: 'Please use this extension on a supported AI chat page',
    exportBtn: 'Export Markdown',
    exporting: 'Exporting...',
    exportSuccess: '✓ Exported',
    messageCount: '{count} messages',

    // Markdown 内容
    mdPlatform: 'Platform',
    mdExportTime: 'Export Time',
    mdMessageCount: 'Message Count'
  }
};

/**
 * 获取浏览器语言，返回 'zh' 或 'en'
 */
function getLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  // 中文（包括 zh-CN, zh-TW, zh-HK 等）返回 'zh'，其他返回 'en'
  return lang.startsWith('zh') ? 'zh' : 'en';
}

/**
 * 获取翻译文本
 */
function t(key, params = {}) {
  const lang = getLanguage();
  const text = i18n[lang]?.[key] || i18n['en'][key] || key;

  // 替换参数，如 {count}
  if (params.count !== undefined) {
    return text.replace('{count}', params.count);
  }
  return text;
}

/**
 * 应用所有翻译到页面
 */
function applyTranslations() {
  // 副标题
  const subtitleEl = document.querySelector('.subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = t('subtitle');
  }

  // 加载中
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.textContent = t('loading');
  }

  // 错误提示
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = t('error');
  }

  // 导出按钮初始文本
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.textContent = t('exportBtn');
  }
}

// Popup 脚本
class Exporter {
  constructor() {
    this.loadingEl = document.getElementById('loading');
    this.errorEl = document.getElementById('error');
    this.readyEl = document.getElementById('ready');
    this.chatTitleEl = document.getElementById('chatTitle');
    this.messageCountEl = document.getElementById('messageCount');
    this.exportBtn = document.getElementById('exportBtn');

    this.chatData = null;

    this.init();
  }

  async init() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // 检测平台并获取对应的 content script 文件
      const platform = this.detectPlatform(tab.url);
      if (!platform) {
        this.showError();
        return;
      }

      // 向 content script 请求数据
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });

      if (response.error) {
        this.showError();
        return;
      }

      this.chatData = response;
      this.showReady();

    } catch (error) {
      // content script 可能未加载，尝试注入
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const platform = this.detectPlatform(tab.url);
        if (!platform) {
          this.showError();
          return;
        }

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [platform.scriptFile]
        });

        // 重试
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
        if (response.error) {
          this.showError();
          return;
        }

        this.chatData = response;
        this.showReady();

      } catch (e) {
        this.showError();
      }
    }
  }

  /**
   * 检测平台并返回对应的配置
   */
  detectPlatform(url) {
    if (!url) return null;

    if (url.includes('gemini.google.com')) {
      return { name: 'Gemini', scriptFile: 'content/gemini.js' };
    }
    if (url.includes('chat.deepseek.com')) {
      return { name: 'DeepSeek', scriptFile: 'content/deepseek.js' };
    }
    return null;
  }

  showError() {
    this.loadingEl.classList.add('hidden');
    this.errorEl.classList.remove('hidden');
    this.readyEl.classList.add('hidden');
  }

  showReady() {
    this.loadingEl.classList.add('hidden');
    this.errorEl.classList.add('hidden');
    this.readyEl.classList.remove('hidden');

    this.chatTitleEl.textContent = this.chatData.title;
    this.messageCountEl.textContent = t('messageCount', { count: this.chatData.messages.length });

    this.exportBtn.textContent = t('exportBtn');
    this.exportBtn.addEventListener('click', () => this.export());
  }

  showExporting() {
    this.exportBtn.disabled = true;
    this.exportBtn.textContent = t('exporting');
  }

  showExportSuccess() {
    this.exportBtn.textContent = t('exportSuccess');
    this.exportBtn.style.background = '#34a853';
    setTimeout(() => {
      this.exportBtn.disabled = false;
      this.exportBtn.textContent = t('exportBtn');
      this.exportBtn.style.background = '';
    }, 2000);
  }

  export() {
    if (!this.chatData) return;

    this.showExporting();

    // 生成包含标题的文件名
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // 清理文件名中的非法字符，保留中文和字母数字
    const safeTitle = this.chatData.title
      .replace(/[<>:"/\\|?*]/g, '-')  // 替换非法字符
      .replace(/\s+/g, '_')           // 空格替换为下划线
      .substring(0, 50);              // 限制长度

    const filename = `${safeTitle}_${dateStr}_${timeStr}.md`;
    console.log('Exporting to file:', filename);

    // 生成 Markdown 内容（使用国际化文本）
    let markdown = `# ${this.chatData.title}\n\n`;
    markdown += `**${t('mdPlatform')}:** ${this.chatData.platform}\n`;
    markdown += `**${t('mdExportTime')}:** ${new Date().toLocaleString()}\n`;
    markdown += `**${t('mdMessageCount')}:** ${this.chatData.messages.length}\n\n`;
    markdown += `---\n\n`;

    for (const msg of this.chatData.messages) {
      if (msg.user) {
        markdown += `👤 User: ${msg.user}\n\n`;
      }
      if (msg.ai) {
        markdown += `🤖 AI: ${msg.ai}\n\n`;
      }
      markdown += `---\n\n`;
    }

    // 使用传统的下载方式
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 创建临时链接并触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showExportSuccess();
    }, 100);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 应用翻译
  applyTranslations();
  // 启动导出器
  new Exporter();
});
