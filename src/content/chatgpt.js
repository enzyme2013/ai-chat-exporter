// ChatGPT 聊天记录提取器

class ChatGPTExtractor {
  /**
   * 检查当前页面是否是 ChatGPT 聊天页面
   */
  static isChatPage() {
    return window.location.hostname === 'chatgpt.com' &&
           window.location.pathname.startsWith('/c/');
  }

  /**
   * 获取会话标题
   * ChatGPT 的标题直接在 document.title 中
   */
  static getTitle() {
    const title = document.title;
    return title || 'Untitled';
  }

  /**
   * 滚动加载所有消息
   * ChatGPT 通常会一次性加载所有消息，但仍尝试滚动以确保
   */
  static async loadAllMessages() {
    const main = document.querySelector('main');
    if (!main) return;

    let prevCount = 0;
    let stableCount = 0;
    const maxIterations = 10;

    // 尝试向上滚动加载历史消息
    for (let i = 0; i < maxIterations; i++) {
      main.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 500));

      const currentCount = document.querySelectorAll('article').length;

      if (currentCount === prevCount) {
        stableCount++;
        if (stableCount > 2) break;
      } else {
        stableCount = 0;
      }

      prevCount = currentCount;

      // 滚动到底部再回到顶部
      main.scrollTo({ top: main.scrollHeight, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 200));
    }

    // 最后滚动到顶部
    main.scrollTo({ top: 0, behavior: 'instant' });
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
        case 'h5':
        case 'h6':
          return `##### ${processChildren(node).trim()}\n\n`;
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
   * ChatGPT 的消息结构：
   * - 用户消息：<article> + <h5>你说：</h5> + .text-base
   * - AI 消息：<article> + <h6>ChatGPT 说：</h6> + .text-base
   */
  static getMessages() {
    const messages = [];
    const articles = document.querySelectorAll('article');

    let currentUser = null;

    articles.forEach(article => {
      const heading = article.querySelector('h5, h6');
      if (!heading) return;

      const isUser = heading.textContent.includes('你说');
      const contentDiv = article.querySelector('.text-base');

      if (!contentDiv) return;

      if (isUser) {
        // 用户消息
        currentUser = contentDiv.textContent?.trim() || '';
      } else {
        // AI 消息 - 转换 HTML 到 Markdown
        const aiMarkdown = this.htmlToMarkdown(contentDiv);
        messages.push({
          user: currentUser || '',
          ai: aiMarkdown
        });
        currentUser = null; // 重置用户消息
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
      return { error: 'Not a ChatGPT chat page' };
    }

    // 先滚动加载所有消息
    await this.loadAllMessages();

    return {
      platform: 'ChatGPT',
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
    ChatGPTExtractor.extract().then(data => {
      sendResponse(data);
    });
    return true; // 保持消息通道开启
  }
});
