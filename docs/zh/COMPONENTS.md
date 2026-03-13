# ClawPort — 组件参考

代码库中的每个 React 组件，按区域分组。每个组件包含：用途、props、关键状态、父组件使用情况和实现说明。

---

## 组件树

```
RootLayout (app/layout.tsx)
  ThemeProvider (app/providers.tsx)
    SettingsProvider (app/settings-provider.tsx)
      DynamicFavicon (components/DynamicFavicon.tsx)
      OnboardingWizard (components/OnboardingWizard.tsx)
      LiveStreamWidget (components/LiveStreamWidget.tsx)
      Sidebar (components/Sidebar.tsx)
        NavLinks (components/NavLinks.tsx)
        ThemeToggle (components/ThemeToggle.tsx)
        MobileSidebar (components/MobileSidebar.tsx)
        GlobalSearch (components/GlobalSearch.tsx)
      <main> (页面内容)
        HomePage (app/page.tsx)
          OrgMap (components/OrgMap.tsx)
            AgentNode (components/AgentNode.tsx)
              AgentAvatar (components/AgentAvatar.tsx)
          GridView (components/GridView.tsx)
            AgentAvatar
          FeedView (components/FeedView.tsx)
        ChatPage (app/chat/page.tsx)
          AgentList (components/chat/AgentList.tsx)
            AgentAvatar
          AgentListMobile (components/chat/AgentList.tsx)
            AgentAvatar
          ConversationView (components/chat/ConversationView.tsx)
            VoiceMessage (components/chat/VoiceMessage.tsx)
            FileAttachment (components/chat/FileAttachment.tsx)
            MediaPreview (components/chat/MediaPreview.tsx)
        AgentDetailPage (app/agents/[id]/page.tsx)
          AgentAvatar
          Breadcrumbs (components/Breadcrumbs.tsx)
        KanbanPage (app/kanban/page.tsx)
          KanbanBoard (components/kanban/KanbanBoard.tsx)
            KanbanColumn (components/kanban/KanbanColumn.tsx)
              TicketCard (components/kanban/TicketCard.tsx)
                AgentAvatar
          TicketDetailPanel (components/kanban/TicketDetailPanel.tsx)
          CreateTicketModal (components/kanban/CreateTicketModal.tsx)
            AgentPicker (components/kanban/AgentPicker.tsx)
              AgentAvatar
        CronsPage (app/crons/page.tsx)
          WeeklySchedule (components/crons/WeeklySchedule.tsx)
          PipelineGraph (components/crons/PipelineGraph.tsx)
        CostsPage (app/costs/page.tsx)
          CostsPage (components/costs/CostsPage.tsx)
        ActivityPage (app/activity/page.tsx)
          LogBrowser (components/activity/LogBrowser.tsx)
        MemoryPage (app/memory/page.tsx)
        SettingsPage (app/settings/page.tsx)
          AgentAvatar
        ErrorState (components/ErrorState.tsx)
```

---

## 提供商（Providers）

### ThemeProvider

**文件：** `app/providers.tsx`
**用途：** 管理活动主题并通过 `data-theme` 属性将其应用到文档根节点。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| children | `React.ReactNode` | 是 | 应用内容 |

**上下文值：**

```ts
{ theme: ThemeId; setTheme: (t: ThemeId) => void }
```

**关键状态：**
- `theme`（useState）— 持久化到 `localStorage('clawport-theme')`，默认为 `'dark'`

**实现：**
- 挂载时，读取 `localStorage('clawport-theme')` 并在 `<html>` 上设置 `data-theme` 属性
- `setTheme` 在一次调用中更新状态、localStorage 和 DOM 属性
- 导出供消费者使用的 `useTheme()` 钩子

**使用者：** `app/layout.tsx`（包裹整个应用）

---

### SettingsProvider

**文件：** `app/settings-provider.tsx`
**用途：** 所有用户可配置设置（品牌、强调色、操作员名称、代理显示覆盖）的集中状态管理。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| children | `React.ReactNode` | 是 | 应用内容 |

**上下文值：**

```ts
interface SettingsContextValue {
  settings: ClawPortSettings
  setAccentColor: (color: string | null) => void
  setPortalName: (name: string | null) => void
  setPortalSubtitle: (subtitle: string | null) => void
  setPortalEmoji: (emoji: string | null) => void
  setPortalIcon: (icon: string | null) => void
  setIconBgHidden: (hidden: boolean) => void
  setEmojiOnly: (emojiOnly: boolean) => void
  setOperatorName: (name: string | null) => void
  setAgentOverride: (agentId: string, override: AgentDisplayOverride | null) => void
  getAgentDisplay: (agent: Agent) => AgentDisplay
  resetAll: () => void
}
```

**关键状态：**
- `settings`（useState）— 完整的 `ClawPortSettings` 对象，通过 `saveSettings()` 持久化到 localStorage

**实现：**
- 当强调色更改时，直接在 `document.documentElement.style` 上应用 CSS 自定义属性（`--accent`、`--accent-hover`、`--accent-glow`）
- `getAgentDisplay(agent)` 合并代理默认值和每个代理的覆盖（自定义 emoji、图片、背景）
- `resetAll()` 清除 localStorage 并重置为默认值
- 每个 setter 在更新状态后调用 `saveSettings()`

**使用者：** `app/layout.tsx`（包裹整个应用，在 ThemeProvider 内）

---

## 布局组件

### Sidebar

**文件：** `components/Sidebar.tsx`
**用途：** 协调桌面侧边栏、移动端标题栏/侧边栏和 Cmd+K 搜索面板的客户端包装器。

**Props：** 无

**关键状态：**
- `searchOpen`（useState）— 控制 GlobalSearch 可见性

**实现：**
- 在固定宽度桌面侧边栏（`w-[220px]`，移动端隐藏）内渲染 `NavLinks` 和 `ThemeToggle`
- 为移动端视口渲染 `MobileSidebar`
- 渲染 `GlobalSearch`（始终挂载，可见性由 `searchOpen` 控制）
- 监听自定义事件 `clawport:open-search` 以切换搜索
- 从 MobileSidebar 的搜索触发器分发 search-open

**使用者：** `app/layout.tsx`

---

### NavLinks

**文件：** `components/NavLinks.tsx`
**用途：** 带图标、徽章和操作员身份页脚的侧边栏导航链接。

**Props：** 无

**关键状态：**
- `agentCount`（useState）— 挂载时从 `/api/agents` 获取
- `cronErrorCount`（useState）— 挂载时从 `/api/crons` 获取

**实现：**
- 六个导航项：Map、Kanban、Messages、Crons、Memory、Settings
- 每个使用 Lucide 图标（`Map`、`Columns3`、`MessageCircle`、`Clock`、`Brain`、`Settings`）
- 徽章系统：Map 上的代理数量，Crons 上的 cron 错误数量（红点）
- 页脚显示操作员首字母（通过 `useSettings()` 从 `operatorName` 计算）和显示名称
- 当 `operatorName` 未设置时回退到 "Operator" / "??"
- 使用 `usePathname()` 进行活动链接高亮

**使用者：** `components/Sidebar.tsx`

---

### MobileSidebar

**文件：** `components/MobileSidebar.tsx`
**用途：** 带汉堡菜单和滑出侧边栏面板的固定移动端标题栏。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| onOpenSearch | `() => void` | 否 | 打开全局搜索的回调 |

**关键状态：**
- `isOpen`（useState）— 侧边栏面板可见性

**实现：**
- 固定标题栏（48px），带有门户 emoji/名称、搜索图标和汉堡按钮
- 滑出面板渲染 NavLinks 和 ThemeToggle
- 关闭条件：路由更改（`usePathname` 效果）、ESC 键、点击面板外部
- 打开时通过 `overflow: hidden` 防止 body 滚动
- 仅在移动端可见（`md:hidden`）

**使用者：** `components/Sidebar.tsx`

---

### GlobalSearch

**文件：** `components/GlobalSearch.tsx`
**用途：** Cmd+K 搜索面板，支持代理、页面和 cron 的模糊搜索。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| open | `boolean` | 是 | 搜索模态框是否可见 |
| onClose | `() => void` | 是 | 关闭模态框的回调 |

**导出：** `GlobalSearch`（主模态框）和 `SearchTrigger`（分发 `clawport:open-search` 的按钮）

**关键状态：**
- `query`（useState）— 搜索输入文本
- `results`（useState）— 过滤后的搜索结果
- `selectedIndex`（useState）— 键盘导航位置
- `agents` / `crons`（useState）— 打开时获取

**实现：**
- 模态框打开时从 API 获取代理和 cron
- 模糊匹配：检查查询字符是否按顺序出现在结果标签中（不区分大小写）
- 结果按类型分组：代理、页面（硬编码列表）、cron
- 键盘导航：ArrowUp/ArrowDown 移动，Enter 选择，Escape 关闭
- 选择后通过 `router.push()` 导航
- 全局键盘监听器用于 Cmd+K / Ctrl+K 打开

**使用者：** `components/Sidebar.tsx`

---

### DynamicFavicon

**文件：** `components/DynamicFavicon.tsx`
**用途：** 从门户 emoji 或上传的图标图片生成和应用动态 favicon。

**Props：** 无（渲染 `null`）

**关键状态：** 无（仅效果组件）

**实现：**
- 使用 Canvas API 将 favicon 绘制到 64x64 画布上
- 如果有 `portalIcon`（上传的图片）：绘制缩放以填充画布的图片
- 如果有 `portalEmoji`：绘制彩色圆形背景（使用强调色）并将 emoji 渲染为居中文本
- 如果 `iconBgHidden`：跳过 emoji 模式的圆形背景
- 将画布转换为 PNG 数据 URL 并设置在 `<link rel="icon">` 元素上
- 当 `portalEmoji`、`portalIcon`、`accentColor`、`iconBgHidden` 或 `emojiOnly` 更改时重新运行

**使用者：** `app/layout.tsx`

---

### ThemeToggle

**文件：** `components/ThemeToggle.tsx`
**用途：** 主题选择器，渲染为带 radiogroup 语义的一行 emoji 按钮。

**Props：** 无

**关键状态：** 无（从 `useTheme()` 读取）

**实现：**
- 为每个主题渲染一个带 emoji 指示器的按钮
- 使用 `role="radiogroup"` 和 `aria-checked` 实现无障碍
- 箭头键导航（左/右）循环切换主题
- 用强调色边框高亮活动主题
- 主题：dark、glass、color、light、system

**使用者：** `components/Sidebar.tsx`、`components/MobileSidebar.tsx`

---

### Breadcrumbs

**文件：** `components/Breadcrumbs.tsx`
**用途：** 带 Lucide ChevronRight 分隔符的面包屑导航栏。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| items | `BreadcrumbItem[]` | 是 | 面包屑段 |

```ts
interface BreadcrumbItem {
  label: string
  href?: string   // 如果存在，渲染为 Link；否则为纯文本
  icon?: LucideIcon
}
```

**实现：**
- 最后一项渲染为纯文本（当前页面），其他所有项渲染为 Next.js `Link`
- 可选的 Lucide 图标在每个标签之前渲染
- 使用 `--text-secondary` 和 `--text-primary` CSS 变量样式化

**使用者：** `app/agents/[id]/page.tsx`

---

### ErrorState

**文件：** `components/ErrorState.tsx`
**用途：** 带可选重试按钮的全屏错误显示。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| message | `string` | 是 | 要显示的错误消息 |
| onRetry | `() => void` | 否 | 如果提供，显示重试按钮 |

**实现：**
- 居中布局，带警告图标、消息文本和可选重试按钮
- 使用 CSS 变量实现主题化

**使用者：** `app/page.tsx`、`app/chat/page.tsx`、`app/crons/page.tsx`

---

### AgentAvatar

**文件：** `components/AgentAvatar.tsx`
**用途：** 将代理头像渲染为_profile 图片、彩色背景上的 emoji 或仅 emoji（透明背景）。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agent | `Agent` | 是 | 代理数据对象 |
| size | `number` | 是 | 头像尺寸（像素） |
| borderRadius | `number` | 否 | 边框圆角（默认：12） |
| style | `CSSProperties` | 否 | 额外的内联样式 |

**关键状态：** 无

**实现：**
- 使用 `useSettings().getAgentDisplay(agent)` 解析显示覆盖（每个代理的自定义 emoji/图片）
- 三种渲染模式：
  1. **Profile 图片**（代理有 `profileImage` 或覆盖图片）：渲染 `<img>` 使用 object-fit cover
  2. **彩色背景上的 emoji**：在彩色圆形（代理的 `color` 或覆盖）上居中渲染 emoji 文本
  3. **仅 emoji**（`emojiOnly` 设置）：渲染透明背景的 emoji
- 背景颜色来自代理定义或每个代理覆盖

**使用者：** `components/AgentNode.tsx`、`components/GridView.tsx`、`components/chat/AgentList.tsx`、`components/kanban/TicketCard.tsx`、`components/kanban/AgentPicker.tsx`、`app/agents/[id]/page.tsx`、`app/settings/page.tsx`、`app/page.tsx`

---

## 入门向导

### OnboardingWizard

**文件：** `components/OnboardingWizard.tsx`
**用途：** 五步首次运行设置向导，用于配置门户名称、主题、强调色、语音聊天和功能概览。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| forceOpen | `boolean` | 否 | 如果为 true，无论入门状态如何都打开；使用当前设置预填充 |
| onClose | `() => void` | 否 | 向导关闭时的回调（与设置页面的 forceOpen 一起使用） |

**关键状态：**
- `step`（useState）— 当前向导步骤（0-4）
- `show`（useState）— 可见性标志
- `name` / `subtitle` / `emoji` / `operatorName`（useState）— 步骤 0 的表单字段
- `selectedTheme`（useState）— 步骤 1 的主题选择
- `selectedAccent`（useState）— 步骤 2 的强调色
- `micStatus`（useState）— 步骤 3 的麦克风权限状态（`'idle' | 'requesting' | 'granted' | 'denied' | 'error'`）
- `micLevel`（useState）— 麦克风测试可视化的实时音频电平

**步骤：**
1. **欢迎**（步骤 0）— 门户名称、副标题、emoji 选择器、操作员名称。实时侧边栏预览显示 NavLinks 将如何显示。
2. **主题**（步骤 1）— 主题网格带预览卡片。通过 `setTheme()` 实时应用主题。
3. **强调色**（步骤 2）— 颜色预设网格（12 种颜色）。通过 `setAccentColor()` 实时应用。
4. **语音聊天**（步骤 3）— 麦克风权限测试。使用 Web Audio API（`AudioContext` + `AnalyserNode`）捕获实时音频电平并显示脉动圆形可视化。
5. **概览**（步骤 4）— 功能摘要卡片（代理地图、聊天、Kanban、Crons、内存）。

**实现：**
- 首次运行检测：检查 `localStorage('clawport-onboarded')`
- 当 `forceOpen` 为 true：从当前设置预填充所有字段，完成时**不**设置 `clawport-onboarded`
- 正常完成：在 localStorage 中设置 `clawport-onboarded` 并保存所有设置
- 模态框覆盖带背景模糊、步骤指示点、后退/下一步/完成导航
- 麦克风测试在卸载或步骤更改时清理音频流和上下文

**使用者：** `app/layout.tsx`（始终挂载，自动隐藏）、`app/settings/page.tsx`（通过 forceOpen）

---

## 地图/主页组件

### OrgMap

**文件：** `components/OrgMap.tsx`
**用途：** 使用 React Flow 的代理层级组织图可视化，带交互式节点选择。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agents | `Agent[]` | 是 | 要渲染的所有代理 |
| crons | `CronJob[]` | 是 | 计划任务（用于状态指示器） |
| selectedId | `string \| null` | 是 | 当前选择的代理 ID |
| onNodeClick | `(agent: Agent) => void` | 是 | 节点点击时的回调 |

**关键状态：**
- `nodes` / `edges`（useState）— React Flow 节点和边数组
- `highlightedEdges`（派生）— 连接到选定节点的边

**实现：**
- 基于 BFS 的层级布局：从根代理开始（`reportsTo` 为 null/undefined），按层级分配 x/y 位置
- 水平间距：280px，垂直间距：160px
- 每个节点渲染为自定义 `AgentNode` 组件（通过 `nodeTypes` 注册）
- 边高亮：当选择代理时，其连接的边获得强调色 + 增加宽度
- 未高亮的边淡化到 20% 透明度
- 使用 `ReactFlow` 的 `fitView`、`panOnScroll` 和缩放控件
- 在 `app/page.tsx` 中动态导入，带 `{ ssr: false }` 以避免 React Flow 的 SSR 问题

**使用者：** `app/page.tsx`（HomePage，地图视图）

---

### AgentNode

**文件：** `components/AgentNode.tsx`
**用途：** 自定义 React Flow 节点组件，显示代理头像、名称、头衔和状态。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| data | `AgentNodeData` | 是 | 节点数据（由 React Flow 传递） |

```ts
interface AgentNodeData {
  agent: Agent
  selected: boolean
  cronHealth?: 'ok' | 'error' | 'idle'
}
```

**实现：**
- 渲染 AgentAvatar（48px），带名称、头衔和可选描述（截断为 2 行）
- 选定状态：强调色边框和微妙的光晕效果
- Cron 健康指示器：右上角的彩色圆点（绿色/红色/灰色）
- 使用 React Flow 的 `Handle` 组件用于源（底部）和目标（顶部）连接
- 导出 `nodeTypes = { agentNode: AgentNode }` 用于 React Flow 注册

**使用者：** `components/OrgMap.tsx`

---

### GridView

**文件：** `components/GridView.tsx`
**用途：** 带团队分组层级的卡片网格布局。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agents | `Agent[]` | 是 | 所有代理 |
| crons | `CronJob[]` | 是 | 用于状态的计划任务 |
| selectedId | `string \| null` | 是 | 当前选择的代理 |
| onSelect | `(agent: Agent) => void` | 是 | 选择回调 |

**实现：**
- 构建团队层级：识别"英雄"代理（根且没有 `reportsTo`），按其 `reportsTo` 管理者分组代理，分离独立操作员（没有报告且除了英雄外不向任何人报告）
- 包含内联 `AgentCard` 组件：渲染头像、名称、头衔、描述、cron 健康圆点和状态徽章
- 包含内联 `TeamSection` 组件：带管理者标题的可折叠团队组
- 选定卡片获得强调边框高亮
- 响应式网格：移动端 1 列、md 2 列、lg 3 列

**使用者：** `app/page.tsx`（HomePage，网格视图）

---

### FeedView

**文件：** `components/FeedView.tsx`
**用途：** 专注于 cron 任务状态的活动源，带统计卡片和过滤标签。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agents | `Agent[]` | 是 | 所有代理 |
| crons | `CronJob[]` | 是 | 要显示的计划任务 |
| selectedId | `string \| null` | 是 | 当前选择的代理 |
| onSelect | `(agent: Agent) => void` | 是 | 选择回调 |

**关键状态：**
- `filter`（useState）— `'all' | 'ok' | 'error' | 'idle'`

**实现：**
- 顶部统计卡片：cron 总数、健康数量、错误数量、空闲数量
- 过滤标签切换显示哪些 cron
- Cron 按状态优先级排序（错误优先），然后按 `lastRun` 降序
- 每个 cron 行显示：代理头像、cron 名称、调度、状态徽章、上次运行时间
- 包含内联 `StatusBadge` 和 `StatCard` 辅助组件
- 点击 cron 行选择其关联代理

**使用者：** `app/page.tsx`（HomePage，活动视图）

---

## 聊天组件

### ConversationView

**文件：** `components/chat/ConversationView.tsx`
**用途：** 主聊天界面，带消息渲染、SSE 流式传输、文件附件、TTS 播放和 Markdown 格式化。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agent | `Agent` | 是 | 正在聊天的代理 |
| conversation | `Conversation` | 是 | 当前对话数据 |
| onUpdate | `(conv: Conversation) => void` | 是 | 对话更改时的回调 |
| onBack | `() => void` | 否 | 移动端后退按钮回调 |

**关键状态：**
- `input`（useState）— 文本输入值
- `isStreaming`（useState）— SSE 响应是否在进行中
- `streamingText`（useState）— 累积的流式响应文本
- `attachments`（useState）— 发送前的暂存 `MediaAttachment[]`
- `isRecording`（useState）— 语音录制是否进行中
- `ttsPlaying`（useState）— 当前正在播放 TTS 的消息 ID
- `ttsLoading`（useState）— 当前正在加载 TTS 的消息 ID

**实现：**
- **SSE 流式传输：** POST 到 `/api/chat/[id]`，使用 `ReadableStream` 读取器。解析 `data:` 行，累积文本，在最终消息上调用 `onUpdate`。
- **Markdown 渲染：** 内联 `renderMarkdown()` 函数处理粗体、斜体、内联代码、带语言标签和复制按钮的代码块、链接和项目符号列表。
- **TTS 播放：** 将消息文本发送到 `/api/tts`，接收音频 blob，通过 `Audio` 对象播放。切换每条消息的播放/停止。
- **文件附件：** 三种输入方法 — 粘贴（Cmd+V）、拖放和文件选择器按钮。图片通过 Canvas API（`resizeImage` 辅助函数）调整为最大 1200px。文件转换为 base64 数据 URL 以持久化。
- **语音录制：** 使用 `lib/audio-recorder.ts` 中的 `createAudioRecorder()`。录制音频，捕获波形，通过 `/api/transcribe` 转录，将转录作为消息发送。存储音频数据 URL + 波形以供播放。
- **自动滚动：** `useEffect` 在新消息或流式更新时滚动到底部。
- **operatorName：** 在 POST 正文中发送设置上下文中的 `operatorName` 用于系统提示注入。

**使用者：** `app/chat/page.tsx`（ChatPage）

---

### AgentList / AgentListMobile

**文件：** `components/chat/AgentList.tsx`
**用途：** 聊天的代理选择侧边栏。两个导出：`AgentList`（桌面端，300px 固定侧边栏）和 `AgentListMobile`（全宽，在移动端且未选择代理时显示）。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agents | `Agent[]` | 是 | 可用代理 |
| conversations | `Map<string, Conversation>` | 是 | 所有对话（用于预览/时间戳） |
| activeId | `string \| null` | 是 | 当前选择的代理 ID |
| onSelect | `(agent: Agent) => void` | 是 | 选择回调 |
| loading | `boolean` | 否 | 显示骨架加载状态 |

**关键状态：**
- `search`（useState）— 代理搜索的过滤文本

**实现：**
- 代理按最后活动排序（最新的对话在前），然后按字母顺序
- 每行显示：AgentAvatar、代理名称、头衔、最后消息预览（截断）、相对时间戳
- 未读徽章：对话有新消息时显示绿点
- 在线状态圆点：始终为绿色（未来实时状态的占位符）
- 搜索按代理名称或头衔过滤（不区分大小写）
- 桌面变体：固定 300px 侧边栏，带右边框分隔符
- 移动端变体：全宽列表，选择代理时隐藏

**使用者：** `app/chat/page.tsx`（ChatPage）

---

### VoiceMessage

**文件：** `components/chat/VoiceMessage.tsx`
**用途：** 带播放/暂停切换和动画进度可视化的音频波形播放组件。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| src | `string` | 是 | 音频源 URL（base64 数据 URL） |
| duration | `number` | 是 | 时长（秒） |
| waveform | `number[]` | 是 | 振幅采样（40-60 个值，0-1 范围） |
| isUser | `boolean` | 是 | 这是否是用户的消息（影响颜色） |

**关键状态：**
- `isPlaying`（useState）— 播放状态
- `progress`（useState）— 播放进度（0-1）
- `audioRef`（useRef）— HTMLAudioElement 引用

**实现：**
- 将振幅条渲染为垂直 `<div>` 元素，高度与波形值成比例
- 进度跟踪：播放位置之前的条获得强调色，之后的条获得柔和颜色
- 使用 `<audio>` 元素的 `timeupdate` 事件更新进度
- 带 Lucide Play/Pause 图标的播放/暂停切换
- 时长显示格式化为 `m:ss`

**使用者：** `components/chat/ConversationView.tsx`

---

### FileAttachment

**文件：** `components/chat/FileAttachment.tsx`
**用途：** 带类型特定图标和下载按钮的文件附件气泡。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| name | `string` | 是 | 文件名 |
| size | `number` | 否 | 文件大小（字节） |
| mimeType | `string` | 否 | 用于图标选择的 MIME 类型 |
| url | `string` | 是 | 下载 URL（base64 数据 URL） |
| isUser | `boolean` | 是 | 这是否是用户的消息（影响颜色） |

**实现：**
- 类型特定的 SVG 图标：PDF（红色）、文档（蓝色）、文本（灰色）、归档（黄色）、通用（灰色）
- 按 MIME 类型匹配选择图标
- 文件大小格式化为人类可读（B、KB、MB）
- 下载按钮创建带 `download` 属性的临时 `<a>` 元素
- 用户和助手消息样式不同

**使用者：** `components/chat/ConversationView.tsx`

---

### MediaPreview

**文件：** `components/chat/MediaPreview.tsx`
**用途：** 发送前在聊天输入下方显示的暂存附件缩略图水平条。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| attachments | `MediaAttachment[]` | 是 | 要预览的暂存附件 |
| onRemove | `(index: number) => void` | 是 | 按索引移除附件的回调 |

**实现：**
- 带项目间距的水平滚动容器
- 图片：渲染带 object-fit cover 的缩略图预览
- 非图片：渲染带名称和大小的文件图标
- 每个项目有用于移除的 X 按钮覆盖
- 缩略图尺寸为 80x80px，带圆角

**使用者：** `components/chat/ConversationView.tsx`

---

## 看板组件

### KanbanBoard

**文件：** `components/kanban/KanbanBoard.tsx`
**用途：** 将看板渲染为一列带任务卡片的列。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| tickets | `KanbanTicket[]` | 是 | 所有任务 |
| agents | `Agent[]` | 是 | 所有代理（用于头像渲染） |
| onTicketClick | `(ticket: KanbanTicket) => void` | 是 | 任务选择回调 |
| onMoveTicket | `(ticketId: string, status: string) => void` | 是 | 任务移动回调 |
| onCreateTicket | `(status: string) => void` | 是 | 创建任务回调 |
| isWorking | `(ticketId: string) => boolean` | 否 | 任务是否有活动的代理工作 |
| filterAgentId | `string \| null` | 否 | 筛选特定代理的任务 |

**实现：**
- 四列：Backlog、In Progress、Review、Done
- 如果设置则按 `filterAgentId` 过滤任务
- 按 `status` 字段将任务分组到列
- 每列渲染为带 `TicketCard` 子项的 `KanbanColumn`
- 移动端带 `overflow-x-auto` 的水平滚动

**使用者：** `app/kanban/page.tsx`

---

### KanbanColumn

**文件：** `components/kanban/KanbanColumn.tsx`
**用途：** 带拖放支持的单看板列。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| column | `{ id: string; title: string }` | 是 | 列元数据 |
| tickets | `KanbanTicket[]` | 是 | 此列中的任务 |
| agents | `Agent[]` | 是 | 所有代理 |
| onTicketClick | `(ticket: KanbanTicket) => void` | 是 | 任务点击回调 |
| onDrop | `(ticketId: string) => void` | 是 | 放置回调（任务移动到此列） |
| onCreateTicket | `() => void` | 否 | 创建任务回调（仅在 backlog 列显示） |
| renderTicket | `(ticket: KanbanTicket) => ReactNode` | 是 | 任务渲染函数 |

**关键状态：**
- `dragOver`（useState）— 是否有任务正在此列上方拖动

**实现：**
- 列标题，带任务计数徽章和可选 + 按钮（仅 backlog）
- HTML5 拖放：`onDragOver` 设置视觉反馈，`onDrop` 从 `dataTransfer` 提取任务 ID
- 放置区域高亮：拖动到上方时显示强调色边框
- 带垂直溢出的可滚动任务列表

**使用者：** `components/kanban/KanbanBoard.tsx`

---

### TicketCard

**文件：** `components/kanban/TicketCard.tsx`
**用途：** 显示任务元数据和代理分配的拖动任务卡片。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| ticket | `KanbanTicket` | 是 | 任务数据 |
| agent | `Agent \| undefined` | 是 | 分配的代理（如果有） |
| onClick | `() => void` | 是 | 点击回调 |
| isWorking | `boolean` | 否 | 代理工作是否在进行中 |

**实现：**
- HTML5 可拖动：拖动开始时在 `dataTransfer` 中设置 `ticketId`
- 视觉元素：优先级圆点（颜色编码：红色=紧急、橙色=高、蓝色=中、灰色=低）、标题、描述预览（截断）、分配的代理头像 + 名称、角色徽章、相对时间戳
- 工作状态指示器：`isWorking` 为 true 时显示脉动圆点和"Working..."标签
- 拖动时透明度降低

**使用者：** `components/kanban/KanbanBoard.tsx`（通过 `KanbanColumn`）

---

### TicketDetailPanel

**文件：** `components/kanban/TicketDetailPanel.tsx`
**用途：** 用于查看任务详情并与分配代理聊天的滑入侧面板。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| ticket | `KanbanTicket` | 是 | 要显示的任务 |
| agent | `Agent \| undefined` | 是 | 分配的代理 |
| onClose | `() => void` | 是 | 关闭回调 |
| onStatusChange | `(status: string) => void` | 是 | 状态更改回调 |
| onDelete | `() => void` | 是 | 删除回调 |
| onRetryWork | `() => void` | 否 | 重试代理工作回调 |

**关键状态：**
- `chatMessages`（useState）— 内联聊天消息历史
- `chatInput`（useState）— 聊天输入文本
- `isStreaming`（useState）— SSE 响应是否在进行中
- `streamingText`（useState）— 累积的响应文本
- `expanded`（useState）— 面板宽度切换（窄/宽）

**实现：**
- 从右侧滑入的面板（默认 400px，展开 600px）
- 标题：任务标题、优先级徽章、展开/折叠切换、关闭按钮
- 任务详情：描述、状态选择器（下拉）、分配的代理、角色、时间戳
- 工作结果部分：显示代理工作输出（如果有），带重试按钮
- 内联聊天：SSE 流式传输到 `/api/chat/[id]`，Markdown 渲染（粗体、斜体、代码、代码块、链接、列表）
- 状态选择器：带所有列状态的下拉菜单
- 带确认的删除按钮（红色样式）

**使用者：** `app/kanban/page.tsx`

---

### CreateTicketModal

**文件：** `components/kanban/CreateTicketModal.tsx`
**用途：** 用于创建新看板任务的模态框对话框，带标题、描述、优先级、代理分配和角色。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| open | `boolean` | 是 | 模态框是否可见 |
| onOpenChange | `(open: boolean) => void` | 是 | 可见性更改回调 |
| agents | `Agent[]` | 是 | 可用于分配的代理 |
| onSubmit | `(data: CreateTicketData) => void` | 是 | 表单提交回调 |

**关键状态：**
- `title` / `description`（useState）— 表单字段
- `priority`（useState）— `'low' | 'medium' | 'high' | 'urgent'`
- `agentId`（useState）— 分配的代理 ID
- `role`（useState）— `'executor' | 'reviewer' | 'consultant'`

**实现：**
- 使用 Radix Dialog（`components/ui/dialog`）实现模态框行为
- 优先级选择器：带颜色编码圆点的四个按钮
- 代理分配：使用 `AgentPicker` 组件
- 角色选择器：三个按钮（Executor、Reviewer、Consultant）
- 关闭时重置表单
- 标题为空时禁用提交

**使用者：** `app/kanban/page.tsx`

---

### AgentPicker

**文件：** `components/kanban/AgentPicker.tsx`
**用途：** 用于选择代理的自定义下拉选择器，带搜索和键盘导航。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| agents | `Agent[]` | 是 | 可用代理 |
| value | `string \| null` | 是 | 选定的代理 ID |
| onChange | `(agentId: string \| null) => void` | 是 | 选择回调 |

**关键状态：**
- `open`（useState）— 下拉可见性
- `search`（useState）— 过滤文本
- `highlightIndex`（useState）— 键盘导航位置

**实现：**
- 触发按钮显示选定代理的头像 + 名称，或"Unassigned"
- 带顶部搜索输入的下拉框
- 键盘导航：ArrowUp/ArrowDown 移动，Enter 选择，Escape 关闭
- "Unassigned"选项始终显示在最前面
- 过滤列表显示代理头像、名称和头衔
- 选定代理上的复选标记图标
- 选择或外部点击时关闭

**使用者：** `components/kanban/CreateTicketModal.tsx`

---

## Cron 组件

### WeeklySchedule

**文件：** `components/crons/WeeklySchedule.tsx`
**用途：** 七天日历网格，显示计划任务何时运行。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| crons | `CronJob[]` | 是 | 要显示的计划任务 |

**关键状态：**
- `hoveredCron`（useState）— 工具提示显示的 cron ID
- `now`（useState）— 当前时间，每 60 秒更新用于时间指示器

**实现：**
- 7 列网格（周一到周日），带活动调度范围的小时行
- 解析 cron 调度表达式以确定每个 cron 运行的小时/天
- Cron 药丸：彩色条，定位在适当的日期/小时单元格，使用分配代理的颜色
- 药丸上的状态圆点：绿色（ok）、红色（error）、灰色（idle）
- 悬停时显示工具提示：cron 名称、调度表达式、上次运行时间、状态
- 当前时间指示器：当前小时位置的红线
- 左侧轴的小时标签

**使用者：** `app/crons/page.tsx`（调度选项卡）

---

### PipelineGraph

**文件：** `components/crons/PipelineGraph.tsx**
**用途：** 显示任务阶段之间依赖关系的 cron 任务流水线 React Flow 可视化。

| Prop | 类型 | 必需 | 描述 |
|------|------|----------|-------------|
| crons | `CronJob[]` | 是 | 要可视化的计划任务 |

**实现：**
- 将 cron 分组为流水线（有 `pipeline` 字段的 cron）和独立 cron
- 拓扑布局：按依赖顺序从左到右排列流水线阶段
- 包含内联 `CronPipelineNode` 自定义 React Flow 节点：显示 cron 名称、调度、代理、状态徽章
- 包含内联 `StandaloneCrons` 组件：非流水线 cron 的网格
- 边连接流水线阶段，带动画流动指示器
- 节点颜色基于状态：绿色（ok）、红色（error）、灰色（idle）
- 使用 `ReactFlow` 的 `fitView` 和平移/缩放控件

**使用者：** `app/crons/page.tsx`（流水线选项卡）

---

## 成本组件

### CostsPage

**文件：** `components/costs/CostsPage.tsx`
**用途：** 完整成本仪表盘，带 token 使用分析、每日成本图表、按任务分解、模型分布、异常检测和周环比趋势。

**关键状态：**
- `summary`（useState）— 从 `/api/costs` 获取的 `CostSummary`
- `crons`（useState）— 用于任务名称解析的 `CronJob[]`
- `hover`（useState）— 每日成本柱状图的悬停状态

**实现：**
- 从 `/api/costs` 获取成本数据（从 cron 运行 token 使用计算）
- 摘要卡片：总成本、最大消费、周环比变化（带趋势箭头）、缓存节省
- 每日成本柱状图（SVG），带悬停工具提示
- 按总成本降序排列的按任务成本表
- 显示 token 分布百分比的模型分解
- 异常警报：运行超过 5 倍中位数 token 使用量
- 所有成本计算在 `lib/costs.ts` 中（定价查找、任务聚合、每日汇总、异常检测）

**使用者：** `app/costs/page.tsx`

---

## 活动组件

### ActivityPage

**文件：** `app/activity/page.tsx`
**用途：** 活动控制台，带摘要卡片（总事件、错误、来源）和日志浏览器。标题包含"Open Live Stream"按钮，分发 `clawport:open-stream-widget` 打开全局浮动小部件。

**关键状态：**
- `entries`（useState）— 从 `/api/logs` 获取的日志条目
- `summary`（useState）— 计算的日志摘要（计数、来源、时间范围）
- `filter`（useState）— 日志级别过滤（`all`、`error`、`config`、`cron`）

**实现：**
- 挂载时从 `/api/logs` 获取历史日志，每 60 秒轮询
- 摘要卡片显示总事件、错误计数（带脉动动画）和来源分解
- "Open Live Stream"按钮分发 `CustomEvent('clawport:open-stream-widget')`

**使用者：** 路由 `/activity`

### LogBrowser

**文件：** `components/activity/LogBrowser.tsx`
**用途：** 带级别徽章和可展开详情的可过滤、可搜索的历史日志条目表。

**使用者：** `app/activity/page.tsx`

### LiveStreamWidget

**文件：** `components/LiveStreamWidget.tsx`
**用途：** 用于通过 SSE 进行实时日志流式传输的全局浮动小部件。挂载在根布局，跨导航持久存在。

**Props：** 无（自包含，监听 `clawport:open-stream-widget` DOM 事件）

**关键状态：**
- `state`（useState）— `'hidden'` | `'collapsed'` | `'expanded'`
- `lines`（useState）— `LiveLogLine[]`（最多 500，环形缓冲区）
- `streaming`（useState）— SSE 连接是否活动
- `autoScroll`（useState）— 跟踪手动滚动检测

**实现：**
- 三种视觉状态：隐藏（默认，返回 null）、折叠药丸（右下角）、展开面板（440x400）
- 通过 `fetch('/api/logs/stream')` 使用 `lib/sse.ts` 中的 `parseSSEBuffer()` 进行 SSE 流式传输
- 每个日志行显示时间、级别药丸（INF/WRN/ERR/DBG）、截断的消息
- 点击任意行展开原始 JSON 负载（格式化显示）
- 标题：状态圆点、行数、复制全部、最小化、关闭
- 页脚：播放/暂停切换、滚动到底部按钮
- 复制格式化为 `[HH:MM:SS] [level] message`
- 折叠不会停止流；关闭停止并隐藏
- z-index: 50（低于 OnboardingWizard）

**使用者：** `app/layout.tsx`（全局挂载）

---

## 页面组件

### HomePage（主页）

**文件：** `app/page.tsx`
**用途：** 带三种视图模式（地图、网格、活动）和代理详情侧面板的主仪表盘。

**关键状态：**
- `agents`（useState）— 从 `/api/agents` 获取
- `crons`（useState）— 从 `/api/crons` 获取
- `selectedAgent`（useState）— 详情面板的代理
- `view`（useState）— `'map' | 'grid' | 'feed'`
- `loading` / `error`（useState）

**实现：**
- 视图模式切换：标题中的三个图标按钮（Map、Grid、Activity）
- 地图视图：动态导入 `OrgMap`，带 `{ ssr: false }`
- 网格视图：渲染 `GridView`
- 活动视图：渲染 `FeedView`
- 代理详情面板：从右侧滑入（400px），显示头像、名称、头衔、描述、工具列表、层级链接、cron 健康
- 包含内联 `StatusDot` 和 `MapSkeleton` 辅助组件

**使用者：** 路由 `/`

---

### ChatPage

**文件：** `app/chat/page.tsx`
**用途：** 带代理选择和对话管理的完整消息界面。

**关键状态：**
- `agents`（useState）— 从 `/api/agents` 获取
- `conversations`（useState）— 来自 localStorage 的 `Map<string, Conversation>`
- `activeAgent`（useState）— 当前选择的代理
- `loading` / `error`（useState）

**实现：**
- 在 `Suspense` 边界中包装 `MessengerApp`
- `MessengerApp` 读取 `agent` 查询参数以预选代理
- 桌面端：双面板布局（AgentList 侧边栏 + ConversationView）
- 移动端：未选择代理时显示 AgentListMobile，选择代理时显示 ConversationView（带后退按钮）
- 对话持久化到 localStorage，按代理 ID 键控
- 包含内联 `EmptyState` 组件（桌面端未选择代理时显示）

**使用者：** 路由 `/chat`

---

### ChatRedirect

**文件：** `app/chat/[id]/page.tsx`
**用途：** 从 `/chat/[id]` 重定向到 `/chat?agent=[id]`。

**实现：**
- 使用 Next.js 的 `redirect()` 的服务器组件
- 启用直接代理聊天链接

**使用者：** 路由 `/chat/[id]`

---

### AgentDetailPage

**文件：** `app/agents/[id]/page.tsx`
**用途：** 完整的代理配置页面，带英雄部分、关于卡片、工具、层级、SOUL.md 查看器、cron 和语音配置。

**关键状态：**
- `agent`（useState）— 从 `/api/agents` 获取
- `crons`（useState）— 代理的 cron 任务
- `soulContent`（useState）— SOUL.md 文件内容
- `showSoul`（useState）— SOUL.md 查看器切换

**实现：**
- 英雄部分：大头像、名称、头衔、描述、"Chat"按钮链接到 `/chat?agent=[id]`
- 关于卡片：代理描述和元数据
- 工具卡片：代理工具/能力列表
- 层级卡片："Reports to"和"Direct reports"链接到其他代理页面
- SOUL.md 查看器：可折叠面板，显示代理的 SOUL.md 内容，带语法高亮
- Cron 卡片：带状态徽章的代理 cron 任务列表
- 语音配置卡片：语音设置显示
- 包含内联 `SoulViewer`、`CopyButton`、`Card`、`DetailSkeleton`、`StatusDot` 辅助组件
- 使用 `Breadcrumbs` 组件进行导航

**使用者：** 路由 `/agents/[id]`

---

### KanbanPage

**文件：** `app/kanban/page.tsx**
**用途：** 用于管理代理工作任务的看板，带拖放、CRUD 和代理工作集成。

**关键状态：**
- `tickets`（useState）— 来自 `KanbanStore`（localStorage）
- `agents`（useState）— 从 `/api/agents` 获取
- `selectedTicket`（useState）— 详情面板的任务
- `showCreate`（useState）— 创建模态框可见性
- `filterAgentId`（useState）— 代理过滤
- `agentWork` — 来自 `useAgentWork()` 钩子

**实现：**
- 代理过滤栏：水平滚动的代理头像按钮按分配者过滤
- 使用所有任务和代理渲染 `KanbanBoard`
- 点击任务时打开 `TicketDetailPanel`
- 用于新任务创建的 `CreateTicketModal`
- 任务 CRUD：通过 `KanbanStore` 方法创建、移动（状态更改）、删除
- 代理工作：`useAgentWork()` 钩子管理将任务发送给代理执行、轮询结果
- 重试工作：如果上次工作失败则重新发送任务给代理

**使用者：** 路由 `/kanban`

---

### CronsPage

**文件：** `app/crons/page.tsx`
**用途：** 带三个选项卡的 cron 监控仪表盘（概览、调度、流水线）。

**关键状态：**
- `crons`（useState）— 从 `/api/crons` 获取，每 60 秒自动刷新
- `agents`（useState）— 从 `/api/agents` 获取
- `tab`（useState）— `'overview' | 'schedule' | 'pipelines'`
- `filter`（useState）— `'all' | 'ok' | 'error' | 'idle'`
- `loading` / `error`（useState）

**实现：**
- **概览选项卡：** 健康甜甜圈图表（SVG）、需要关注的错误 cron 卡片、交付统计、错误横幅、近期运行列表（延迟加载）
- **调度选项卡：** `WeeklySchedule` 组件
- **流水线选项卡：** `PipelineGraph` 组件
- 包含许多内联辅助组件：
  - `HealthCard` — SVG 甜甜圈图表，显示 ok/error/idle 比例
  - `AttentionCard` — 需要关注的 cron 的可点击卡片
  - `DeliveryCard` — 交付成功率统计
  - `DeliveryBadge` — 颜色编码的状态徽章
  - `ErrorsBanners` — 可展开的错误详情横幅
  - `RecentRuns` — 延迟加载的近期运行历史
- 自动刷新：每 60 秒 `setInterval` 重新获取 cron 数据
- 概览选项卡中的过滤标签过滤 cron 列表

**使用者：** 路由 `/crons`

---

### MemoryPage

**文件：** `app/memory/page.tsx`
**用途：** 带搜索、导航和内容查看器的双面板内存文件浏览器。

**关键状态：**
- `files`（useState）— 从 `/api/memory` 获取
- `selectedFile`（useState）— 当前查看的文件
- `fileContent`（useState）— 选定文件的内容
- `search`（useState）— 文件搜索过滤
- `loading`（useState）

**实现：**
- 左侧面板：带搜索输入的文件树侧边栏、带图标文件列表、键盘导航（箭头键、回车）
- 右侧面板：带复制和下载按钮的内容查看器
- Markdown 文件：使用基本 Markdown 格式化渲染
- JSON 文件：带彩色标记的语法高亮
- 其他文件：渲染为纯预格式化文本
- 包含内联 `FileIcon`、`FolderIcon`、`BackArrow` 辅助组件
- 文件图标因扩展名而异（JSON、MD、TXT 等）

**使用者：** 路由 `/memory`

---

### SettingsPage

**文件：** `app/settings/page.tsx`
**用途：** 用于强调色、品牌、代理自定义和设置向导访问的设置管理页面。

**关键状态：**
- `agents`（useState）— 从 `/api/agents` 获取
- `showWizard`（useState）— 重新运行入门向导切换
- `expandedAgent`（useState）— 哪个代理的自定义部分已展开
- `imageUploading`（useState）— 图片上传期间的加载状态

**部分：**
1. **强调色** — 预设颜色网格（12 种颜色 + 重置为默认）
2. **品牌** — 门户名称、副标题、emoji 选择器、图标上传（Canvas API 调整为 128px）
3. **代理自定义** — 可展开的每个代理部分以覆盖 emoji 或个人资料图片
4. **危险区域** — 重置所有设置按钮、重新运行设置向导按钮

**实现：**
- 图片上传使用 Canvas API（`resizeImage` 辅助函数）调整为最大 128px 并转换为 base64 数据 URL
- 代理自定义：每个代理行展开以显示 emoji 输入和图片上传
- 重新运行向导：触发时渲染 `<OnboardingWizard forceOpen onClose={...} />`
- 全部重置：调用设置上下文的 `resetAll()`

**使用者：** 路由 `/settings`

---

## UI 原语

**目录：** `components/ui/`

基于 Radix 的原语组件，在整个应用中使用的标准 shadcn/ui 风格包装器。这些不会单独详细文档化。

| 组件 | 文件 | Radix 原语 | 用途 |
|-----------|------|-----------------|---------|
| Badge | `badge.tsx` | -- | 带变体样式的状态/标签徽章 |
| Button | `button.tsx` | Slot | 带变体和尺寸 props 的按钮 |
| Card | `card.tsx` | -- | 带页眉、内容、页脚的卡片容器 |
| Dialog | `dialog.tsx` | Dialog | 带覆盖的模态对话框 |
| ScrollArea | `scroll-area.tsx` | ScrollArea | 自定义滚动条容器 |
| Separator | `separator.tsx` | Separator | 水平/垂直分隔线 |
| Skeleton | `skeleton.tsx` | -- | 加载占位符动画 |
| Tabs | `tabs.tsx` | Tabs | 带内容面板的选项卡导航 |
| Tooltip | `tooltip.tsx` | Tooltip | 带定位的悬停工具提示 |
