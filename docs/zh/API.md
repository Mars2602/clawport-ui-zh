# ClawPort — API 参考

所有 API 路由都是 Next.js App Router 路由处理程序，位于 `app/api/` 下。
开发期间的基础 URL 是 `http://localhost:3000`。

## 前提条件

| 依赖项 | 所需路由 | 备注 |
|---|---|---|
| OpenClaw 网关（`localhost:18789`） | `/api/chat/[id]`、`/api/tts`、`/api/transcribe`、`/api/kanban/chat/[id]` | 任何 AI 驱动的路由都必须运行 |
| `WORKSPACE_PATH` 环境变量 | `/api/agents`、`/api/memory`、`/api/cron-runs`、`/api/kanban/chat-history/[ticketId]` | `.openclaw/workspace` 的文件系统路径 |
| `OPENCLAW_BIN` 环境变量 | `/api/crons`、`/api/chat/[id]`（视觉路径） | `openclaw` CLI 二进制文件的路径 |
| `OPENCLAW_GATEWAY_TOKEN` 环境变量 | 所有依赖网关的路由 | OpenClaw 网关的认证令牌 |

## 错误格式

所有错误响应共享一致的 JSON 格式：

```json
{ "error": "人类可读的错误消息" }
```

返回适当的 HTTP 状态码和 `Content-Type: application/json`。

---

## 路由

### GET `/api/agents`

返回已注册代理的完整列表，每个代理都从文件系统加载其 SOUL.md 内容。

**数据来源：** JSON 注册表文件（绑定的 `lib/agents.json` 或用户覆盖 `$WORKSPACE_PATH/clawport/agents.json`）+ 工作区文件系统中的 SOUL.md 文件。

#### 请求

无参数。

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `Agent[]` |
| 500 | `application/json` | `{ "error": string }` |

**`Agent` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `id` | `string` |  slug 标识符（如 `"vera"`） |
| `name` | `string` | 显示名称（如 `"VERA"`） |
| `title` | `string` | 职位头衔（如 `"首席战略官"`） |
| `reportsTo` | `string \| null` | 父代理 ID，或 `null` 表示根 |
| `directReports` | `string[]` | 子代理 ID 数组 |
| `soulPath` | `string \| null` | 代理 SOUL.md 文件的路径 |
| `soul` | `string \| null` | 完整的 SOUL.md 内容（请求时加载），如果文件未找到则为 `null` |
| `voiceId` | `string \| null` | ElevenLabs 语音 ID |
| `color` | `string` | 组织图节点十六进制颜色 |
| `emoji` | `string` | Emoji 标识符 |
| `tools` | `string[]` | 此代理有权访问的工具 |
| `crons` | `CronJob[]` | 始终从此端点返回 `[]`（客户端填充） |
| `memoryPath` | `string \| null` | 代理内存文件的路径 |
| `description` | `string` | 代理的一行描述 |

#### 示例

```bash
curl http://localhost:3000/api/agents
```

```js
const res = await fetch('/api/agents')
const agents = await res.json()
// agents[0].id => "jarvis"
// agents[0].soul => "# JARVIS\n\nYou are the team's orchestrator..."
```

---

### POST `/api/chat/[id]`

向代理发送聊天消息并接收流式响应。此路由有**两条流水线**，取决于最新的用户消息是否包含图片。

**需要：** OpenClaw 网关在 `localhost:18789` 运行。

#### 路径参数

| 参数 | 类型 | 描述 |
|---|---|---|
| `id` | `string` | 代理 ID（必须匹配已注册的代理） |

#### 请求体

| 字段 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `messages` | `ApiMessage[]` | 是 | 对话历史 |
| `operatorName` | `string` | 否 | 显示给代理的操作员名称。默认为 `"Operator"` |

**`ApiMessage` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `role` | `"user" \| "assistant" \| "system"` | 消息角色 |
| `content` | `string \| ContentPart[]` | 纯文本或多模态内容数组 |

**`ContentPart` 变体：**

```ts
{ type: "text", text: string }
{ type: "image_url", image_url: { url: string } }
```

图片 URL 必须是 base64 数据 URL（如 `data:image/jpeg;base64,...`）。客户端图片应在编码前调整为最大 1200px，以避免超过 macOS ARG_MAX。

#### 流水线 1：文本流

当最新的用户消息**不**包含图片时使用。

路由通过 OpenAI SDK 指向网关（`localhost:18789/v1/chat/completions`）创建流式聊天完成，使用模型 `claude-sonnet-4-6`。

**响应：** 服务器发送事件（`text/event-stream`）。

每个 SSE 数据行是一个 JSON 对象，包含一个 `content` 字段，用于下一个 token：

```
data: {"content":"Hello"}

data: {"content":" there"}

data: [DONE]
```

#### 流水线 2：视觉（发送 + 轮询）

当最新的用户消息**包含** `image_url` 内容部分且 `OPENCLAW_GATEWAY_TOKEN` 已设置时使用。

网关的 `/v1/chat/completions` 端点会剥离图片内容，因此视觉消息通过 CLI 代理流水线：

1. 图片被提取并转换为 `{ mimeType, content (base64) }` 附件。
2. 通过 `execFile` 调用 `openclaw gateway call chat.send` 异步发送消息。
3. 路由每 2 秒轮询一次 `openclaw gateway call chat.history`（最长 60 秒超时），直到出现助手响应。
4. 完整响应作为单个 SSE 帧返回，后跟 `[DONE]`。

**响应：** 与流水线 1 相同的 SSE 格式，但整个响应在单个 `data:` 帧中到达，而不是逐 token 流式传输。

#### 响应摘要

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `text/event-stream` | SSE 流（两条流水线） |
| 400 | `application/json` | `{ "error": string }` — 无效 JSON 或消息验证失败 |
| 404 | `application/json` | `{ "error": "Agent not found" }` |
| 500 | `application/json` | `{ "error": "Chat failed. Make sure OpenClaw gateway is running." }` |

#### 示例

```js
// 文本消息
const res = await fetch('/api/chat/jarvis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operatorName: 'John',
    messages: [
      { role: 'user', content: 'What cron jobs are running today?' }
    ]
  })
})

const reader = res.body.getReader()
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = decoder.decode(value)
  // 解析 SSE 行: "data: {\"content\":\"...\"}\n\n"
}
```

```js
// 视觉消息（图片）
const res = await fetch('/api/chat/vera', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see in this screenshot?' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/9j/4AAQ...' } }
        ]
      }
    ]
  })
})
```

---

### GET `/api/crons`

返回注册到 OpenClaw 的所有计划任务，包含丰富的调度描述、代理所有者和交付配置。

**数据来源：** 通过 CLI 运行 `openclaw cron list --json`（需要 `OPENCLAW_BIN`）。

#### 请求

无参数。

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `CronJob[]` |
| 500 | `application/json` | `{ "error": string }` |

**`CronJob` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `id` | `string` | 任务标识符 |
| `name` | `string` | 任务名称（用于通过前缀匹配所属代理） |
| `schedule` | `string` | 原始 cron 表达式 |
| `scheduleDescription` | `string` | 人类可读（如 `"每天早上 8 点"`） |
| `timezone` | `string \| null` | 调度对象中的时区（如果存在） |
| `status` | `"ok" \| "error" \| "idle"` | 上次运行结果 |
| `lastRun` | `string \| null` | 上次执行的 ISO 8601 时间戳 |
| `nextRun` | `string \| null` | 下次计划运行的 ISO 8601 时间戳 |
| `lastError` | `string \| null` | 上次运行失败时的错误消息 |
| `agentId` | `string \| null` | 所属代理 ID（通过任务名称前缀匹配） |
| `description` | `string \| null` | 任务描述 |
| `enabled` | `boolean` | 任务是否处于活动状态 |
| `delivery` | `CronDelivery \| null` | 交付配置（模式、渠道、目标） |
| `lastDurationMs` | `number \| null` | 上次运行时长（毫秒） |
| `consecutiveErrors` | `number` | 连续失败次数 |
| `lastDeliveryStatus` | `string \| null` | 上次运行的交付结果 |

**`CronDelivery` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `mode` | `string` | 交付模式 |
| `channel` | `string` | 交付渠道 |
| `to` | `string \| null` | 交付目标 |

#### 示例

```bash
curl http://localhost:3000/api/crons
```

---

### GET `/api/cron-runs`

返回从文件系统上 JSONL 日志文件解析的计划任务运行历史。结果按最新优先排序。

**数据来源：** 从 `$WORKSPACE_PATH/../cron/runs/` 读取 `.jsonl` 文件。

#### 查询参数

| 参数 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `jobId` | `string` | 否 | 筛选特定任务的运行。提供时，仅读取 `{jobId}.jsonl`。省略时，读取运行目录中的所有 `.jsonl` 文件。 |

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `CronRun[]` |
| 500 | `application/json` | `{ "error": string }` |

**`CronRun` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `ts` | `number` | 运行的 Unix 时间戳（毫秒） |
| `jobId` | `string` | 任务标识符 |
| `status` | `"ok" \| "error"` | 运行结果 |
| `summary` | `string \| null` | 运行产生的内容摘要 |
| `error` | `string \| null` | 运行失败时的错误消息 |
| `durationMs` | `number` | 运行时长（毫秒） |
| `deliveryStatus` | `string \| null` | 交付结果 |

#### 示例

```bash
# 所有运行
curl http://localhost:3000/api/cron-runs

# 特定任务的运行
curl "http://localhost:3000/api/cron-runs?jobId=pulse-daily-digest"
```

---

### GET `/api/memory`

返回工作区中关键内存文件的内容：长期记忆、团队记忆、团队情报，以及今天和昨天的每日日志。

**数据来源：** 从 `$WORKSPACE_PATH` 文件系统目录读取特定文件。

检查的文件（按顺序）：
1. `$WORKSPACE_PATH/MEMORY.md` — 长期记忆（Jarvis）
2. `$WORKSPACE_PATH/memory/team-memory.md` — 团队记忆
3. `$WORKSPACE_PATH/memory/team-intel.json` — 团队情报（JSON）
4. `$WORKSPACE_PATH/memory/{YYYY-MM-DD}.md` — 每日日志（今天）
5. `$WORKSPACE_PATH/memory/{YYYY-MM-DD}.md` — 每日日志（昨天）

仅包含存在的文件。

#### 请求

无参数。

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `MemoryFile[]` |
| 500 | `application/json` | `{ "error": string }` |

**`MemoryFile` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `label` | `string` | 人类可读的标签（如 `"长期记忆 (Jarvis)"`） |
| `path` | `string` | 文件的绝对文件系统路径 |
| `content` | `string` | 完整文件内容 |
| `lastModified` | `string` | 上次修改的 ISO 8601 时间戳 |

#### 示例

```bash
curl http://localhost:3000/api/memory
```

```js
const res = await fetch('/api/memory')
const files = await res.json()
// files[0].label => "Long-Term Memory (Jarvis)"
// files[0].content => "# Memory\n\n..."
```

---

### POST `/api/tts`

使用 OpenClaw 网关的 TTS 端点（OpenAI 兼容的 `audio.speech` API）将文本转换为语音音频。

**需要：** OpenClaw 网关在 `localhost:18789` 运行。

#### 请求体

| 字段 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `text` | `string` | 是 | 要合成的文本 |
| `voice` | `string` | 否 | 语音标识符。默认为 `"alloy"` |

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `audio/mpeg` | 原始 MP3 音频字节 |
| 400 | `application/json` | `{ "error": "Missing or invalid \"text\" field" }` |
| 500 | `application/json` | `{ "error": "TTS failed. Make sure OpenClaw gateway is running." }` |

成功响应上设置 `Content-Length` 头。

#### 示例

```bash
curl -X POST http://localhost:3000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{"text": "Hello from Jarvis", "voice": "alloy"}' \
  --output speech.mp3
```

```js
const res = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello from Jarvis', voice: 'nova' })
})
const audioBlob = await res.blob()
const audioUrl = URL.createObjectURL(audioBlob)
```

---

### POST `/api/transcribe`

使用 OpenClaw 网关的 Whisper 端点（OpenAI 兼容的 `audio.transcriptions` API）将音频转录为文本。

**需要：** OpenClaw 网关在 `localhost:18789` 运行。

#### 请求体

多部分表单数据（`multipart/form-data`）。

| 字段 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `audio` | `File` | 是 | 音频文件（webm、mp4、wav 等） |

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `{ "text": string }` |
| 400 | `application/json` | `{ "error": "Expected multipart form data" }` 或 `{ "error": "Missing audio file" }` |
| 500 | `application/json` | `{ "error": "Transcription failed. Check OpenClaw gateway." }` |

#### 示例

```bash
curl -X POST http://localhost:3000/api/transcribe \
  -F 'audio=@recording.webm'
```

```js
const formData = new FormData()
formData.append('audio', audioBlob, 'recording.webm')

const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
const { text } = await res.json()
// text => "Hello, what are the latest metrics?"
```

---

### POST `/api/kanban/chat/[id]`

在看板任务上下文中向代理发送聊天消息。类似于主聊天路由，但在系统提示中包含任务上下文。纯文本（无视觉流水线）。

**需要：** OpenClaw 网关在 `localhost:18789` 运行。

#### 路径参数

| 参数 | 类型 | 描述 |
|---|---|---|
| `id` | `string` | 代理 ID（必须匹配已注册的代理） |

#### 请求体

| 字段 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `messages` | `KanbanMessage[]` | 是 | 对话历史 |
| `ticket` | `Ticket` | 否 | 要包含在系统提示中的任务上下文 |

**`KanbanMessage` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `role` | `"user" \| "assistant"` | 消息角色 |
| `content` | `string` | 消息文本 |

**`Ticket` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `title` | `string` | 任务标题 |
| `description` | `string` | 任务描述 |
| `status` | `string` | 当前状态 |
| `priority` | `string` | 优先级 |
| `assigneeRole` | `string \| null` | 分配代理的角色 |
| `workResult` | `string \| null` | 上次工作输出（包含在提示中以便代理可以引用） |

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `text/event-stream` | SSE 流（与 `/api/chat/[id]` 相同格式） |
| 400 | `application/json` | `{ "error": string }` — 无效 JSON 或消息不是数组 |
| 404 | `application/json` | `{ "error": "Agent not found" }` |
| 500 | `application/json` | `{ "error": "Chat failed. Make sure OpenClaw gateway is running." }` |

SSE 格式与主聊天路由的文本流水线相同：

```
data: {"content":"I see this ticket is about..."}

data: {"content":" the daily digest."}

data: [DONE]
```

#### 示例

```js
const res = await fetch('/api/kanban/chat/pulse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the status of this ticket?' }
    ],
    ticket: {
      title: 'Fix daily digest formatting',
      description: 'The email digest has broken HTML in the header.',
      status: 'in-progress',
      priority: 'high',
      assigneeRole: 'pulse',
      workResult: null
    }
  })
})
```

---

### GET `/api/kanban/chat-history/[ticketId]]

获取看板任务的持久化聊天历史。

**数据来源：** 从文件系统 `$WORKSPACE_PATH/../kanban/chats/{ticketId}.jsonl` 读取。

#### 路径参数

| 参数 | 类型 | 描述 |
|---|---|---|
| `ticketId` | `string` | 任务标识符 |

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `StoredChatMessage[]`（按最旧优先排序） |
| 500 | `application/json` | `{ "error": string }` |

如果任务不存在聊天历史文件，则返回空数组 `[]`。

**`StoredChatMessage` 模式：**

| 字段 | 类型 | 描述 |
|---|---|---|
| `id` | `string` | 唯一消息标识符 |
| `role` | `"user" \| "assistant"` | 消息角色 |
| `content` | `string` | 消息文本 |
| `timestamp` | `number` | Unix 时间戳（毫秒） |

#### 示例

```bash
curl http://localhost:3000/api/kanban/chat-history/ticket-abc-123
```

---

### POST `/api/kanban/chat-history/[ticketId]

将聊天消息追加到看板任务的持久化历史。如果聊天目录和 JSONL 文件不存在，则创建它们。

**数据来源：** 追加到文件系统 `$WORKSPACE_PATH/../kanban/chats/{ticketId}.jsonl`。

#### 路径参数

| 参数 | 类型 | 描述 |
|---|---|---|
| `ticketId` | `string` | 任务标识符 |

#### 请求体

| 字段 | 类型 | 必需 | 描述 |
|---|---|---|---|
| `messages` | `StoredChatMessage[]` | 是 | 要追加的消息（必须是非空数组） |

参见上方 GET 端点中的 `StoredChatMessage` 模式。

#### 响应

| 状态 | Content-Type | 响应体 |
|---|---|---|
| 200 | `application/json` | `{ "ok": true }` |
| 400 | `application/json` | `{ "error": "messages array required" }` |
| 500 | `application/json` | `{ "error": string }` |

#### 示例

```js
await fetch('/api/kanban/chat-history/ticket-abc-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { id: 'msg-1', role: 'user', content: 'Can you look into this?', timestamp: 1709400000000 },
      { id: 'msg-2', role: 'assistant', content: 'On it.', timestamp: 1709400005000 }
    ]
  })
})
```

---

## 路由摘要

| 方法 | 端点 | 需要网关 | 数据来源 | Content-Type |
|---|---|---|---|---|
| GET | `/api/agents` | 否 | 文件系统（JSON + SOUL.md） | `application/json` |
| POST | `/api/chat/[id]` | 是 | 网关（流式）或 CLI（视觉） | `text/event-stream` |
| GET | `/api/crons` | 否 | CLI（`openclaw cron list`） | `application/json` |
| GET | `/api/cron-runs` | 否 | 文件系统（JSONL） | `application/json` |
| GET | `/api/memory` | 否 | 文件系统（Markdown/JSON） | `application/json` |
| POST | `/api/tts` | 是 | 网关（`audio.speech`） | `audio/mpeg` |
| POST | `/api/transcribe` | 是 | 网关（`audio.transcriptions`） | `application/json` |
| POST | `/api/kanban/chat/[id]` | 是 | 网关（流式） | `text/event-stream` |
| GET | `/api/kanban/chat-history/[ticketId]` | 否 | 文件系统（JSONL） | `application/json` |
| POST | `/api/kanban/chat-history/[ticketId]` | 否 | 文件系统（JSONL） | `application/json` |

## SSE 流协议

所有流式聊天端点（`/api/chat/[id]` 和 `/api/kanban/chat/[id]`）使用相同的服务器发送事件协议：

1. 每个数据帧是一个 JSON 对象：`data: {"content":"token text"}\n\n`
2. 流以以下方式终止：`data: [DONE]\n\n`
3. Content-Type 是 `text/event-stream`，带有 `Cache-Control: no-cache` 和 `Connection: keep-alive`。
4. 如果流在响应中途发生错误，服务器发送 `[DONE]` 并关闭连接（不发送错误帧）。

### 客户端消费模式

```js
async function readStream(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6)
        if (payload === '[DONE]') return fullText
        try {
          const { content } = JSON.parse(payload)
          fullText += content
        } catch { /* skip malformed frames */ }
      }
    }
  }

  return fullText
}
```
