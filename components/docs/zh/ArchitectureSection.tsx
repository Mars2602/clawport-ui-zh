import {
  Heading,
  SubHeading,
  Paragraph,
  CodeBlock,
  InlineCode,
  Table,
  BulletList,
  Callout,
  InfoCard,
} from "./DocSection";

export function ArchitectureSection() {
  return (
    <>
      <Heading>架构</Heading>
      <Paragraph>
        ClawPort 是一个用于管理 OpenClaw AI 代理的 Next.js 16 仪表板。它提供组织图（组织地图）、支持多模态的直接代理聊天、定时任务监控、看板任务板和记忆浏览。所有 AI 调用都通过 OpenClaw 网关 —— 无需单独的 API 密钥。
      </Paragraph>

      <SubHeading>技术栈</SubHeading>
      <BulletList
        items={[
          "Next.js 16.1.6（App Router、Turbopack）",
          "React 19.2.3、TypeScript 5",
          "Tailwind CSS 4 使用 CSS 自定义属性进行主题化",
          "Vitest 4 配合 jsdom 环境（17 个套件、288 个测试）",
          "OpenAI SDK（通过 OpenClaw 网关路由到 Claude，默认端口 18789）",
          "React Flow（@xyflow/react）用于组织图",
        ]}
      />

      <SubHeading>代理注册表解析</SubHeading>
      <CodeBlock>
        {`loadRegistry() 检查：
  1. $WORKSPACE_PATH/clawport/agents.json  （用户覆盖）
  2. 内置 lib/agents.json                 （默认）`}
      </CodeBlock>
      <Paragraph>
        <InlineCode>lib/agents-registry.ts</InlineCode> 导出{" "}
        <InlineCode>loadRegistry()</InlineCode>。{" "}
        <InlineCode>lib/agents.ts</InlineCode> 调用它来构建完整代理列表（合并工作区中的 SOUL.md 内容）。用户可以通过在工作区中放置{" "}
        <InlineCode>agents.json</InlineCode> 来定制他们的代理团队 —— 无需编辑源代码。
      </Paragraph>

      <SubHeading>聊天流程（文本）</SubHeading>
      <CodeBlock>
        {`客户端 -> POST /api/chat/[id] -> OpenAI SDK -> localhost:<port>/v1/chat/completions -> Claude
                                         （流式 SSE 响应，默认端口 18789）`}
      </CodeBlock>

      <SubHeading>聊天流程（图片/视觉）</SubHeading>
      <Paragraph>
        网关的 HTTP 端点会剥离 image_url 内容。视觉功能使用 CLI 代理流程：
      </Paragraph>
      <CodeBlock>
        {`客户端将图片调整到最大 1200px（Canvas API）
  -> base64 data URL 在消息中
  -> POST /api/chat/[id]
  -> 仅检测最新用户消息中的图片（不是历史记录）
  -> execFile: openclaw gateway call chat.send --params <json> --token <token>
  -> 轮询: openclaw gateway call chat.history 每 2 秒
  -> 按时间戳匹配响应 >= sendTs
  -> 通过 SSE 返回助手文本`}
      </CodeBlock>

      <InfoCard title="设计决策">
        <BulletList
          items={[
            <>
              <strong style={{ color: "var(--text-primary)" }}>
                为什么要发送然后轮询？
              </strong>{" "}
              chat.send 是异步的 —— 它立即返回。我们轮询 chat.history 直到助手的响应出现。
            </>,
            <>
              <strong style={{ color: "var(--text-primary)" }}>
                为什么要用 CLI 而不是 WebSocket？
              </strong>{" "}
              网关 WebSocket 需要设备密钥对签名才能获得 operator.write 范围。CLI 有设备密钥；自定义客户端没有。
            </>,
            <>
              <strong style={{ color: "var(--text-primary)" }}>
                为什么要调整到 1200px？
              </strong>{" "}
              macOS ARG_MAX 是 1MB。未调整大小的照片可能产生超过 CLI 参数限制的多 MB base64（E2BIG 错误）。
            </>,
          ]}
        />
      </InfoCard>

      <SubHeading>语音消息流程</SubHeading>
      <CodeBlock>
        {`浏览器 MediaRecorder（webm/opus 或 mp4）
  -> AudioContext AnalyserNode 捕获波形（40-60 个样本）
  -> 停止 -> audioBlob + 波形数据
  -> POST /api/transcribe（通过网关的 Whisper）
  -> 转录文本作为消息内容发送
  -> 音频 data URL + 波形存储在消息中以供播放`}
      </CodeBlock>

      <SubHeading>operatorName 流程</SubHeading>
      <CodeBlock>
        {`OnboardingWizard / 设置页面
  -> ClawPortSettings.operatorName（localStorage）
  -> settings-provider.tsx（React context）
  -> NavLinks.tsx（动态首字母 + 显示名称）
  -> ConversationView.tsx（在 POST body 中发送 operatorName）
  -> /api/chat/[id] 路由（注入系统提示）`}
      </CodeBlock>
      <Callout type="note">
        任何地方都没有硬编码的操作员名称。未设置时回退到 Operator 或 ??
      </Callout>

      <SubHeading>目录结构</SubHeading>
      <CodeBlock>
        {`app/
  page.tsx              -- 组织地图（React Flow 组织图）
  chat/page.tsx         -- 多代理通讯器
  agents/[id]/page.tsx  -- 代理详情页
  kanban/page.tsx       -- 任务板
  crons/page.tsx        -- 定时任务监控
  memory/page.tsx       -- 记忆文件浏览器
  docs/page.tsx         -- 文档浏览器
  settings/page.tsx     -- ClawPort 个性化
  api/
    agents/route.ts     -- 从注册表获取代理
    chat/[id]/route.ts  -- 发送聊天（文本 + 视觉）
    crons/route.ts      -- 通过 CLI 获取定时任务
    memory/route.ts     -- 获取记忆文件
    tts/route.ts        -- 文本转语音
    transcribe/route.ts -- 音频转录

components/
  OrgMap.tsx          -- React Flow 图形与自动布局
  AgentNode.tsx         -- 组织图自定义节点
  Sidebar.tsx           -- 桌面导航侧边栏
  MobileSidebar.tsx     -- 移动汉堡菜单
  NavLinks.tsx          -- 侧边栏导航链接
  ThemeToggle.tsx       -- 主题切换器（5 个主题）
  GlobalSearch.tsx      -- Cmd+K 代理搜索
  chat/                 -- 聊天组件
  kanban/               -- 看板组件
  crons/                -- 定时任务组件
  docs/                 -- 文档组件

lib/
  agents.ts             -- 代理注册表 + SOUL.md 读取器
  agents-registry.ts    -- 注册表加载器
  anthropic.ts          -- 视觉流程（send + poll）
  conversations.ts      -- 对话存储（localStorage）
  settings.ts           -- ClawPortSettings 类型 + 持久化
  themes.ts             -- 主题定义
  types.ts              -- 共享 TypeScript 类型`}
      </CodeBlock>

      <SubHeading>关键库</SubHeading>
      <Table
        headers={["文件", "用途"]}
        rows={[
          [
            <InlineCode key="a">lib/agents.ts</InlineCode>,
            "代理列表构建器 —— 调用 loadRegistry()，合并 SOUL.md",
          ],
          [
            <InlineCode key="ar">lib/agents-registry.ts</InlineCode>,
            "loadRegistry() —— 工作区覆盖 -> 内置备选",
          ],
          [
            <InlineCode key="an">lib/anthropic.ts</InlineCode>,
            "视觉流程：hasImageContent, sendViaOpenClaw (send + poll), execCli",
          ],
          [
            <InlineCode key="c">lib/conversations.ts</InlineCode>,
            "带 localStorage 持久化的对话存储",
          ],
          [
            <InlineCode key="e">lib/env.ts</InlineCode>,
            "requireEnv(name) —— 带清晰错误的安全环境变量访问",
          ],
          [
            <InlineCode key="m">lib/multimodal.ts</InlineCode>,
            "buildApiContent() —— 将 Message+Media 转换为 OpenAI API 格式",
          ],
          [
            <InlineCode key="s">lib/settings.ts</InlineCode>,
            "ClawPortSettings 类型，loadSettings()，saveSettings()（localStorage）",
          ],
          [
            <InlineCode key="v">lib/validation.ts</InlineCode>,
            "validateChatMessages() —— 验证文本 + 多模态内容数组",
          ],
        ]}
      />

      <SubHeading>约定</SubHeading>
      <BulletList
        items={[
          "没有外部图表/媒体库 —— 使用原生 Web API（Canvas、MediaRecorder、AudioContext）",
          "所有持久化媒体使用 Base64 data URL（不是 blob URL）",
          "使用 CSS 自定义属性进行主题化 —— 不直接使用 Tailwind 颜色类",
          "使用引用 CSS 变量的内联样式（例如：style={{ color: 'var(--text-primary)' }}）",
          "测试与源文件共存：lib/foo.ts + lib/foo.test.ts",
          "在函数内部调用 requireEnv()，而不是模块顶层",
        ]}
      />
    </>
  );
}
