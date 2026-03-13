# ClawPort — 主题、设置与自定义指南

本文档介绍 ClawPort 的视觉主题系统、设置架构和扩展两者的分步说明。一切都由 CSS 自定义属性和两个 React 上下文提供商驱动：`ThemeProvider` 和 `SettingsProvider`。

---

## 目录

1. [主题](#主题)
   - [可用主题](#可用主题)
   - [主题如何工作](#主题如何工作)
   - [CSS 自定义属性令牌](#css-自定义属性令牌)
   - [系统主题检测](#系统主题检测)
   - [主题特定覆盖](#主题特定覆盖)
   - [如何添加新主题](#如何添加新主题)
2. [设置](#设置)
   - [ClawPortSettings 接口](#clawportsettings-接口)
   - [localStorage 持久化](#localstorage-持久化)
   - [SettingsProvider API](#settingsprovider-api)
   - [强调色 CSS 变量](#强调色-css-变量)
   - [代理覆盖系统](#代理覆盖系统)
   - [operatorName 流程](#operatorname-流程)
3. [自定义指南](#自定义指南)
   - [更改默认强调色](#更改默认强调色)
   - [添加新设置字段](#添加新设置字段)
   - [添加新主题（分步）](#添加新主题分步)
   - [CSS 自定义属性命名约定](#css-自定义属性命名约定)

---

## 主题

### 可用主题

ClawPort 附带五个主题。每个都有一个 ID、人类可读的标签和在入门向导和主题选择器中使用的 emoji。

| ID | 标签 | Emoji | 描述 |
|----------|----------|-------|--------------------------------------------|
| `dark` | 深色 | 🌑 | Apple 深色模式。默认主题。 |
| `glass` | 毛玻璃 | 🪟 | 毛玻璃深色变体，带半透明表面。 |
| `color` | 彩色 | 🎨 | 充满活力的紫蓝色变体。 |
| `light` | 浅色 | ☀️ | Apple 浅色模式。 |
| `system` | 跟随系统 | ⚙️ | 跟随操作系统 `prefers-color-scheme` 设置。 |

这些在 `lib/themes.ts` 中定义：

```ts
export type ThemeId = 'dark' | 'glass' | 'color' | 'light' | 'system';

export const THEMES: { id: ThemeId; label: string; emoji: string }[] = [
  { id: 'dark',   label: '深色',   emoji: '🌑' },
  { id: 'glass',  label: '毛玻璃', emoji: '🪟' },
  { id: 'color',  label: '彩色',   emoji: '🎨' },
  { id: 'light',  label: '浅色',   emoji: '☀️' },
  { id: 'system', label: '跟随系统', emoji: '⚙️' },
];
```

### 主题如何工作

主题系统使用三层：

1. **`<html>` 上的 `data-theme` 属性** — 每个主题定义一个作用域为 `[data-theme="<id>"]` 的 CSS 规则块。`dark` 主题也匹配 `:root`，因此无需设置任何属性即可工作。

2. **CSS 自定义属性** — 每个颜色、阴影、圆角和材质都表示为 CSS 变量。组件通过内联样式（例如 `style={{ color: 'var(--text-primary)' }}`）或工具类使用这些。不直接使用 Tailwind 颜色类。

3. **ThemeProvider**（`app/providers.tsx`）— 管理主题状态的 React 上下文。挂载时从 localStorage 键 `clawport-theme` 读取。当用户选择主题时，它：
   - 更新 React 状态
   - 写入 localStorage
   - 移除现有的 `data-theme` 属性
   - 在 `<html>` 上设置新的 `data-theme` 属性
   - 对于 `system` 主题，计算 `window.matchMedia('(prefers-color-scheme: dark)')` 并解析为 `dark` 或 `light`

```ts
// app/providers.tsx（简化版）
function apply(t: ThemeId) {
  setThemeState(t);
  localStorage.setItem('clawport-theme', t);
  const html = document.documentElement;
  html.removeAttribute('data-theme');
  if (t === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', t);
  }
}
```

消费者钩子：

```ts
import { useTheme } from '@/app/providers';

const { theme, setTheme } = useTheme();
// theme 是 ThemeId（'dark'、'glass' 等）
// setTheme('light') 立即应用
```

### CSS 自定义属性令牌

所有令牌在 `app/globals.css` 中定义。每个主题块定义相同的完整变量集，因此组件可以始终依赖它们的存在。

#### 背景

| 令牌 | 用途 | 深色示例 |
|------------------------|--------------------------------------------|---------------------------|
| `--bg` | 主页面背景 | `#000000` |
| `--bg-secondary` | 卡片/表面背景 | `rgba(28,28,30,1)` |
| `--bg-tertiary` | 嵌套表面/分组背景 | `rgba(44,44,46,1)` |

#### 材质（Apple 半透明表面）

| 令牌 | 用途 | 深色示例 |
|-------------------------|-------------------------------------------|---------------------------|
| `--material-regular` | 标准材质（侧边栏、覆盖层） | `rgba(28,28,30,0.92)` |
| `--material-thick` | 浓密材质 | `rgba(22,22,24,0.96)` |
| `--material-thin` | 浅色 tint 材质 | `rgba(255,255,255,0.06)` |
| `--material-ultra-thin` | 非常微妙的 tint | `rgba(255,255,255,0.04)` |

#### 填充

| 令牌 | 用途 | 深色示例 |
|----------------------|-----------------------------------------------|---------------------------|
| `--fill-primary` | 主要交互填充（按钮、控件） | `rgba(120,120,128,0.36)` |
| `--fill-secondary` | 悬停填充 | `rgba(120,120,128,0.32)` |
| `--fill-tertiary` | 微妙的填充（输入背景） | `rgba(118,118,128,0.24)` |
| `--fill-quaternary` | 最微妙的填充 | `rgba(118,118,128,0.18)` |

#### 分隔符和边框

| 令牌 | 用途 | 深色示例 |
|----------------------|-----------------------------------|---------------------------|
| `--separator` | 半透明分割线 | `rgba(84,84,88,0.60)` |
| `--separator-opaque` | 不透明分割线（非模糊上下文）| `#38383A` |

#### 文本

| 令牌 | 用途 | 深色示例 |
|----------------------|--------------------------------------|----------------------------|
| `--text-primary` | 标题、正文文本 | `#FFFFFF` |
| `--text-secondary` | 标签、支持文本 | `rgba(235,235,245,0.60)` |
| `--text-tertiary` | 占位符、说明文字 | `rgba(235,235,245,0.30)` |
| `--text-quaternary` | 禁用/最低优先级文本 | `rgba(235,235,245,0.18)` |

#### 强调色和系统颜色

| 令牌 | 用途 | 深色示例 |
|--------------------|----------------------------------------|---------------|
| `--accent` | 主要品牌强调色（按钮、激活） | `#F5C518` |
| `--accent-fill` | 15% 不透明度的强调色（背景） | `rgba(245,197,24,0.15)` |
| `--system-blue` | 链接、焦点环 | `#0A84FF` |
| `--system-green` | 成功、激活切换 | `#30D158` |
| `--system-red` | 错误、破坏性操作 | `#FF453A` |
| `--system-orange` | 警告 | `#FF9F0A` |
| `--system-purple` | 标签、高亮 | `#BF5AF2` |

注意：`--accent` 和 `--accent-fill` 可以在运行时被 SettingsProvider 覆盖，当用户选择自定义强调色时。请参阅[强调色 CSS 变量](#强调色-css-变量)。

#### 阴影和效果

| 令牌 | 用途 | 深色示例（缩写） |
|--------------------|-----------------------------------------|--------------------------------------|
| `--inset-shine` | 卡片顶部内部高光 | `inset 0 1px 0 rgba(255,255,255,0.08)` |
| `--shadow-subtle` | 最小高度 | `0 1px 2px rgba(0,0,0,0.20)` |
| `--shadow-ambient` | 细线边框阴影 | `0 0 0 0.5px rgba(0,0,0,0.20)` |
| `--shadow-key` | 主要方向阴影 | `0 4px 16px rgba(0,0,0,0.40)` |
| `--shadow-card` | 完整卡片高度（环境 + 关键 + 高光） | （复合） |
| `--shadow-overlay` | 模态框/覆盖层高度 | （复合） |

#### 代码块

| 令牌 | 用途 | 深色示例 |
|-----------------|--------------------------|---------------------------|
| `--code-bg` | 代码块背景 | `rgba(255,255,255,0.06)` |
| `--code-border` | 代码块边框 | `rgba(255,255,255,0.10)` |
| `--code-text` | 代码文本颜色 | `#e5e5ea` |

#### 侧边栏

| 令牌 | 用途 | 深色示例 |
|----------------------|----------------------------------|------------------------------------|
| `--sidebar-bg` | 侧边栏背景色 | `rgba(28,28,30,0.92)` |
| `--sidebar-backdrop` | 侧边栏背景模糊 | `blur(40px) saturate(180%)` |

#### 圆角

| 令牌 | 值 |
|----------------|---------|

---

## 设置

### ClawPortSettings 接口

完整的设置接口定义了什么被持久化：

```ts
interface ClawPortSettings {
  portalName: string | null
  portalSubtitle: string | null
  portalEmoji: string | null
  portalIcon: string | null  // base64 data URL
  iconBgHidden: boolean
  emojiOnly: boolean
  operatorName: string | null
  accentColor: string | null  // hex color like '#FF0000'
  agentOverrides: Record<string, AgentDisplayOverride>
}
```

### localStorage 持久化

设置通过 `saveSettings()` 函数保存到 localStorage。该函数：

1. 获取当前设置对象
2. 过滤掉默认值（仅保存用户更改的内容）
3. `JSON.stringify` 并写入 `localStorage.setItem('clawport-settings', ...)`

读取在挂载时进行，反向操作。

### SettingsProvider API

```ts
const {
  settings,
  setAccentColor,
  setPortalName,
  setPortalSubtitle,
  setPortalEmoji,
  setPortalIcon,
  setIconBgHidden,
  setEmojiOnly,
  setOperatorName,
  setAgentOverride,
  getAgentDisplay,
  resetAll,
} = useSettings()
```

### 强调色 CSS 变量

当用户选择强调色时，SettingsProvider 直接在 `document.documentElement.style` 上设置这些变量：

```ts
// 实际实现（来自 app/settings-provider.tsx）
document.documentElement.style.setProperty('--accent', newAccent)
document.documentElement.style.setProperty('--accent-hover', hoverColor)
document.documentElement.style.setProperty('--accent-glow', glowColor)
```

这允许即时主题化，而无需重新加载页面。

### 代理覆盖系统

`agentOverrides` 字段允许每个代理的自定义显示：

```ts
interface AgentDisplayOverride {
  emoji?: string
  profileImage?: string  // base64 data URL
  background?: string    // hex color
}
```

`getAgentDisplay(agent)` 合并代理默认值和覆盖：

```ts
function getAgentDisplay(agent: Agent): AgentDisplay {
  const override = settings.agentOverrides[agent.id]
  return {
    name: agent.name,
    emoji: override?.emoji ?? agent.emoji,
    profileImage: override?.profileImage ?? agent.profileImage,
    background: override?.background ?? agent.color,
  }
}
```

### operatorName 流程

1. 用户在设置页面或入门向导中设置 `operatorName`
2. 设置持久化到 localStorage
3. 聊天时，`operatorName` 被注入到系统提示中：

```ts
// 来自组件/chat/ConversationView.tsx
await fetch('/api/chat/jarvis', {
  method: 'POST',
  body: JSON.stringify({
    operatorName: settings.operatorName ?? 'Operator',
    messages: [...],
  }),
})
```

代理在其系统提示中看到 `"You are working with Operator: {name}"`。

---

## 自定义指南

### 更改默认强调色

1. 打开 `app/settings-provider.tsx`
2. 找到 `DEFAULT_SETTINGS` 常量
3. 更改 `accentColor` 值：

```ts
const DEFAULT_SETTINGS: ClawPortSettings = {
  accentColor: '#3B82F6',  // 改为蓝色
  // ...其他默认值
}
```

### 添加新设置字段

1. 在 `ClawPortSettings` 接口中添加字段
2. 在 `DEFAULT_SETTINGS` 中添加默认值
3. 创建 setter 函数：

```ts
setNewField: (value: string) => {
  setSettings(prev => ({ ...prev, newField: value }))
  saveSettings()
}
```

4. 在 UI 中使用：

```ts
const { settings, setNewField } = useSettings()
// <input onChange={e => setNewField(e.target.value)} />
```

### 添加新主题（分步）

1. 在 `lib/themes.ts` 中添加新主题：

```ts
export type ThemeId = 'dark' | 'glass' | 'color' | 'light' | 'system' | 'ocean';

export const THEMES = [
  // ...现有主题
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
];
```

2. 在 `app/globals.css` 中添加主题块：

```css
[data-theme="ocean"] {
  --bg: #0a1628;
  --bg-secondary: #112240;
  --text-primary: #e6f1ff;
  --accent: #64ffda;
  /* ...所有其他变量 */
}
```

3. 在主题选择器 UI 中自动显示（如果使用 `THEMES` 数组）

### CSS 自定义属性命名约定

- **颜色**：`--{位置}-{类型}`，如 `--bg`、`--text-primary`、`--fill-secondary`
- **材质**：`--material-{密度}`，如 `--material-regular`、`--material-thick`
- **系统**：`--system-{颜色}`，如 `--system-blue`、`--system-red`
- **强调色**：`--accent`、`--accent-fill`、`--accent-hover`、`--accent-glow`
- **阴影**：`--shadow-{类型}`，如 `--shadow-subtle`、`--shadow-key`
- **圆角**：`--radius-{大小}`，如 `--radius-sm`、`--radius-lg`

---

## 扩展阅读

- 查看 `app/globals.css` 查看所有 CSS 变量的完整定义
- 查看 `lib/themes.ts` 查看主题配置
- 查看 `app/settings-provider.tsx` 查看设置管理实现
- 查看 `components/ThemeToggle.tsx` 查看主题选择器 UI 示例
