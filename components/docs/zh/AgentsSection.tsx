import {
  Heading,
  SubHeading,
  Paragraph,
  CodeBlock,
  InlineCode,
  Table,
  BulletList,
  NumberedList,
  Callout,
} from "../DocSection";

export function AgentsSection() {
  return (
    <>
      <Heading>代理</Heading>
      <Paragraph>
        ClawPort 会自动从你的 OpenClaw 工作区发现代理。无需配置 —— 如果你的工作区中有代理，ClawPort 会找到并显示它们。
      </Paragraph>

      <SubHeading>自动发现（默认）</SubHeading>
      <Paragraph>
        ClawPort 扫描 <InlineCode>$WORKSPACE_PATH/agents/</InlineCode> 中包含
        <InlineCode>SOUL.md</InlineCode> 文件的子目录。每个目录成为一个代理，包含：
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>名称</strong>
            来自 SOUL.md 中的第一个 <InlineCode># 标题</InlineCode>，或目录名作为备选
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>职位</strong>
            来自标题中破折号后的角色描述（例如："ECHO -- 社区语音监控"）
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>子代理</strong>
            来自 <InlineCode>sub-agents/</InlineCode> 和 <InlineCode>members/</InlineCode> 子目录
          </>,
        ]}
      />
      <Paragraph>
        如果 <InlineCode>$WORKSPACE_PATH/SOUL.md</InlineCode> 存在，它将成为根协调器。如果{" "}
        <InlineCode>$WORKSPACE_PATH/IDENTITY.md</InlineCode> 存在，根代理的名称和 emoji 将从其中读取。
      </Paragraph>

      <SubHeading>使用自定义注册表</SubHeading>
      <Paragraph>
        要完全控制名称、颜色、emoji、层级和工具，请在以下位置创建文件：
      </Paragraph>
      <CodeBlock>{`$WORKSPACE_PATH/clawport/agents.json`}</CodeBlock>
      <Paragraph>
        ClawPort 每次请求都会检查此文件。如果存在，它将完全替换自动发现功能。如果缺失或包含无效 JSON，则使用自动发现。
      </Paragraph>

      <SubHeading>代理条目格式</SubHeading>
      <CodeBlock title="agents.json">
        {`[
  {
    "id": "my-agent",
    "name": "My Agent",
    "title": "What this agent does",
    "reportsTo": null,
    "directReports": [],
    "soulPath": "agents/my-agent/SOUL.md",
    "voiceId": null,
    "color": "#06b6d4",
    "emoji": "\\u{1F916}",
    "tools": ["read", "write"],
    "memoryPath": null,
    "description": "One-liner about this agent."
  }
]`}
      </CodeBlock>

      <SubHeading>字段参考</SubHeading>
      <Table
        headers={["字段", "类型", "描述"]}
        rows={[
          [
            <InlineCode key="id">id</InlineCode>,
            "string",
            "代理的唯一标识符（例如：vera）",
          ],
          [
            <InlineCode key="name">name</InlineCode>,
            "string",
            "显示名称（例如：VERA）",
          ],
          [
            <InlineCode key="title">title</InlineCode>,
            "string",
            "职位名称（例如：首席战略官）",
          ],
          [
            <InlineCode key="rt">reportsTo</InlineCode>,
            "string | null",
            "组织图中父代理的 ID，根节点为 null",
          ],
          [
            <InlineCode key="dr">directReports</InlineCode>,
            "string[]",
            "子代理 ID 数组",
          ],
          [
            <InlineCode key="sp">soulPath</InlineCode>,
            "string | null",
            "代理 SOUL.md 的路径，相对于 WORKSPACE_PATH",
          ],
          [
            <InlineCode key="vi">voiceId</InlineCode>,
            "string | null",
            "ElevenLabs 语音 ID（需要 ELEVENLABS_API_KEY）",
          ],
          [
            <InlineCode key="co">color</InlineCode>,
            "string",
            "组织图中代理节点的颜色（十六进制）",
          ],
          [
            <InlineCode key="em">emoji</InlineCode>,
            "string",
            "显示为代理头像的 emoji",
          ],
          [
            <InlineCode key="to">tools</InlineCode>,
            "string[]",
            "该代理有权访问的工具列表",
          ],
          [
            <InlineCode key="mp">memoryPath</InlineCode>,
            "string | null",
            "代理专属记忆的路径（相对于 WORKSPACE_PATH）",
          ],
          [
            <InlineCode key="de">description</InlineCode>,
            "string",
            "UI 中显示的单行描述",
          ],
        ]}
      />

      <SubHeading>层级规则</SubHeading>
      <BulletList
        items={[
          <>
            只有一个代理的 <InlineCode>{"\"reportsTo\": null"}</InlineCode> —— 这是你的根/协调器节点
          </>,
          <>
            <InlineCode>directReports</InlineCode> 应与 <InlineCode>reportsTo</InlineCode> 一致。如果代理 B 汇报给代理 A，则 A 的 directReports 应包含 B 的 ID
          </>,
          "组织图使用这些关系自动构建组织结构",
        ]}
      />

      <SubHeading>示例：最小双代理配置</SubHeading>
      <CodeBlock title="agents.json">
        {`[
  {
    "id": "boss",
    "name": "Boss",
    "title": "Orchestrator",
    "reportsTo": null,
    "directReports": ["worker"],
    "soulPath": "SOUL.md",
    "voiceId": null,
    "color": "#f5c518",
    "emoji": "\\u{1F451}",
    "tools": ["read", "write", "exec", "message"],
    "memoryPath": null,
    "description": "Top-level orchestrator."
  },
  {
    "id": "worker",
    "name": "Worker",
    "title": "Task Runner",
    "reportsTo": "boss",
    "directReports": [],
    "soulPath": "agents/worker/SOUL.md",
    "voiceId": null,
    "color": "#22c55e",
    "emoji": "\\u{2699}\\u{FE0F}",
    "tools": ["read", "write"],
    "memoryPath": null,
    "description": "Handles assigned tasks."
  }
]`}
      </CodeBlock>

      <SubHeading>注册表解析顺序</SubHeading>
      <NumberedList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>用户覆盖</strong> ——{" "}
            <InlineCode>$WORKSPACE_PATH/clawport/agents.json</InlineCode>（如果存在且为有效 JSON）
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>自动发现</strong> —— 扫描{" "}
            <InlineCode>$WORKSPACE_PATH/agents/</InlineCode> 中包含 SOUL.md、sub-agents 和 members 的子目录
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>内置备选</strong> ——{" "}
            <InlineCode>lib/agents.json</InlineCode>（演示用示例团队）
          </>,
        ]}
      />

      <Callout type="tip">
        你可以在不编辑任何源代码的情况下添加新代理 —— 只需更新工作区的 <InlineCode>agents.json</InlineCode>。代理将自动出现在组织图、聊天和详情页面中。
      </Callout>

      <SubHeading>代理显示覆盖</SubHeading>
      <Paragraph>
        每个代理可以通过设置页面覆盖专属的 emoji 和/或头像图片。这些存储在{" "}
        <InlineCode>ClawPortSettings.agentOverrides</InlineCode> 中，以代理 ID 为键。<InlineCode>getAgentDisplay()</InlineCode> 函数解析每个代理的有效视觉元素，考虑覆盖因素。
      </Paragraph>
    </>
  );
}
