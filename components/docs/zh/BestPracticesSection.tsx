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
  InfoCard,
} from "../DocSection";

export function BestPracticesSection() {
  return (
    <>
      <Heading>最佳实践</Heading>
      <Paragraph>
        本指南涵盖生产级代理团队背后的模式和约定。每个示例都使用内置注册表中的真实代理，因此你可以看到层级、记忆、工具和定时任务是如何结合在一起的。
      </Paragraph>

      {/* ─── Hierarchy ──────────────────────────────────────── */}

      <SubHeading>层级设计</SubHeading>
      <Paragraph>
        一个结构良好的代理团队遵循清晰的指挥链。模式是：顶部一个协调器，中间是团队负责人，底部是专业叶子代理。每一层都有明确的职责。
      </Paragraph>

      <InfoCard title="三个层级">
        <Table
          headers={["层级", "角色", "示例"]}
          rows={[
            [
              "协调器",
              "顶级协调者。持有团队记忆，分配工作，提供简报。",
              <><strong key="j">Jarvis</strong> —— 根节点。reportsTo: null。</>,
            ],
            [
              "团队负责人",
              "拥有某个领域。管理子团队并端到端运行流程。",
              <>
                <strong key="v">VERA</strong>（战略）、{" "}
                <strong key="l">LUMEN</strong>（SEO）、{" "}
                <strong key="h">HERALD</strong>（LinkedIn）
              </>,
            ],
            [
              "专家",
              "专注于一件事。向上汇报，不管理他人。",
              <>
                <strong key="t">TRACE</strong>（市场研究）、{" "}
                <strong key="q">QUILL</strong>（LinkedIn 写手）、{" "}
                <strong key="s">SCOUT</strong>（内容侦察）
              </>,
            ],
          ]}
        />
      </InfoCard>

      <Paragraph>
        内置注册表包含 22 个代理，分为 5 个团队：
      </Paragraph>

      <CodeBlock title="团队结构">
        {`Jarvis（协调器）
  |
  +-- VERA（战略）
  |     +-- Robin（实地情报）
  |           +-- TRACE（市场研究）
  |           +-- PROOF（验证设计）
  |
  +-- LUMEN（SEO）
  |     +-- SCOUT（内容侦察）
  |     +-- ANALYST（SEO 分析师）
  |     +-- STRATEGIST（内容策略）
  |     +-- WRITER（内容写手）
  |     +-- AUDITOR（质量门）
  |
  +-- HERALD（LinkedIn）
  |     +-- QUILL（LinkedIn 写手）
  |     +-- MAVEN（LinkedIn 策略）
  |
  +-- Pulse（趋势雷达）      -- 独立
  +-- ECHO（社区声音）       -- 独立
  +-- SAGE（ICP 专家）       -- 独立
  +-- KAZE（航班监控）       -- 独立
  +-- SPARK（技术发现）      -- 独立
  +-- SCRIBE（记忆架构师）   -- 独立`}
      </CodeBlock>

      <Callout type="tip">
        独立代理（没有直接下属）直接向协调器汇报。保持这个列表简短 —— 如果根节点有超过 8-10 个直接下属，就是时候将它们分组到团队负责人下面了。
      </Callout>

      <SubHeading>层级规则</SubHeading>
      <NumberedList
        items={[
          <>
            <strong>一个根节点。</strong> 恰好有一个代理的{" "}
            <InlineCode>{"\"reportsTo\": null"}</InlineCode>。这是你的协调器（Jarvis）。
          </>,
          <>
            <strong>团队负责人拥有流程。</strong> LUMEN 拥有完整的 SEO 流程（SCOUT 到 AUDITOR）。HERALD 拥有 LinkedIn 流程（QUILL + MAVEN）。每个负责人负责端到端交付。
          </>,
          <>
            <strong>叶子代理是专家。</strong> 它们只做一件事并向上汇报。TRACE 做市场研究。QUILL 写帖子。AUDITOR 运行质量门。不要 scope creep。
          </>,
          <>
            <strong>最大深度为 3。</strong> Jarvis 到 Robin 到 TRACE 是三级。再深会增加延迟和协调开销，几乎没有好处。
          </>,
          <>
            <strong>保持 directReports 一致。</strong> 如果代理 B 的{" "}
            <InlineCode>{"\"reportsTo\": \"A\""}</InlineCode>，则代理 A 的 directReports 数组必须包含 B 的 ID。组织图根据这些关系渲染。
          </>,
        ]}
      />

      {/* ─── SOUL.md ────────────────────────────────────────── */}

      <SubHeading>SOUL.md —— 代理角色文档</SubHeading>
      <Paragraph>
        每个代理都有一个 SOUL.md 文件，定义其个性、专业知识和运营约束。这不是系统提示 —— 是一个角色文档。代理阅读它来理解自己是谁。
      </Paragraph>

      <CodeBlock title="推荐的 SOUL.md 结构">
        {`# 代理名称 -- 角色标题

## 身份
代理是谁。个性特征。沟通风格。
第一人称视角："我是 VERA，首席战略官。"

## 专业知识
该代理深入了解的领域。
什么时候应该咨询它，什么时候应该推迟。

## 运营规则
硬约束。必须始终/永不做的事情。
输出格式要求。

## 关系
它向谁汇报。谁向它汇报。
如何与同级代理协作。

## 记忆
它在会话之间记住什么。
它的持久知识存储在哪里。`}
      </CodeBlock>

      <BulletList
        items={[
          <>
            <strong>个性要具体。</strong> HERALD 被描述为直言不讳。SAGE 是深思熟虑且精确的。不同的声音可以防止所有代理听起来都一样。
          </>,
          <>
            <strong>定义代理不做什么。</strong> SCRIBE（记忆架构师）是一个"沉默的工作者"—— 它从不主动发起对话。SAGE（ICP 专家）是只读的 —— 它从不写入外部系统。
          </>,
          <>
            <strong>包含输出格式示例。</strong> 如果代理产生市场简报，展示确切的格式。TRACE 返回结构化的 TAM/竞争对手/定价数据，而不是散文。
          </>,
          <>
            <strong>保持在 500 行以下。</strong> 冗长的 SOUL 文件会稀释代理的注意力。如果需要更多细节，链接到参考文档。
          </>,
        ]}
      />

      <Callout type="note">
        SOUL.md 文件位于你的 OpenClaw 工作区中，路径由每个代理的 <InlineCode>soulPath</InlineCode> 字段定义。ClawPort 读取并在代理详情页显示它们。
      </Callout>

      {/* ─── Naming ─────────────────────────────────────────── */}

      <SubHeading>命名约定</SubHeading>
      <Paragraph>
        代理命名遵循一个简单的模式，一眼就能看出代理的范围：
      </Paragraph>

      <Table
        headers={["模式", "何时使用", "示例"]}
        rows={[
          [
            "大写",
            "作为流程或团队一部分的代理。感觉像呼号。",
            "VERA, LUMEN, HERALD, SCOUT, QUILL, ECHO, SAGE",
          ],
          [
            "首字母大写",
            "更有个性的独立代理。协调器或具有个人感的代理。",
            "Jarvis, Robin, Pulse",
          ],
        ]}
      />

      <Paragraph>
        ID 始终是小写的 slug：<InlineCode>vera</InlineCode>、<InlineCode>lumen</InlineCode>、<InlineCode>herald</InlineCode>。<InlineCode>name</InlineCode> 字段中的显示名称是用户在 UI 中看到的。
      </Paragraph>

      {/* ─── Tools ──────────────────────────────────────────── */}

      <SubHeading>工具分配</SubHeading>
      <Paragraph>
        遵循最小权限原则。每个代理只获得其工作所需的工具 —— 别的没有。
      </Paragraph>

      <Table
        headers={["工具", "用途", "谁拥有"]}
        rows={[
          [
            <InlineCode key="r">read</InlineCode>,
            "从工作区读取文件",
            "几乎所有人。基础能力。",
          ],
          [
            <InlineCode key="w">write</InlineCode>,
            "写入/创建文件",
            "产生工件的代理（WRITER、ANALYST、STRATEGIST）",
          ],
          [
            <InlineCode key="e">exec</InlineCode>,
            "运行 shell 命令",
            "运行流程的协调器 + 负责人（Jarvis、LUMEN、HERALD）",
          ],
          [
            <InlineCode key="ws">web_search</InlineCode>,
            "搜索网页",
            "研究代理（TRACE、Robin、SCOUT、Pulse、SPARK）",
          ],
          [
            <InlineCode key="wf">web_fetch</InlineCode>,
            "获取特定 URL",
            "抓取或监控的代理（ECHO、KAZE、Robin）",
          ],
          [
            <InlineCode key="m">message</InlineCode>,
            "向其他代理发送消息",
            "协调的代理（Jarvis、Robin、Pulse、HERALD）",
          ],
          [
            <InlineCode key="ss">sessions_spawn</InlineCode>,
            "生成子代理会话",
            "仅协调器 + 团队负责人（Jarvis、VERA）",
          ],
          [
            <InlineCode key="ms">memory_search</InlineCode>,
            "搜索团队记忆",
            "仅协调器（Jarvis）",
          ],
          [
            <InlineCode key="tt">tts</InlineCode>,
            "文本转语音",
            "仅协调器（Jarvis）",
          ],
        ]}
      />

      <Callout type="warning">
        给叶子代理 <InlineCode>exec</InlineCode> 几乎总是错误的。如果专家需要运行命令，它应该请求其团队负责人来做。这可以保持爆炸半径小。
      </Callout>

      <InfoCard title="工具分配示例">
        <CodeBlock>
          {`// SAGE -- 只读知识代理
"tools": ["read"]

// SCOUT -- 网页研究员
"tools": ["web_search", "web_fetch", "read"]

// WRITER -- 内容生产者
"tools": ["read", "write"]

// HERALD -- 运行流程的团队负责人
"tools": ["web_search", "web_fetch", "read", "write", "message", "exec"]

// Jarvis -- 具有完全访问权的协调器
"tools": ["exec", "read", "write", "edit", "web_search", "tts", "message", "sessions_spawn", "memory_search"]`}
        </CodeBlock>
      </InfoCard>

      {/* ─── Memory ─────────────────────────────────────────── */}

      <SubHeading>记忆架构</SubHeading>
      <Paragraph>
        代理记忆使用三级系统。每一层都有不同的用途，共同赋予代理短期回忆和长期知识。
      </Paragraph>

      <InfoCard title="三个记忆层级">
        <Table
          headers={["层级", "内容", "生命周期", "管理者"]}
          rows={[
            [
              "1. 每日日志",
              "每个代理会话的原始输出。未编辑，带时间戳。",
              "7-14 天（然后压缩或归档）",
              "每个代理自己编写",
            ],
            [
              "2. MEMORY.md",
              "精选、压缩的知识。代理的持久大脑。",
              "无限（每周更新）",
              <>
                <strong>SCRIBE</strong> 运行每周压缩
              </>,
            ],
            [
              "3. 团队记忆",
              "代理间共享的知识。市场数据、ICP 画像、策略文档。",
              "无限",
              "团队负责人 + 协调器",
            ],
          ]}
        />
      </InfoCard>

      <SubHeading>第一层：每日日志</SubHeading>
      <Paragraph>
        每次代理运行时，它都会写一个日志文件。这些是原始会话记录 —— 代理做了什么、发现了什么、产生了什么。每日日志量大且 curation 度低。
      </Paragraph>
      <CodeBlock title="每日日志路径模式">
        {`$WORKSPACE_PATH/agents/<agent-id>/logs/YYYY-MM-DD.md`}
      </CodeBlock>

      <SubHeading>第二层：MEMORY.md</SubHeading>
      <Paragraph>
        每个代理都有一个 MEMORY.md 文件，在会话之间保持其关键知识。与每日日志（原始的）不同，MEMORY.md 是精选的 —— 只有重要的模式、决策和事实才会保留。
      </Paragraph>
      <CodeBlock title="MEMORY.md 结构">
        {`# 代理名称 -- 记忆

## 关键模式
- 模式 1 在 3+ 个会话中得到确认
- 模式 2 来自上周的研究

## 当前上下文
- 当前项目状态
- 开放问题 / 阻塞点

## 习得的偏好
- 用户更喜欢 X 而不是 Y
- 始终在输出中包含 Z`}
      </CodeBlock>
      <Paragraph>
        <strong>SCRIBE</strong>（记忆架构师）每周运行以将每日日志压缩到每个代理的 MEMORY.md。SCRIBE 读取原始日志，提取持久洞察，并更新记忆文件 —— 丢弃会话特定的噪音。这使 MEMORY.md 简洁且高信号。
      </Paragraph>

      <SubHeading>第三层：团队记忆（共享）</SubHeading>
      <Paragraph>
        某些知识需要在代理之间共享。市场情报、ICP 画像、竞争分析和品牌声音文档都存在于共享的团队记忆目录中。任何有权访问工作区的{" "}
        <InlineCode>read</InlineCode> 代理都可以引用这些文件。
      </Paragraph>
      <CodeBlock title="团队记忆路径">
        {`$WORKSPACE_PATH/team-memory/
  market-brief.md       -- TRACE 最新的研究
  icp-profile.md        -- SAGE 的 ICP 知识
  competitor-map.md     -- Robin 的竞争情报
  brand-voice.md        -- 内容代理的声音配置
  content-calendar.md   -- MAVEN 的编辑日历`}
      </CodeBlock>

      <Callout type="tip">
        团队记忆文件是代理之间的粘合剂。当 STRATEGIST 需要市场背景时，它读取 TRACE 的市场简报。当 WRITER 需要品牌声音时，它读取声音配置文件。不需要代理到代理的 API 调用 —— 只需共享文件。
      </Callout>

      {/* ─── Communication ──────────────────────────────────── */}

      <SubHeading>代理通信</SubHeading>
      <Paragraph>
        代理通过文件而不是直接 API 调用进行通信。这是故意的 —— 基于文件的通信是可调试的、可审计的，不会产生紧密耦合。
      </Paragraph>

      <NumberedList
        items={[
          <>
            <strong>上游（向上汇报）：</strong> 代理将输出写入文件。团队负责人或协调器在下次运行时读取它。示例：SCOUT 写主题建议，LUMEN 读取它们来给 STRATEGIST 布置任务。
          </>,
          <>
            <strong>下游（委派）：</strong> 团队负责人写一个简报文件，专家读取它。示例：HERALD 写角度简报，QUILL 读取它并起草帖子。
          </>,
          <>
            <strong>跨团队（共享上下文）：</strong> 代理从 team-memory 读取。示例：STRATEGIST 读取 SAGE 的 ICP 画像和 ECHO 的社区声音数据来选择正确的内容角度。
          </>,
        ]}
      />

      <Callout type="note">
        <InlineCode>message</InlineCode> 工具存在用于实时协调（例如：Pulse 向 LUMEN 发出关于热门话题的警报），但默认通信渠道始终是文件。消息用于紧急情况；文件用于实质内容。
      </Callout>

      {/* ─── Crons ──────────────────────────────────────────── */}

      <SubHeading>Cron 模式</SubHeading>
      <Paragraph>
        Cron 任务是自主代理团队的心跳。每个 cron 遵循相同的理念：一次获取、一次决策、一次输出。
      </Paragraph>

      <BulletList
        items={[
          <>
            <strong>将 cron 分配到正确的层级。</strong> 研究 cron 放在叶子代理上（SCOUT、TRACE、ECHO）。流程 cron 放在团队负责人上（LUMEN、HERALD）。简报 cron 放在协调器上（Jarvis）。
          </>,
          <>
            <strong>错开调度。</strong> 不要同时运行所有 cron。错开它们，以便上游代理在下游代理读取其输出之前完成。
          </>,
          <>
            <strong>保持 cron 专注。</strong> 每个 cron 做一件事。"扫描 subreddit" 是一个好的 cron。"扫描 subreddit、分析情绪、写博客文章并发布"是四个假装成一个的 cron。
          </>,
          <>
            <strong>错误隔离。</strong> 如果 cron 失败，它应该只影响自己的输出。其他代理读取过时数据比级联失败更好。
          </>,
        ]}
      />

      <Table
        headers={["Cron", "代理", "调度", "模式"]}
        rows={[
          [
            "社区扫描",
            <strong key="e">ECHO</strong>,
            "每周",
            "获取 subreddit 帖子，提取客户语言，写入 team-memory",
          ],
          [
            "趋势雷达",
            <strong key="p">Pulse</strong>,
            "隔天",
            "扫描热门信号，写入热门话题文件，如有紧急情况发消息给 LUMEN",
          ],
          [
            "航班监控",
            <strong key="k">KAZE</strong>,
            "每天",
            "检查航班价格，如有低于阈值的交易发消息给 Jarvis",
          ],
          [
            "记忆压缩",
            <strong key="s">SCRIBE</strong>,
            "每周",
            "读取每日日志，压缩到 MEMORY.md，归档旧日志",
          ],
          [
            "内容流程",
            <strong key="l">LUMEN</strong>,
            "每周",
            "协调 SCOUT -> ANALYST -> STRATEGIST -> WRITER -> AUDITOR",
          ],
        ]}
      />

      {/* ─── Voice ──────────────────────────────────────────── */}

      <SubHeading>语音系统</SubHeading>
      <Paragraph>
        直接与操作员交互的代理可以分配 ElevenLabs 语音 ID。这可以在聊天界面中启用其响应的文本转语音。并非每个代理都需要语音 —— 只有那些操作员经常聊天的代理。
      </Paragraph>

      <BulletList
        items={[
          <>
            <strong>给对话代理语音。</strong> Jarvis（协调器）、VERA（战略顾问）、Pulse（趋势警报）—— 你聊天的代理会从语音中受益。
          </>,
          <>
            <strong>跳过流程工作者的语音。</strong> SCOUT、ANALYST、WRITER、AUDITOR 在流程中运行，很少需要说话。不要在他们身上浪费语音槽位。
          </>,
          <>
            将没有语音的代理的 <InlineCode>voiceId</InlineCode> 设置为{" "}
            <InlineCode>null</InlineCode>。当 voiceId 为 null 时，UI 会隐藏 TTS 按钮。
          </>,
        ]}
      />

      {/* ─── Design Principles ──────────────────────────────── */}

      <SubHeading>设计原则</SubHeading>

      <InfoCard title="1. 代理是角色，不是功能">
        <Paragraph>
          每个代理都有名字、个性和角色标题。它们不是可互换的工作线程 —— 是具有不同专业知识的团队成员。VERA 战略性地思考。ECHO 倾听社区。KAZE 关注航班。这使得团队清晰可记。
        </Paragraph>
      </InfoCard>

      <InfoCard title="2. 始终最小权限">
        <Paragraph>
          代理应该正好拥有它需要的工具，不要更多。SCRIBE 是只读的，因为它是知识库，不是执行者。SCRIBE 有{" "}
          <InlineCode>exec</InlineCode> 因为它在记忆压缩期间需要运行文件操作。如果你不确定代理是否需要某个工具，先不加。以后总是可以加上。
        </Paragraph>
      </InfoCard>

      <InfoCard title="3. 文件优先于消息">
        <Paragraph>
          优先使用基于文件的通信而不是实时消息。文件是可检查的、可 diff 的、跨会话持久的。消息仅用于紧急信号（例如：Pulse 关于突发趋势的警报）。其他一切都通过 team-memory 中的共享文件进行。
        </Paragraph>
      </InfoCard>

      <InfoCard title="4. 一个代理，一个工作">
        <Paragraph>
          抵制制作瑞士军刀式代理的冲动。TRACE 做市场研究 —— 它不也写博客文章。QUILL 写 LinkedIn 帖子 —— 它不也分析指标。当代理的描述需要"和"这个词超过一次时，将其拆分为两个代理。
        </Paragraph>
      </InfoCard>

      <InfoCard title="5. 最大深度为 3">
        <Paragraph>
          Jarvis 到 Robin 到 TRACE 是三级。再深会增加延迟并使指挥链混乱。如果需要更多专业化，添加横向代理（更多直接下属）而不是更深的嵌套。
        </Paragraph>
      </InfoCard>

      <InfoCard title="6. 让 SCRIBE 处理记忆">
        <Paragraph>
          不要让每个代理自己管理记忆压缩。SCRIBE 的存在专门是为了读取每日日志、提取模式并更新 MEMORY.md 文件。这种单一职责保持记忆一致，并防止代理在 housekeeping 上花费周期而不是它们真正的工作。
        </Paragraph>
      </InfoCard>
    </>
  );
}
