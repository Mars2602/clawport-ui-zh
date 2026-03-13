<div align="center">

<img src="https://raw.githubusercontent.com/Mars2602/clawport-ui-zh/main/clawport-logo.png" alt="ClawPort" width="160" />

# ClawPort

**你的 AI 代理团队的可视化指挥中心。**

【本项目仅为clawport项目的中文汉化，项目相关内容请移步原创仓库，会定期同步原项目代码，并更新汉化内容】

[![npm version](https://img.shields.io/npm/v/clawport-ui-zh.svg)](https://www.npmjs.com/package/clawport-ui-zh)
[![license](https://img.shields.io/npm/l/clawport-ui-zh.svg)](LICENSE)
[![tests](https://img.shields.io/badge/tests-781%20passed-brightgreen)](#测试)

[官方网站](https://clawport.dev) | [安装指南](SETUP.md) | [API 文档](docs/API.md) | [npm](https://www.npmjs.com/package/clawport-ui-zh)

</div>

---

ClawPort 是一个用于管理、监控和直接与你的 [OpenClaw](https://openclaw.ai) AI 代理进行对话的开源仪表板。它连接到你的本地 OpenClaw 网关，为你提供组织架构图、支持视觉和语音的代理直接对话、看板、定时任务监控、成本追踪、带实时日志流的活动控制台以及记忆浏览器 —— 所有功能集于一身。

无需单独的 AI API 密钥。所有内容都通过你的 OpenClaw 网关进行路由。

<img src="docs/screenshots/org-map.png" alt="组织架构图" width="100%" />

<details>
<summary><strong>更多截图</strong></summary>

| | |
|---|---|---|
| <img src="docs/screenshots/chat.png" alt="代理对话" /> | <img src="docs/screenshots/kanban.png" alt="看板" /> |
| **对话** -- 流式文本、视觉、语音、文件附件 | **看板** -- 跨代理的拖放任务板 |
| <img src="docs/screenshots/pipelines.png" alt="定时任务流水线" /> | <img src="docs/screenshots/cron-schedule.png" alt="定时任务调度" /> |
| **流水线** -- 带健康检查的 DAG 可视化 | **调度** -- 周热图和任务管理 |
| <img src="docs/screenshots/activity.png" alt="活动控制台" /> | <img src="docs/screenshots/live-logs.png" alt="实时日志" /> |
| **活动** -- 带 JSON 展开功能的历史日志浏览器 | **实时日志** -- 实时流式小组件 |
| <img src="docs/screenshots/costs.png" alt="成本仪表板" /> | <img src="docs/screenshots/memory.png" alt="记忆浏览器" /> |
| **成本** -- Token 使用量、异常检测、优化建议 | **记忆** -- 带 Markdown 渲染的团队记忆浏览器 |

</details>

---

## 快速开始

### 1. 安装 OpenClaw

ClawPort 需要运行中的 [OpenClaw](https://openclaw.ai) 实例。如果你还没有安装：

```bash
# 安装 OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# 运行配置向导（设置工作空间、网关和守护进程）
openclaw onboard --install-daemon
```

配置完成后，验证网关是否正在运行：

```bash
openclaw gateway status
```

你应该能看到网关 URL（默认 `localhost:18789`）和认证令牌。如果你使用自定义端口，`clawport setup` 会自动检测。更多详情请参阅 [OpenClaw 文档](https://docs.openclaw.ai/getting-started)。

### 2. 安装 ClawPort

> **注意：** npm 包名为 `clawport-ui-zh`。CLI 命令为 `clawport`。
> 请勿安装不相关的 `clawport` 包。

```bash
npm install -g clawport-ui-zh
```

### 3. 连接并启动

```bash
# 自动检测 OpenClaw 配置并写入 .env.local
clawport setup

# 启动仪表板
clawport dev
```

打开 [http://localhost:3000](http://localhost:3000)。配置向导会引导你完成命名门户、选择主题和设置操作员身份的步骤。

<details>
<summary><strong>从源码安装</strong></summary>

```bash
git clone https://github.com/Mars2602/clawport-ui-zh.git
cd clawport-ui-zh
npm install
npm run setup
npm run dev
```

</details>

---

## 功能特性

- **组织架构图** -- 你的整个代理团队的交互式组织架构图。一目了然地查看层级结构、定时任务状态和关系。基于 React Flow 的自动布局。
- **对话** -- 流式文本对话、带视觉功能的图片附件、带波形播放的语音消息、文件附件、剪贴板粘贴和拖放。对话内容在本地持久化存储。
- **看板** -- 用于管理跨代理工作的任务板。拖放卡片，支持代理分配和对话上下文。
- **定时任务监控** -- 所有计划任务的实时状态。按状态筛选，将错误排在顶部，展开查看详情。每 60 秒自动刷新。
- **成本仪表板** -- 所有定时任务的 Token 使用量和成本分析。每日成本图表、每个任务的明细、模型分布、异常检测、周环比趋势和缓存节省。
- **活动控制台** -- 历史事件的日志浏览器，外加一个浮动实时流小组件。点击任意日志行展开原始 JSON。实时流小组件在页面导航时保持存在。
- **记忆浏览器** -- 读取团队记忆、长期记忆和每日日志。支持 Markdown 渲染、JSON 语法高亮、搜索和下载。指南选项卡包含分类的最佳实践。
- **代理详情** -- 每个代理的完整资料：SOUL.md 查看器、工具、层级结构、定时任务、语音 ID 和直接对话链接。
- **五种主题** -- 深色、玻璃、彩色、浅色和系统主题。全部使用 CSS 自定义属性 -- 即时切换。
- **自动发现** -- 自动从你的 OpenClaw 工作空间发现代理。无需配置文件。
- **多语言支持** -- 支持中文和英文界面，一键切换语言。

---

## 工作原理

ClawPort 读取你的 OpenClaw 工作空间以发现代理，然后连接到网关进行所有 AI 操作：

```
浏览器  -->  ClawPort (Next.js)  -->  OpenClaw 网关 (默认 localhost:18789)  -->  Claude
                |                          |
                |                     文本: /v1/chat/completions (流式 SSE)
                |                     视觉: openclaw gateway call chat.send (CLI)
                |                     音频: /v1/audio/transcriptions (Whisper)
                |
           读取自:
             $WORKSPACE_PATH/agents/    (代理 SOUL.md 文件)
             $WORKSPACE_PATH/memory/    (团队记忆)
             openclaw cron list         (计划任务)
```

所有 AI 调用 -- 对话、视觉、TTS、转录 -- 都通过网关路由。一个令牌，无需单独的 API 密钥。

---

## 配置

### 必需的环境变量

| 变量 | 描述 | 如何找到 |
|----------|-------------|----------------|
| `WORKSPACE_PATH` | 你的 OpenClaw 工作空间路径 | 默认: `~/.openclaw/agents/main/workspace` (或旧版 `~/.openclaw/workspace`) |
| `OPENCLAW_BIN` | `openclaw` 二进制文件的路径 | 运行 `which openclaw` |
| `OPENCLAW_GATEWAY_TOKEN` | 网关认证令牌 | 运行 `openclaw gateway status` |

### 可选

| 变量 | 描述 |
|----------|-------------|
| `ELEVENLABS_API_KEY` | 用于代理资料上语音指示器的 ElevenLabs API 密钥 |

运行 `clawport setup` 会自动检测所有必需的值并写入 `.env.local`。全局安装时，如果包目录不可写，setup 会写入 `~/.config/clawport-ui/.env.local`。有关手动配置、代理自定义和故障排除，请参阅 [SETUP.md](SETUP.md)。

---

## 代理发现

ClawPort 自动从你的 OpenClaw 工作空间发现代理。无需配置文件。

**扫描内容：**
- `$WORKSPACE_PATH/SOUL.md` -- 根协调器
- `$WORKSPACE_PATH/IDENTITY.md` -- 根代理名称和表情符号
- `agents/<name>/SOUL.md` -- 顶级代理
- `agents/<name>/sub-agents/*.md` -- 扁平子代理文件
- `agents/<name>/members/*.md` -- 团队成员文件
- `agents/<name>/<subdir>/SOUL.md` -- 嵌套子目录代理

**忽略内容：**
- 没有 `SOUL.md` 的目录（例如 `briefs/`、数据文件）
- `sub-agents/` 和 `members/` 中的非 `.md` 文件

如需完全控制名称、颜色、层级结构和工具，请创建 `$WORKSPACE_PATH/clawport/agents.json`。有关架构和示例，请参阅 [SETUP.md](SETUP.md)。

---

## CLI

```bash
clawport dev      # 启动开发服务器
clawport start    # 构建并启动生产服务器
clawport setup    # 自动检测 OpenClaw 配置，写入 .env.local
clawport status   # 检查网关可达性和配置
clawport help     # 显示使用说明
```

---

## 测试

```bash
npm test             # 32 个测试套件共 781 个测试 (Vitest)
npx tsc --noEmit     # 类型检查 (零错误)
npx next build       # 生产构建
```

---

## 技术栈

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev) / [TypeScript 5](https://typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [React Flow](https://reactflow.dev) -- 组织架构图
- [Vitest 4](https://vitest.dev) -- 测试
- [OpenClaw](https://openclaw.ai) -- AI 网关和代理运行时
- [next-intl](https://next-intl-docs.vercel.app/) -- 国际化

---

## 文档

| 文档 | 描述 |
|----------|-------------|
| [SETUP.md](SETUP.md) | 完整安装指南、代理自定义、故障排除 |
| [docs/API.md](docs/API.md) | 所有端点的 REST API 参考 |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | UI 组件目录 (50+ 组件) |
| [docs/THEMING.md](docs/THEMING.md) | 主题系统、CSS 令牌、设置 API |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 如何贡献 |
| [CHANGELOG.md](CHANGELOG.md) | 版本历史 |
| [docs/OPENCLAW.md](docs/OPENCLAW.md) | OpenClaw 集成参考 |
| [CLAUDE.md](CLAUDE.md) | 开发者架构指南 |

---

## 贡献

欢迎贡献。有关开发设置、代码风格和 PR 指南，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

[MIT](LICENSE)

---

由 [Mars](https://github.com/Mars2602) 基于 [John Rice](https://github.com/JohnRiceML) 的原版 [ClawPort](https://github.com/JohnRiceML/clawport-ui) 开发。
