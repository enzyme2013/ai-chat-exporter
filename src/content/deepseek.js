// DeepSeek 聊天记录提取器

class DeepSeekExtractor {
  /**
   * 检查当前页面是否是 DeepSeek 聊天页面
   */
  static isChatPage() {
    return window.location.hostname === 'chat.deepseek.com' &&
           window.location.pathname.startsWith('/a/chat/s/');
  }

  /**
   * 获取会话标题
   * DeepSeek 的标题在 document.title 中，格式为 "标题 - DeepSeek"
   */
  static getTitle() {
    const fullTitle = document.title;
    // 移除 " - DeepSeek" 后缀
    return fullTitle.replace(/ - DeepSeek$/, '').trim() || 'Untitled';
  }

  /**
   * 滚动加载所有消息（处理虚拟滚动）
   * DeepSeek 使用 .ds-scroll-area 作为滚动容器
   */
  static async loadAllMessages() {
    // 获取滚动容器
    const scroller = document.querySelector('.ds-scroll-area');
    if (!scroller) {
      console.warn('ds-scroll-area not found');
      return;
    }

    let prevCount = 0;
    let stableCount = 0;
    const maxIterations = 50;

    // 持续向上滚动直到没有新消息
    for (let i = 0; i < maxIterations; i++) {
      // 滚动到顶部触发加载历史消息
      scroller.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 500));

      const currentCount = document.querySelectorAll('.ds-message').length;

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
   * 将 HTML 转换为 Markdown（保留格式）
   * DeepSeek 使用 .ds-markdown 类来格式化 AI 消息
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
        case 'h5':
          return `##### ${processChildren(node).trim()}\n\n`;
        case 'h6':
          return `###### ${processChildren(node).trim()}\n\n`;
        case 'strong':
        case 'b':
          return `**${processChildren(node)}**`;
        case 'em':
        case 'i':
          return `*${processChildren(node)}*`;
        case 'code':
          // 内联代码
          return `\\\`${node.textContent}\\\``;
        case 'pre':
          // 代码块
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
   * DeepSeek 的消息结构：
   * - 用户消息：.ds-message > div (class 是混淆的，没有 .ds-markdown)
   * - AI 消息：.ds-message > .ds-markdown
   */
  static getMessages() {
    const messages = [];
    const messageElements = document.querySelectorAll('.ds-message');

    let currentUser = null;

    messageElements.forEach(msgEl => {
      // 检查是否是 AI 消息（包含 .ds-markdown）
      const aiElement = msgEl.querySelector('.ds-markdown');

      if (aiElement) {
        // AI 消息
        const aiText = this.htmlToMarkdown(aiElement);
        messages.push({
          user: currentUser || '',
          ai: aiText
        });
        currentUser = null; // 重置用户消息
      } else {
        // 用户消息
        const text = msgEl.textContent?.trim();
        if (text) {
          currentUser = text;
        }
      }
    });

    // 过滤空消息
    return messages.filter(msg => msg.user || msg.ai);
  }

  /**
   * 提取完整的聊天数据
   */
  static async extract() {
    if (!this.isChatPage()) {
      return { error: 'Not a DeepSeek chat page' };
    }

    // 先滚动加载所有消息
    await this.loadAllMessages();

    return {
      platform: 'DeepSeek',
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
    DeepSeekExtractor.extract().then(data => {
      sendResponse(data);
    });
    return true; // 保持消息通道开启
  }
});
