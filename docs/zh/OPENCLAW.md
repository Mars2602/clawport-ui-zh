# OpenClaw 集成参考

本文档介绍 ClawPort 如何与 [OpenClaw](https://openclaw.ai) 集成——OpenClaw 是驱动仪表盘背后一切的 AI 代理运行时。

## 概述

OpenClaw 是运行时层，ClawPort 是 UI 层。这种分离是有意为之的：

| 层级 | 职责 | 仓库 |
|-------|---------------|------------|
| **OpenClaw** | 代理执行、网关 API、计划任务调度、内存管理、CLI | [openclaw.ai](https://openclaw.ai) |
| **ClawPort** | 仪表盘 UI、可视化、聊天界面、设置、主题 | [clawport-ui](https://github.com/JohnRiceML/clawport-ui) |

ClawPort 不会直接执行代理。它读取工作区数据、调用网关端点、并调用 CLI 命令来呈现信息和转发用户操作。

## ClawPort 如何读取工作区数据

ClawPort 使用 `$WORKSPACE_PATH` 从 OpenClaw 工作区读取代理和运营数据：

| 数据 | 来源 | ClawPort 用途 |
|------|--------|----------------|
| 代理 | `$WORKSPACE_PATH/agents/*/SOUL.md` | 代理发现、组织架构图、配置 |
| 根代理 | `$WORKSPACE_PATH/SOUL.md`、`IDENTITY.md` | 根协调器节点 |
| 内存 | `$WORKSPACE_PATH/memory/` | 内存浏览器 |
| 计划任务运行 | `$WORKSPACE_PATH/cron-runs/` | 成本仪表盘、活动日志 |
| 代理注册表覆盖 | `$WORKSPACE_PATH/clawport/agents.json` | 自定义代理名称、颜色、层级 |
| 流水线配置 | `$WORKSPACE_PATH/clawport/pipelines.json` | 计划任务流水线 DAG |
| OpenClaw 配置 | `$WORKSPACE_PATH/../openclaw.json` | 内存状态、网关设置 |

## 网关 HTTP 端点

ClawPort 通过 OpenClaw 网关（默认 `localhost:18789`）路由所有 AI 调用：

| 端点 | 方法 | 用途 | ClawPort 用途 |
|----------|--------|---------|----------------|
| `/v1/chat/completions` | POST | 文本聊天（SSE 流式） | 代理聊天、健康检查、成本分析、流水线向导 |
| `/v1/audio/transcriptions` | POST | Whisper 转录 | 语音消息转录 |

网关代理请求到 Claude，使用工作区配置的 API 密钥。ClawPort 使用 `OPENCLAW_GATEWAY_TOKEN` 进行认证。

## CLI 命令

对于需要设备密钥对签名或未通过 HTTP 公开的操作，ClawPort 调用 `openclaw` CLI：

| 命令 | 用途 | ClawPort 用途 |
|---------|---------|----------------|
| `openclaw cron list --json` | 列出所有计划任务 | 计划任务监控、流水线图 |
| `openclaw logs --follow --json` | 流式传输实时日志 | 实时流小部件 |
| `openclaw gateway call chat.send` | 发送带附件的消息 | 视觉流水线（图片聊天） |
| `openclaw gateway call chat.history` | 获取对话历史 | 视觉流水线（轮询响应） |
| `openclaw gateway call health` | 检查网关健康 | 状态检查、调试 |

**为什么用 CLI 处理视觉？** 网关的 HTTP 端点会从消息中剥离 `image_url` 内容。CLI 有 `operator.write` 作用域的设备密钥，而 `chat.send` 需要这个作用域。ClawPort 通过 CLI 发送图片，然后轮询 `chat.history` 获取响应。

## 代理客户端协议（ACP）

ACP 是 OpenClaw 用于外部工具与运行中的代理会话交互的协议。关键概念：

- **会话** — 由 `sessionKey`（如 `agent:main:clawport`）标识，会话限定客户端与代理之间的对话
- **设备密钥** — 写操作的密钥对认证；CLI 自动管理这些
- **作用域** — `operator.read`（通过 HTTP）和 `operator.write`（通过 CLI 带设备密钥）

ClawPort 通过上述网关端点和 CLI 命令隐式使用 ACP。视觉流水线是主要的 ACP 使用者，使用 `chat.send` 和 `chat.history` 方法。

## 最近的 OpenClaw 功能

与 ClawPort 相关的最近 OpenClaw 版本发布的功能：

### v2026.3.7 — 上下文引擎插件

- 可插拔的上下文引擎，代理可以用自定义提供者扩展
- 代理可以在 SOUL.md 配置中注册上下文插件
- ClawPort 通过代理详情视图呈现此功能（工具和能力）

### v2026.3.8 — 备份与溯源

- `openclaw backup create` / `openclaw backup restore` — 工作区备份命令
- 代理输出的溯源跟踪（哪个代理在何时产生什么）
- ClawPort 的活动控制台可以在日志条目中显示溯源元数据

### ACP 会话

- 客户端与代理之间的持久对话会话
- 会话历史在网关重启后保留
- ClawPort 的聊天持久化（localStorage）补充服务器端 ACP 会话历史

### TUI 工作区推断

- OpenClaw TUI 从当前目录自动推断活动工作区
- `clawport setup` 使用相同的检测逻辑来设置 `WORKSPACE_PATH`

## 贡献者的职责边界

了解什么属于哪里可以防止错误路由的贡献：

### 属于 ClawPort（本仓库）

- 仪表盘 UI 组件和页面
- 数据可视化（图表、图、组织架构图）
- 聊天界面和消息渲染
- 主题系统和设置
- 客户端斜杠命令
- 读取和显示工作区数据

### 属于 OpenClaw（上游）

- 代理执行和编排
- 网关协议和端点
- 计划任务调度和执行
- 内存管理和存储
- CLI 命令和标志
- ACP 协议更改
- 新代理能力或工具

### 灰色地带（先讨论）

- 调用当前未使用的新 CLI 命令的新 API 路由
- 需要新 OpenClaw CLI 标志或网关端点的功能
- 工作区数据结构或发现方式的更改

如有疑问，请打开一个问题描述你想构建的内容，我们会帮助确定正确的位置。
