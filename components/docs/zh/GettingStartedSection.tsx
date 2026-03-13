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

export function GettingStartedSection() {
  return (
    <>
      <Heading>快速开始</Heading>
      <Paragraph>
        本指南将帮助你让 ClawPort 在你自己的 OpenClaw 实例上运行。ClawPort 是一个用于管理、监控和直接与你的 OpenClaw AI 代理聊天的 Next.js 16 仪表板。
      </Paragraph>

      <SubHeading>前置要求</SubHeading>
      <BulletList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>Node.js 22+</strong> —— 使用 <InlineCode>node -v</InlineCode> 验证
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>OpenClaw</strong> —— 已安装并正常工作：<InlineCode>openclaw --version</InlineCode>
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              OpenClaw 网关运行中
            </strong> —— ClawPort 默认通过{" "}
            <InlineCode>localhost:18789</InlineCode> 与网关通信（可通过{" "}
            <InlineCode>OPENCLAW_GATEWAY_PORT</InlineCode> 配置）
          </>,
        ]}
      />

      <SubHeading>快速开始（npm）</SubHeading>
      <Callout type="note">
        npm 包名为 <InlineCode>clawport-ui</InlineCode>。CLI 命令为 <InlineCode>clawport</InlineCode>。不要安装无关的{" "}
        <InlineCode>clawport</InlineCode> 包。
      </Callout>
      <CodeBlock title="terminal">
        {`# 全局安装（包：clawport-ui，命令：clawport）
npm install -g clawport-ui

# 运行设置向导（自动检测你的 OpenClaw 配置）
clawport setup

# 启动开发服务器
clawport dev`}
      </CodeBlock>
      <Callout type="warning">
        如果在安装过程中遇到 <InlineCode>EACCES: permission denied</InlineCode> 或{" "}
        <InlineCode>EEXIST</InlineCode> 错误，说明你的 npm 缓存有权限问题（通常来自之前的{" "}
        <InlineCode>sudo npm install</InlineCode>）。修复方法：{" "}
        <InlineCode>sudo chown -R $(whoami) ~/.npm</InlineCode> 然后重试。详见故障排除部分。
      </Callout>

      <SubHeading>快速开始（源码）</SubHeading>
      <CodeBlock title="terminal">
        {`# 克隆仓库
git clone https://github.com/JohnRiceML/clawport-ui.git
cd clawport-ui

# 安装依赖
npm install

# 自动检测你的 OpenClaw 配置并写入 .env.local
npm run setup

# 启动开发服务器
npm run dev`}
      </CodeBlock>
      <Paragraph>
        打开 <InlineCode>http://localhost:3000</InlineCode>。首次启动时，你会看到设置向导，引导你命名门户、选择主题并个性化代理头像。
      </Paragraph>

      <SubHeading>环境变量</SubHeading>
      <Paragraph>
        最快的配置方式是自动设置脚本：<InlineCode>npm run setup</InlineCode>。它自动检测你的{" "}
        <InlineCode>WORKSPACE_PATH</InlineCode>、<InlineCode>OPENCLAW_BIN</InlineCode> 和网关令牌。
      </Paragraph>
      <Paragraph>
        要手动配置，请复制模板并编辑：
      </Paragraph>
      <CodeBlock>{`cp .env.example .env.local`}</CodeBlock>

      <Table
        headers={["变量", "必需", "描述"]}
        rows={[
          [
            <InlineCode key="ws">WORKSPACE_PATH</InlineCode>,
            "是",
            "OpenClaw 工作区目录路径（默认：~/.openclaw/workspace）",
          ],
          [
            <InlineCode key="bin">OPENCLAW_BIN</InlineCode>,
            "是",
            "openclaw CLI 二进制文件的绝对路径",
          ],
          [
            <InlineCode key="tok">OPENCLAW_GATEWAY_TOKEN</InlineCode>,
            "是",
            "验证所有 API 调用到网关的令牌",
          ],
          [
            <InlineCode key="el">ELEVENLABS_API_KEY</InlineCode>,
            "否",
            "用于代理资料上语音/TTS 指示器的 ElevenLabs API 密钥",
          ],
        ]}
      />

      <Callout type="tip">
        无需单独的 AI API 密钥。所有 AI 调用（聊天、视觉、TTS、转录）都通过 OpenClaw 网关。一个订阅，一个令牌。
      </Callout>

      <SubHeading>查找你的值</SubHeading>
      <NumberedList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>WORKSPACE_PATH</strong>：{" "}
            运行 <InlineCode>ls ~/.openclaw/workspace</InlineCode> 验证。你应该看到{" "}
            <InlineCode>SOUL.md</InlineCode> 文件、一个{" "}
            <InlineCode>agents/</InlineCode> 目录和一个{" "}
            <InlineCode>memory/</InlineCode> 目录。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>OPENCLAW_BIN</strong>：{" "}
            运行 <InlineCode>which openclaw</InlineCode> 并使用完整路径。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              OPENCLAW_GATEWAY_TOKEN
            </strong>
            ：运行 <InlineCode>openclaw gateway status</InlineCode> 查看你的网关配置，包括令牌。
          </>,
        ]}
      />

      <SubHeading>启动网关</SubHeading>
      <Paragraph>
        ClawPort 期望 OpenClaw 网关在 <InlineCode>localhost:18789</InlineCode>（或你的自定义端口）运行。在单独的终端中启动它：
      </Paragraph>
      <CodeBlock>{`openclaw gateway run`}</CodeBlock>
      <Callout type="warning">
        网关的 HTTP 聊天完成端点默认是禁用的。运行 <InlineCode>clawport setup</InlineCode> 会检测到这一点并提供自动启用。如果聊天返回 405 错误，请参阅故障排除部分。
      </Callout>

      <SubHeading>首次运行设置</SubHeading>
      <Paragraph>
        首次访问时，ClawPort 会启动设置向导（5 步）：
      </Paragraph>
      <NumberedList
        items={[
          "命名你的门户 —— 为你的指挥中心起一个自定义名称和副标题",
          "选择主题 —— 从深色、毛玻璃、彩色、浅色或系统主题中选择",
          "设置强调色 —— 个性化 UI 高亮颜色",
          "语音聊天 —— 可选的麦克风权限测试",
          "概览 —— 所有页面功能摘要",
        ]}
      />
      <Paragraph>
        所有这些都可以稍后在设置页面中更改。
      </Paragraph>

      <SubHeading>生产构建</SubHeading>
      <CodeBlock title="terminal">
        {`npx next build
npm start`}
      </CodeBlock>
      <Paragraph>
        生产服务器默认在端口 3000 运行。网关仍需要保持运行。
      </Paragraph>
    </>
  );
}
