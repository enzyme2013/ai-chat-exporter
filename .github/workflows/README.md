# GitHub Actions Workflows

本目录包含项目的 CI/CD 配置。

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**触发条件：**
- Push 到 `master` 或 `main` 分支
- 创建 Pull Request

**执行步骤：**
1. 检出代码
2. 设置 Node.js 20 环境
3. 安装依赖 (`npm ci`)
4. 构建扩展 (`npm run build`)
5. 上传构建产物（保留 7 天）

**用途：**
- 确保代码变更不会破坏构建
- 提前发现构建错误
- 供 PR 审查时查看构建产物

### 2. Release Workflow (`.github/workflows/release.yml`)

**触发条件：**
- 推送 `v*.*.*` 格式的 Git 标签

**执行步骤：**
1. 检出代码
2. 设置 Node.js 20 环境
3. 安装依赖
4. 构建扩展
5. 打包为 zip 文件
6. 提取版本号
7. 创建 GitHub Release 并上传 zip

**用途：**
- 自动化发布流程
- 生成带版本号的发布包
- 自动生成 Release Notes

## 使用方法

### 创建新版本发布

```bash
# 1. 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. 推送提交和标签
git push && git push --tags

# 3. GitHub Actions 自动构建并创建 Release
```

### 手动创建标签

```bash
# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0
```

### 查看 Workflow 运行状态

访问：https://github.com/enzyme2013/ai-chat-exporter/actions

## 本地测试 Workflow

在推送前，可以使用 `act` 工具在本地测试 GitHub Actions：

```bash
# 安装 act (如果未安装)
# macOS: brew install act
# Linux: https://github.com/nektos/act#installation

# 测试 CI workflow
act -j build

# 测试 Release workflow
act -j release --dry-run
```

## Secrets

无需配置额外的 Secrets，workflow 使用内置的 `GITHUB_TOKEN` 即可。

## 权限

Workflows 需要以下权限（已在 workflow 文件中配置）：
- `contents: write` - 用于创建 Release 和上传文件
