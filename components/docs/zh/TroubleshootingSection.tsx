import {
  Heading,
  SubHeading,
  Paragraph,
  CodeBlock,
  InlineCode,
  BulletList,
  NumberedList,
  Callout,
} from "../DocSection";

export function TroubleshootingSection() {
  return (
    <>
      <Heading>故障排除</Heading>
      <Paragraph>
        运行 ClawPort 时的常见问题及其解决方案。
      </Paragraph>

      {/* ── npm install permission errors ──────────────────────── */}
      <SubHeading>
        npm install -g 期间的 EACCES / EEXIST / permission denied
      </SubHeading>
      <Paragraph>
        如果看到 <InlineCode>EACCES: permission denied</InlineCode>、<InlineCode>EEXIST</InlineCode>、<InlineCode>Invalid response body while trying to fetch</InlineCode> 或在运行 <InlineCode>npm install -g clawport-ui</InlineCode> 时 <InlineCode>~/.npm/_cacache</InlineCode> 中重命名失败，你的 npm 缓存已损坏或有权限问题。这通常发生在之前使用 <InlineCode>sudo npm install -g</InlineCode> 运行时。
      </Paragraph>
      <Paragraph>
        <strong style={{ color: "var(--text-primary)" }}>快速修复</strong> —— 清除缓存并重试：
      </Paragraph>
      <CodeBlock title="terminal">
        {`sudo npm cache clean --force
npm install -g clawport-ui`}
      </CodeBlock>
      <Paragraph>
        如果仍然失败，修复底层权限：
      </Paragraph>
      <CodeBlock title="terminal">
        {`# 修复 npm 缓存所有权
sudo chown -R $(whoami) ~/.npm

# 修复全局 node_modules 所有权（先找到你的前缀）
npm prefix -g
# 然后修复该路径上的权限，例如：
sudo chown -R $(whoami) /usr/local/lib/node_modules
sudo chown -R $(whoami) /usr/local/bin

# 不使用 sudo 重试
npm install -g clawport-ui`}
      </CodeBlock>
      <Paragraph>
        <strong style={{ color: "var(--text-primary)" }}>
          替代方案：完全避免使用 sudo
        </strong>{" "}
        —— 配置 npm 将全局包安装到你的主目录：
      </Paragraph>
      <CodeBlock title="terminal">
        {`mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g clawport-ui`}
      </CodeBlock>
      <Callout type="warning">
        永远不要使用 <InlineCode>sudo npm install -g</InlineCode> —— 它会在你的用户 npm 缓存和全局目录中创建 root 拥有的文件，导致以后每次安装都出现权限错误。如果你的设置需要 sudo 进行全局安装，考虑使用 <InlineCode>nvm</InlineCode>（Node 版本管理器）或上述 <InlineCode>~/.npm-global</InlineCode> 前缀方法，这些会将 Node 和全局包安装到你的主目录，没有权限问题。
      </Callout>

      {/* ── Issue 1 ────────────────────────────────────────────── */}
      <SubHeading>
        "Missing required environment variable: WORKSPACE_PATH"
      </SubHeading>
      <Paragraph>
        你的 <InlineCode>.env.local</InlineCode> 缺失或变量未设置。确保你已复制 <InlineCode>.env.example</InlineCode>：
      </Paragraph>
      <CodeBlock>{`cp .env.example .env.local`}</CodeBlock>
      <Paragraph>
        然后填写值。更改 <InlineCode>.env.local</InlineCode> 后重启开发服务器。
      </Paragraph>

      {/* ── 405 Method Not Allowed ─────────────────────────────── */}
      <SubHeading>聊天时出现 405 Method Not Allowed</SubHeading>
      <Paragraph>
        网关的 HTTP 聊天完成端点默认是禁用的。在 <InlineCode>~/.openclaw/openclaw.json</InlineCode> 中启用它：
      </Paragraph>
      <CodeBlock title="~/.openclaw/openclaw.json（合并到现有配置）">
        {`"gateway": {
  "http": {
    "endpoints": {
      "chatCompletions": { "enabled": true }
    }
  }
}`}
      </CodeBlock>
      <Paragraph>
        更改配置后重启网关。你也可以重新运行 <InlineCode>clawport setup</InlineCode>，它会自动检测并修复此问题。
      </Paragraph>

      {/* ── Issue 2 ────────────────────────────────────────────── */}
      <SubHeading>Gateway connection refused / 聊天不工作</SubHeading>
      <Paragraph>
        OpenClaw 网关未运行。启动它：
      </Paragraph>
      <CodeBlock>{`openclaw gateway run`}</CodeBlock>
      <Paragraph>验证它可访问：</Paragraph>
      <CodeBlock>{`curl http://localhost:18789/v1/models`}</CodeBlock>
      <Paragraph>
        你应该收到 JSON 响应。如果你更改了网关端口，用你的自定义端口替换 <InlineCode>18789</InlineCode>。在你的 <InlineCode>.env.local</InlineCode> 中设置 <InlineCode>OPENCLAW_GATEWAY_PORT</InlineCode>，以便 ClawPort 连接到正确的端口。
      </Paragraph>

      {/* ── Issue 3 ────────────────────────────────────────────── */}
      <SubHeading>没有代理显示</SubHeading>
      <NumberedList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              检查 WORKSPACE_PATH
            </strong>{" "}
            —— 确保它指向有效的 OpenClaw 工作区目录。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              检查你的 agents.json
            </strong>{" "}
            —— 如果你在 <InlineCode>$WORKSPACE_PATH/clawport/agents.json</InlineCode> 放置了自定义 <InlineCode>agents.json</InlineCode>，确保它是有效的 JSON。语法错误会导致静默回退到内置注册表。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              检查服务器控制台
            </strong>{" "}
            —— ClawPort 会将错误记录到运行 <InlineCode>npm run dev</InlineCode> 的终端。
          </>,
        ]}
      />
      <Callout type="tip">
        用以下命令测试你的 agents.json：{" "}
        <InlineCode>
          cat $WORKSPACE_PATH/clawport/agents.json | python3 -m json.tool
        </InlineCode>
      </Callout>

      {/* ── Issue 4 ────────────────────────────────────────────── */}
      <SubHeading>代理 SOUL.md 未加载</SubHeading>
      <Paragraph>
        agents.json 中的 <InlineCode>soulPath</InlineCode> 相对于 <InlineCode>WORKSPACE_PATH</InlineCode>。如果你的工作区在{" "}
        <InlineCode>/Users/you/.openclaw/workspace</InlineCode> 且 soulPath 是{" "}
        <InlineCode>"agents/vera/SOUL.md"</InlineCode>，ClawPort 将查找{" "}
        <InlineCode>/Users/you/.openclaw/workspace/agents/vera/SOUL.md</InlineCode>。
      </Paragraph>
      <Paragraph>确保文件在该路径存在。</Paragraph>

      {/* ── Issue 5 ────────────────────────────────────────────── */}
      <SubHeading>聊天中的图片不工作</SubHeading>
      <Paragraph>
        图片消息使用 CLI 流程。常见问题：
      </Paragraph>
      <NumberedList
        items={[
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              OPENCLAW_BIN 路径错误
            </strong>{" "}
            —— 运行 <InlineCode>which openclaw</InlineCode> 并更新 <InlineCode>.env.local</InlineCode>。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              网关令牌错误
            </strong>{" "}
            —— 用 <InlineCode>openclaw gateway status</InlineCode> 验证。
          </>,
          <>
            <strong style={{ color: "var(--text-primary)" }}>
              图片太大
            </strong>{" "}
            —— ClawPort 会调整到最大 1200px，但非常大的图片可能仍会达到限制。尝试更小的图片。
          </>,
        ]}
      />
      <Paragraph>
        检查服务器控制台是否有 <InlineCode>sendViaOpenClaw execFile error:</InlineCode> 或 <InlineCode>E2BIG</InlineCode> 等错误。
      </Paragraph>

      {/* ── Issue 6 ────────────────────────────────────────────── */}
      <SubHeading>语音/TTS 功能不工作</SubHeading>
      <Paragraph>
        语音功能需要你的 <InlineCode>.env.local</InlineCode> 中的 <InlineCode>ELEVENLABS_API_KEY</InlineCode>。没有它，代理资料上不会出现语音指示器。
      </Paragraph>
      <Paragraph>
        音频转录（语音转文本）通过 OpenClaw 网关使用 Whisper，不需要单独的密钥。
      </Paragraph>

      {/* ── Issue 7 ────────────────────────────────────────────── */}
      <SubHeading>端口 3000 已被占用</SubHeading>
      <Paragraph>
        另一个进程正在使用端口 3000。要么停止它，要么在不同端口运行：
      </Paragraph>
      <CodeBlock>{`npm run dev -- -p 3001`}</CodeBlock>

      {/* ── Debug Image Pipeline ──────────────────────────────── */}
      <SubHeading>调试图片流程</SubHeading>
      <Paragraph>
        视觉（图片）聊天流程的分步调试：
      </Paragraph>
      <NumberedList
        items={[
          <>
            检查服务器控制台是否有 <InlineCode>sendViaOpenClaw execFile error:</InlineCode> 或 <InlineCode>sendViaOpenClaw: timed out</InlineCode>
          </>,
          <>
            直接测试 CLI：
          </>,
        ]}
      />
      <CodeBlock title="terminal">
        {`# 测试 chat.send
openclaw gateway call chat.send \\
  --params '{"sessionKey":"agent:main:clawport","idempotencyKey":"test","message":"describe","attachments":[]}' \\
  --token <token> --json

# 检查历史
openclaw gateway call chat.history \\
  --params '{"sessionKey":"agent:main:clawport"}' \\
  --token <token> --json

# 验证网关健康
openclaw gateway call health --token <token>`}
      </CodeBlock>

      <SubHeading>运行测试</SubHeading>
      <CodeBlock title="terminal">
        {`npm test             # 通过 Vitest 运行所有测试
npx tsc --noEmit     # 类型检查（期望 0 错误）`}
      </CodeBlock>

      <Callout type="note">
        所有测试都在 <InlineCode>lib/</InlineCode> 目录中，与源文件共存。关键测试模式包括用于 CLI 测试的 <InlineCode>vi.mock('child_process')</InlineCode>、用于轮询测试的 <InlineCode>vi.useFakeTimers</InlineCode> 和用于环境变量测试的 <InlineCode>vi.stubEnv()</InlineCode>。
      </Callout>
    </>
  );
}
