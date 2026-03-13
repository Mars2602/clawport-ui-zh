import {
  Heading,
  SubHeading,
  Paragraph,
  CodeBlock,
  InlineCode,
  Table,
  BulletList,
  Callout,
} from "../DocSection";

export function CronSystemSection() {
  return (
    <>
      <Heading>定时任务系统</Heading>
      <Paragraph>
        ClawPort 提供完整的定时任务监控仪表板，有三个视图：概览（健康甜甜圈、关注卡片、错误横幅）、每周计划（7 天日历网格）和流程图（React Flow 依赖可视化）。数据从 OpenClaw CLI 获取，每 60 秒自动刷新。
      </Paragraph>

      <SubHeading>CronJob 模式</SubHeading>
      <Table
        headers={["字段", "类型", "描述"]}
        rows={[
          [<InlineCode key="id">id</InlineCode>, "string", "任务标识符"],
          [
            <InlineCode key="n">name</InlineCode>,
            "string",
            "任务名称（用于按前缀匹配所属代理）",
          ],
          [
            <InlineCode key="s">schedule</InlineCode>,
            "string",
            "原始 cron 表达式",
          ],
          [
            <InlineCode key="sd">scheduleDescription</InlineCode>,
            "string",
            "人类可读（例如：每天上午 8 点）",
          ],
          [
            <InlineCode key="tz">timezone</InlineCode>,
            "string | null",
            "调度对象中的时区（如果存在）",
          ],
          [
            <InlineCode key="st">status</InlineCode>,
            '"ok" | "error" | "idle"',
            "上次运行结果",
          ],
          [
            <InlineCode key="lr">lastRun</InlineCode>,
            "string | null",
            "上次执行的 ISO 8601 时间戳",
          ],
          [
            <InlineCode key="nr">nextRun</InlineCode>,
            "string | null",
            "下次计划运行的 ISO 8601 时间戳",
          ],
          [
            <InlineCode key="le">lastError</InlineCode>,
            "string | null",
            "上次失败运行的消息",
          ],
          [
            <InlineCode key="ai">agentId</InlineCode>,
            "string | null",
            "所属代理 ID（按任务名称前缀匹配）",
          ],
          [
            <InlineCode key="en">enabled</InlineCode>,
            "boolean",
            "任务是否处于活动状态",
          ],
          [
            <InlineCode key="dl">delivery</InlineCode>,
            "CronDelivery | null",
            "投递配置（模式、渠道、接收人）",
          ],
          [
            <InlineCode key="ld">lastDurationMs</InlineCode>,
            "number | null",
            "上次运行的持续时间（毫秒）",
          ],
          [
            <InlineCode key="ce">consecutiveErrors</InlineCode>,
            "number",
            "连续失败运行计数",
          ],
        ]}
      />

      <SubHeading>CronRun 模式</SubHeading>
      <Paragraph>
        运行历史从 <InlineCode>$WORKSPACE_PATH/../cron/runs/</InlineCode> 的 JSONL 日志文件解析。JSONL 文件中的每一行代表一次运行。
      </Paragraph>
      <Table
        headers={["字段", "类型", "描述"]}
        rows={[
          [
            <InlineCode key="ts">ts</InlineCode>,
            "number",
            "运行的 Unix 时间戳（毫秒）",
          ],
          [
            <InlineCode key="j">jobId</InlineCode>,
            "string",
            "任务标识符",
          ],
          [
            <InlineCode key="s">status</InlineCode>,
            '"ok" | "error"',
            "运行结果",
          ],
          [
            <InlineCode key="su">summary</InlineCode>,
            "string | null",
            "运行产出的摘要",
          ],
          [
            <InlineCode key="e">error</InlineCode>,
            "string | null",
            "运行失败时的错误消息",
          ],
          [
            <InlineCode key="d">durationMs</InlineCode>,
            "number",
            "持续时间（毫秒）",
          ],
          [
            <InlineCode key="ds">deliveryStatus</InlineCode>,
            "string | null",
            "投递结果",
          ],
        ]}
      />

      <SubHeading>代理所属</SubHeading>
      <Paragraph>
        定时任务通过任务名称前缀匹配到代理。当 API 通过 <InlineCode>openclaw cron list --json</InlineCode> 获取 cron 时，它通过检查任务名称是否以代理 ID 开头来为每个任务丰富 <InlineCode>agentId</InlineCode> 字段。这使得 UI 可以在 cron 条目旁边显示代理头像，并按代理筛选 cron。
      </Paragraph>

      <SubHeading>投递配置</SubHeading>
      <Table
        headers={["字段", "类型", "描述"]}
        rows={[
          [
            <InlineCode key="m">mode</InlineCode>,
            "string",
            "投递模式",
          ],
          [
            <InlineCode key="c">channel</InlineCode>,
            "string",
            "投递渠道",
          ],
          [
            <InlineCode key="t">to</InlineCode>,
            "string | null",
            "投递接收人",
          ],
        ]}
      />

      <SubHeading>状态类型</SubHeading>
      <BulletList
        items={[
          <>
            <strong style={{ color: "var(--system-green)" }}>ok</strong> —— 上次运行成功完成
          </>,
          <>
            <strong style={{ color: "var(--system-red)" }}>error</strong> —— 上次运行失败（错误详情见 lastError）
          </>,
          <>
            <strong style={{ color: "var(--text-tertiary)" }}>idle</strong> —— 任务从未运行或没有最近活动
          </>,
        ]}
      />

      <SubHeading>监控视图</SubHeading>
      <BulletList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>概览</strong> —— 健康甜甜圈图表（SVG）、需要关注的错误 cron 卡片、投递统计、带可展开详情的错误横幅、最近运行列表
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>计划</strong> —— 7 天日历网格，显示 cron 任务计划运行的时间。当前时间指示为红色水平线。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>流程</strong> —— React Flow 可视化 cron 任务流程，显示各阶段之间的依赖关系
          </>,
        ]}
      />

      <Callout type="note">
        cron 页面每 60 秒自动刷新。侧边栏也在挂载时获取 cron 错误计数，并在存在错误时显示红色脉冲点徽章。
      </Callout>

      <SubHeading>API 端点</SubHeading>
      <CodeBlock title="terminal">
        {`# 获取所有 cron
curl http://localhost:3000/api/crons

# 获取特定任务的运行历史
curl "http://localhost:3000/api/cron-runs?jobId=pulse-daily-digest"

# 获取所有运行历史
curl http://localhost:3000/api/cron-runs`}
      </CodeBlock>
    </>
  );
}
