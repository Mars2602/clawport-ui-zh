import {
  Heading,
  SubHeading,
  Paragraph,
  CodeBlock,
  InlineCode,
  Table,
  Callout,
  InfoCard,
} from "./DocSection";

export function ApiReferenceSection() {
  return (
    <>
      <Heading>API 参考</Heading>
      <Paragraph>
        所有 API 路由都是 Next.js App Router 路由处理器，位于{" "}
        <InlineCode>app/api/</InlineCode>。开发期间的基 URL 是{" "}
        <InlineCode>http://localhost:3000</InlineCode>。
      </Paragraph>

      <InfoCard title="错误格式">
        <Paragraph>
          所有错误响应共享一致的 JSON 格式：
        </Paragraph>
        <CodeBlock>{`{ "error": "Human-readable error message" }`}</CodeBlock>
      </InfoCard>

      <SubHeading>路由概览</SubHeading>
      <Table
        headers={["方法", "端点", "网关", "Content-Type"]}
        rows={[
          [
            "GET",
            <InlineCode key="1">/api/agents</InlineCode>,
            "否",
            "application/json",
          ],
          [
            "POST",
            <InlineCode key="2">/api/chat/[id]</InlineCode>,
            "是",
            "text/event-stream",
          ],
          [
            "GET",
            <InlineCode key="3">/api/crons</InlineCode>,
            "否",
            "application/json",
          ],
          [
            "GET",
            <InlineCode key="4">/api/cron-runs</InlineCode>,
            "否",
            "application/json",
          ],
          [
            "GET",
            <InlineCode key="5">/api/memory</InlineCode>,
            "否",
            "application/json",
          ],
          [
            "POST",
            <InlineCode key="6">/api/tts</InlineCode>,
            "是",
            "audio/mpeg",
          ],
          [
            "POST",
            <InlineCode key="7">/api/transcribe</InlineCode>,
            "是",
            "application/json",
          ],
          [
            "POST",
            <InlineCode key="8">/api/kanban/chat/[id]</InlineCode>,
            "是",
            "text/event-stream",
          ],
          [
            "GET",
            <InlineCode key="9">/api/kanban/chat-history/[ticketId]</InlineCode>,
            "否",
            "application/json",
          ],
          [
            "POST",
            <InlineCode key="10">/api/kanban/chat-history/[ticketId]</InlineCode>,
            "否",
            "application/json",
          ],
        ]}
      />

      {/* ── GET /api/agents ────────────────────────────────────── */}
      <SubHeading>GET /api/agents</SubHeading>
      <Paragraph>
        返回已注册代理的完整列表，每个代理都从文件系统加载了 SOUL.md 内容。无需参数。
      </Paragraph>
      <Table
        headers={["字段", "类型", "描述"]}
        rows={[
          [<InlineCode key="id">id</InlineCode>, "string", "Slug 标识符"],
          [<InlineCode key="n">name</InlineCode>, "string", "显示名称"],
          [<InlineCode key="t">title</InlineCode>, "string", "职位名称"],
          [
            <InlineCode key="s">soul</InlineCode>,
            "string | null",
            "完整的 SOUL.md 内容，如果文件未找到则为 null",
          ],
          [
            <InlineCode key="c">crons</InlineCode>,
            "CronJob[]",
            "从此端点始终返回 []（在客户端填充）",
          ],
        ]}
      />

      {/* ── POST /api/chat/[id] ────────────────────────────────── */}
      <SubHeading>POST /api/chat/[id]</SubHeading>
      <Paragraph>
        向代理发送聊天消息并接收流式响应。根据最新用户消息是否包含图片，有两个不同的处理流程。
      </Paragraph>
      <Table
        headers={["字段", "类型", "必需", "描述"]}
        rows={[
          [
            <InlineCode key="m">messages</InlineCode>,
            "ApiMessage[]",
            "是",
            "对话历史",
          ],
          [
            <InlineCode key="o">operatorName</InlineCode>,
            "string",
            "否",
            "显示给代理的名称。默认为 Operator",
          ],
        ]}
      />
      <Paragraph>
        <strong style={{ color: "var(--text-primary)" }}>流程 1（文本）：</strong>{" "}
        通过网关进行流式聊天完成。响应是 SSE，包含{" "}
        <InlineCode>{"data: {\"content\":\"token\"}"}</InlineCode> 帧。
      </Paragraph>
      <Paragraph>
        <strong style={{ color: "var(--text-primary)" }}>流程 2（视觉）：</strong>{" "}
        当最新消息包含 image_url 内容时。使用 CLI chat.send + chat.history 轮询。完整响应在单个 SSE 帧中到达。
      </Paragraph>

      {/* ── GET /api/crons ─────────────────────────────────────── */}
      <SubHeading>GET /api/crons</SubHeading>
      <Paragraph>
        返回在 OpenClaw 注册的所有定时任务，丰富了调度描述、代理所属和投递配置。运行{" "}
        <InlineCode>openclaw cron list --json</InlineCode> 通过 CLI。
      </Paragraph>

      {/* ── GET /api/cron-runs ─────────────────────────────────── */}
      <SubHeading>GET /api/cron-runs</SubHeading>
      <Paragraph>
        返回从文件系统上的 JSONL 日志文件解析的定时任务运行历史。结果按最新优先排序。可选的{" "}
        <InlineCode>jobId</InlineCode> 查询参数过滤到特定任务。
      </Paragraph>

      {/* ── GET /api/memory ────────────────────────────────────── */}
      <SubHeading>GET /api/memory</SubHeading>
      <Paragraph>
        返回工作区中关键记忆文件的内容：长期记忆、团队记忆、团队情报以及今天和昨天的每日日志。只包含存在的文件。
      </Paragraph>

      {/* ── POST /api/tts ──────────────────────────────────────── */}
      <SubHeading>POST /api/tts</SubHeading>
      <Paragraph>
        使用 OpenClaw 网关的 TTS 端点将文本转换为语音音频。
      </Paragraph>
      <Table
        headers={["字段", "类型", "必需", "描述"]}
        rows={[
          [
            <InlineCode key="t">text</InlineCode>,
            "string",
            "是",
            "要合成的文本",
          ],
          [
            <InlineCode key="v">voice</InlineCode>,
            "string",
            "否",
            "语音标识符。默认为 alloy",
          ],
        ]}
      />

      {/* ── POST /api/transcribe ───────────────────────────────── */}
      <SubHeading>POST /api/transcribe</SubHeading>
      <Paragraph>
        使用 Whisper 端点将音频转录为文本。请求体是 multipart 表单数据，包含{" "}
        <InlineCode>audio</InlineCode> 文件字段。
      </Paragraph>

      {/* ── SSE Protocol ───────────────────────────────────────── */}
      <SubHeading>SSE 流协议</SubHeading>
      <Paragraph>
        所有流式聊天端点使用相同的 Server-Sent Events 协议：
      </Paragraph>
      <CodeBlock>
        {`data: {"content":"Hello"}

data: {"content":" there"}

data: [DONE]`}
      </CodeBlock>
      <Callout type="note">
        Content-Type 是 <InlineCode>text/event-stream</InlineCode>，包含{" "}
        <InlineCode>Cache-Control: no-cache</InlineCode>。如果在响应中间发生流错误，服务器发送 [DONE] 并关闭连接。
      </Callout>

      <SubHeading>客户端消费</SubHeading>
      <CodeBlock title="example">
        {`const reader = response.body.getReader()
const decoder = new TextDecoder()
let fullText = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  const lines = chunk.split('\\n')

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
}`}
      </CodeBlock>
    </>
  );
}
