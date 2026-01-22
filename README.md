# AI Chat Exporter

AI Chat Exporter - Browser extension to export and save chat history from ChatGPT, Gemini, DeepSeek to Markdown. Download conversations with formatting, code blocks, and structure preserved.

## Features

- ✅ Support for Gemini chat history export
- ✅ Support for DeepSeek chat history export
- ✅ Support for ChatGPT chat history export
- 🚧 More platforms coming soon

## Installation

### From Release (Recommended for Users)

1. Download the latest `.zip` file from the [Releases](../../releases) page
2. Extract the downloaded file
3. Open your browser and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked"
6. Select the extracted folder

### Chrome / Edge (From Source)

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open your browser and navigate to `chrome://extensions/`
5. Enable "Developer mode" in the top right corner
6. Click "Load unpacked"
7. Select the `dist` folder

### Firefox

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open your browser and navigate to `about:debugging#/runtime/this-firefox`
5. Click "Load Temporary Add-on"
6. Select the `manifest.json` file inside the `dist` folder

## Usage

### Gemini

1. Login to [Gemini](https://gemini.google.com)
2. Open a chat conversation
3. Click the extension icon in your browser toolbar
4. Click "Export Markdown" button
5. Choose a location to save the file

### DeepSeek

1. Login to [DeepSeek](https://chat.deepseek.com)
2. Open a chat conversation
3. Click the extension icon in your browser toolbar
4. Click "Export Markdown" button
5. Choose a location to save the file

### ChatGPT

1. Login to [ChatGPT](https://chatgpt.com)
2. Open a chat conversation
3. Click the extension icon in your browser toolbar
4. Click "Export Markdown" button
5. Choose a location to save the file

## Project Structure

```
ai-chat-exporter/
├── src/                  # Source code directory
│   ├── manifest.json     # Extension configuration file
│   ├── popup.html        # Popup interface
│   ├── popup.js          # Popup logic
│   ├── content/          # Content scripts
│   │   ├── gemini.js     # Gemini page script
│   │   ├── deepseek.js   # DeepSeek page script
│   │   └── chatgpt.js    # ChatGPT page script
│   └── icons/            # Extension icons
├── dist/                 # Build output directory (auto-generated)
├── package.json          # Project configuration and dependencies
├── vite.config.js        # Vite build configuration
├── .gitignore            # Git ignore file
├── CLAUDE.md             # Developer guide
└── README.md             # Project documentation
```

## Development

### Prerequisites

- Node.js 18+ and npm

### Install Dependencies

```bash
npm install
```

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

Then load the `dist` folder as an unpacked extension in your browser. The extension will automatically rebuild when you modify source code.

### Build

Build for production:

```bash
npm run build
```

Build artifacts will be output to the `dist/` directory.

### Package

Package as a `.zip` file (for release):

```bash
npm run build:zip
```

This will generate an `ai-chat-exporter-v{version}.zip` file in the project root directory.

## Export Format

Exported Markdown files include:

- Conversation title
- Platform information
- Export timestamp
- Complete conversation history (user messages marked with 👤, AI responses marked with 🤖)

## Roadmap

- [x] DeepSeek support
- [x] ChatGPT support
- [ ] Claude support
- [ ] Batch conversation export
- [ ] More export formats (JSON, HTML, PDF)
- [ ] Export history tracking

## License

MIT License

## 🌎 国际化 / Internationalization

- **[English](README.md)** (This file)
- **[简体中文](README.zh-CN.md)**
