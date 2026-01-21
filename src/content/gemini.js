// Gemini 聊天记录提取器

class GeminiExtractor {
  /**
   * 检查当前页面是否是 Gemini 聊天页面
   */
  static isChatPage() {
    return window.location.hostname === 'gemini.google.com' &&
           window.location.pathname.startsWith('/app/');
  }

  /**
   * 获取会话标题
   */
  static getTitle() {
    // 查找包含会话标题的按钮（排除 New chat 等）
    const buttons = Array.from(document.querySelectorAll('button'));
    const titleBtn = buttons.find(b => {
      const text = b.textContent?.trim();
      return text &&
             text !== 'New chat' &&
             text !== 'Temporary chat' &&
             text !== 'Main menu' &&
             text.length > 0 &&
             text.length < 100;
    });
    return titleBtn?.textContent?.trim() || 'Untitled';
  }

  /**
   * 滚动加载所有消息（处理虚拟滚动）
   * Gemini 使用自定义的 <infinite-scroller> 元素，需要滚动该元素来触发历史消息加载
   */
  static async loadAllMessages() {
    // 获取聊天历史容器
    const scroller = document.querySelector('infinite-scroller.chat-history');
    if (!scroller) {
      // 降级：尝试使用 window 滚动
      console.warn('infinite-scroller not found, falling back to window scroll');
      return this.loadAllMessagesFallback();
    }

    let prevCount = 0;
    let stableCount = 0;
    const maxIterations = 30;

    // 持续向上滚动直到没有新消息
    for (let i = 0; i < maxIterations; i++) {
      // 滚动到顶部触发加载历史消息
      scroller.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 500));

      const currentCount = document.querySelectorAll('.conversation-container').length;

      if (currentCount === prevCount) {
        stableCount++;
        if (stableCount > 3) {
          // 连续 3 次没有新消息，认为已加载完毕
          break;
        }
      } else {
        stableCount = 0;
      }

      prevCount = currentCount;

      // 滚动到底部再回到顶部，触发加载
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 200));
    }

    // 最后滚动到顶部，确保从第一条消息开始读取
    scroller.scrollTo({ top: 0, behavior: 'instant' });
  }

  /**
   * 降级方案：使用 window 滚动（兼容旧版本或其他页面结构）
   */
  static async loadAllMessagesFallback() {
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));

    let prevCount = 0;
    let stableCount = 0;

    for (let i = 0; i < 50; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 200));

      const currentCount = document.querySelectorAll('.conversation-container').length;
      if (currentCount === prevCount) {
        stableCount++;
        if (stableCount > 3) break;
      } else {
        stableCount = 0;
      }
      prevCount = currentCount;
    }

    window.scrollTo(0, 0);
  }

  /**
   * 将 HTML 转换为 Markdown（保留格式）
   */
  static htmlToMarkdown(element) {
    if (!element) return '';

    let markdown = '';

    // 递归处理子节点
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tag = node.tagName.toLowerCase();

      // 处理不同的 HTML 标签
      switch (tag) {
        case 'p':
          return processChildren(node) + '\n\n';
        case 'br':
          return '\n';
        case 'h1':
          return `# ${processChildren(node).trim()}\n\n`;
        case 'h2':
          return `## ${processChildren(node).trim()}\n\n`;
        case 'h3':
          return `### ${processChildren(node).trim()}\n\n`;
        case 'h4':
          return `#### ${processChildren(node).trim()}\n\n`;
        case 'strong':
        case 'b':
          return `**${processChildren(node)}**`;
        case 'em':
        case 'i':
          return `*${processChildren(node)}*`;
        case 'code':
          return `\`${node.textContent}\``;
        case 'pre':
          const code = node.querySelector('code')?.textContent || node.textContent;
          return `\n\`\`\`\n${code}\n\`\`\`\n\n`;
        case 'ul':
          let ul = '';
          node.querySelectorAll(':scope > li').forEach(li => {
            ul += `- ${processChildren(li).trim()}\n`;
          });
          return ul + '\n';
        case 'ol':
          let ol = '';
          node.querySelectorAll(':scope > li').forEach((li, i) => {
            ol += `${i + 1}. ${processChildren(li).trim()}\n`;
          });
          return ol + '\n';
        case 'li':
          return processChildren(node);
        case 'a':
          const href = node.getAttribute('href') || '';
          const text = processChildren(node);
          return href ? `[${text}](${href})` : text;
        case 'blockquote':
          return `> ${processChildren(node).trim()}\n\n`;
        case 'hr':
        case 'separator':
          return '---\n\n';
        case 'div':
        case 'span':
        case 'main':
        case 'section':
        case 'article':
          // 保留这些容器中的内容
          return processChildren(node);
        default:
          return processChildren(node);
      }
    }

    function processChildren(node) {
      let result = '';
      node.childNodes.forEach(child => {
        result += processNode(child);
      });
      return result;
    }

    markdown = processNode(element);

    // 清理多余的空行
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * 获取所有消息
   */
  static getMessages() {
    const containers = document.querySelectorAll('.conversation-container');
    return Array.from(containers).map(container => {
      const userText = container.querySelector('.query-text')?.textContent?.trim() || '';
      const aiElement = container.querySelector('.markdown-main-panel');
      const aiText = aiElement ? this.htmlToMarkdown(aiElement) : '';
      return { user: userText, ai: aiText };
    }).filter(msg => msg.user || msg.ai);
  }

  /**
   * 提取完整的聊天数据
   */
  static async extract() {
    if (!this.isChatPage()) {
      return { error: 'Not a Gemini chat page' };
    }

    // 先滚动加载所有消息
    await this.loadAllMessages();

    return {
      platform: 'Gemini',
      title: this.getTitle(),
      messages: this.getMessages(),
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    GeminiExtractor.extract().then(data => {
      sendResponse(data);
    });
    return true; // 保持消息通道开启
  }
});
