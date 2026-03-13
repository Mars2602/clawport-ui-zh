import type {
  MemoryFileInfo,
  MemoryConfig,
  MemoryStatus,
  MemoryStats,
  MemoryHealthSummary,
  MemoryHealthCheck,
  StaleDailyLogInfo,
} from '@/lib/types'

// ── Full system prompt ──────────────────────────────────────

export function buildMemoryHealthPrompt(
  files: MemoryFileInfo[],
  config: MemoryConfig,
  status: MemoryStatus,
  stats: MemoryStats,
  health: MemoryHealthSummary,
  locale: string = 'en',
): string {
  const isZh = locale === 'zh'
  const memoryMd = files.find(f => f.relativePath === 'MEMORY.md')
  const memoryMdLines = memoryMd ? memoryMd.content.split('\n').length : 0

  const fileList = files.map(f =>
    isZh
      ? `  ${f.relativePath} (${formatBytes(f.sizeBytes)}, ${translateCategory(f.category, isZh)}, 修改于 ${f.lastModified})`
      : `  ${f.relativePath} (${formatBytes(f.sizeBytes)}, ${f.category}, modified ${f.lastModified})`
  ).join('\n')

  const checksSection = health.checks.length > 0
    ? health.checks.map(c =>
        isZh
          ? `  [${translateSeverity(c.severity, isZh)}] ${translateCheckTitle(c.id, c.title, isZh)}: ${translateCheckDescription(c.id, c.description, isZh)}${c.affectedFiles ? ` (文件: ${c.affectedFiles.join(', ')})` : ''}`
          : `  [${c.severity.toUpperCase()}] ${c.title}: ${c.description}${c.affectedFiles ? ` (files: ${c.affectedFiles.join(', ')})` : ''}`
      ).join('\n')
    : isZh ? '  未检测到问题' : '  No issues detected'

  const staleLogs = health.staleDailyLogs.length > 0
    ? health.staleDailyLogs.map(l =>
        isZh
          ? `  ${l.relativePath} -- ${l.date}, ${l.ageDays} 天前, ${formatBytes(l.sizeBytes)}`
          : `  ${l.relativePath} -- ${l.date}, ${l.ageDays} days old, ${formatBytes(l.sizeBytes)}`
      ).join('\n')
    : isZh ? '  无' : '  None'

  const configSection = isZh
    ? [
        `  向量搜索: ${config.memorySearch.enabled ? '已启用' : '已禁用'}`,
        `  时间衰减: ${config.memorySearch.hybrid.temporalDecay.enabled ? `已启用 (半衰期: ${config.memorySearch.hybrid.temporalDecay.halfLifeDays}天)` : '已禁用'}`,
        `  缓存: ${config.memorySearch.cache.enabled ? `已启用 (${config.memorySearch.cache.maxEntries} 条目)` : '已禁用'}`,
        `  配置文件: ${config.configFound ? '已找到' : '未找到 (使用默认值)'}`,
      ].join('\n')
    : [
        `  Vector search: ${config.memorySearch.enabled ? 'enabled' : 'disabled'}`,
        `  Temporal decay: ${config.memorySearch.hybrid.temporalDecay.enabled ? `enabled (half-life: ${config.memorySearch.hybrid.temporalDecay.halfLifeDays}d)` : 'disabled'}`,
        `  Cache: ${config.memorySearch.cache.enabled ? `enabled (${config.memorySearch.cache.maxEntries} entries)` : 'disabled'}`,
        `  Config file found: ${config.configFound ? 'yes' : 'no (using defaults)'}`,
      ].join('\n')

  const indexSection = isZh
    ? [
        `  已索引: ${status.indexed ? '是' : '否'}`,
        `  最后索引: ${status.lastIndexed || '从未'}`,
        `  总条目: ${status.totalEntries ?? '未知'}`,
      ].join('\n')
    : [
        `  Indexed: ${status.indexed ? 'yes' : 'no'}`,
        `  Last indexed: ${status.lastIndexed || 'never'}`,
        `  Total entries: ${status.totalEntries ?? 'unknown'}`,
      ].join('\n')

  if (isZh) {
    return `你是 OpenClaw AI 代理的记忆系统顾问。你帮助操作员优化代理记忆，以实现快速、相关的检索和干净的上下文注入。

## 最佳实践

- MEMORY.md 始终加载到代理上下文中。200行之后的内容会被截断。保持简洁，并链接到主题文件。
- 单个文件应保持在 50KB 以下，以实现最佳分块检索。超过 100KB 会降低搜索质量。
- 应审查超过 30 天的每日日志：将有用的模式提升到常绿文件，然后删除日志。
- 时间衰减（启用时）会在搜索结果中降低旧每日日志的排名，优先显示最近的上下文。
- 编辑记忆文件后，重新索引以便代理在语义搜索中看到最新内容。
- 组织良好的记忆包含一些集中的常绿文件和最近每日日志的滚动窗口。

## 当前状态

- 文件总数: ${stats.totalFiles}
- 总大小: ${formatBytes(stats.totalSizeBytes)}
- 常绿文件: ${stats.evergreenCount} 个
- 每日日志: ${stats.dailyLogCount} 个${stats.oldestDaily ? ` (${stats.oldestDaily} 至 ${stats.newestDaily})` : ''}
- 健康评分: ${health.score}/100
- MEMORY.md: ${memoryMdLines} 行${memoryMdLines > 200 ? ' (已截断 -- 超过 200 行限制)' : ''}

## 文件

${fileList || '  无文件'}

## 活跃健康检查

${checksSection}

## 陈旧每日日志 (30+ 天)

${staleLogs}

## 配置

${configSection}

## 索引状态

${indexSection}

## 回复格式

请提供:
1. **状态摘要** -- 一句话总结整体记忆健康状况
2. **优先行动计划** -- 编号列表，按影响力排序
3. **文件特定指导** -- 对于每个问题文件，说明该做什么以及为什么

规则:
- 直接且具体。指明确切的文件和操作。
- 解释每项操作为什么重要（检索质量、上下文注入、搜索相关性）。
- 不要对健康区域建议操作。
- 保持在 400 字以内。`
  }

  return `You are a memory system advisor for OpenClaw AI agents. You help operators optimize their agent memory for fast, relevant retrieval and clean context injection.

## Best Practices

- MEMORY.md is always loaded into agent context. Lines after 200 are truncated. Keep it concise with links to topic files.
- Individual files should stay under 50KB for optimal chunk-based retrieval. Over 100KB degrades search quality.
- Daily logs older than 30 days should be reviewed: promote useful patterns to evergreen files, then delete the log.
- Temporal decay (when enabled) down-ranks old daily logs in search results, prioritizing recent context.
- After editing memory files, reindex so agents see the latest content in semantic search.
- A well-organized memory has a few focused evergreen files and a rolling window of recent daily logs.

## Current State

- Total files: ${stats.totalFiles}
- Total size: ${formatBytes(stats.totalSizeBytes)}
- Evergreen: ${stats.evergreenCount} files
- Daily logs: ${stats.dailyLogCount} files${stats.oldestDaily ? ` (${stats.oldestDaily} to ${stats.newestDaily})` : ''}
- Health score: ${health.score}/100
- MEMORY.md: ${memoryMdLines} lines${memoryMdLines > 200 ? ' (TRUNCATED -- over 200 line limit)' : ''}

## Files

${fileList || '  No files'}

## Active Health Checks

${checksSection}

## Stale Daily Logs (30+ days)

${staleLogs}

## Configuration

${configSection}

## Index Status

${indexSection}

## Response Format

Provide:
1. **Status summary** -- one sentence on overall memory health
2. **Priority action plan** -- numbered list, most impactful first
3. **File-specific guidance** -- for each problem file, what to do and why

Rules:
- Be direct and specific. Name exact files and actions.
- Explain *why* each action matters (retrieval quality, context injection, search relevance).
- Do not suggest actions for healthy areas.
- Keep under 400 words.`
}

// ── Per-check targeted prompt ───────────────────────────────

export function buildCheckFixPrompt(
  check: MemoryHealthCheck,
  files: MemoryFileInfo[],
  locale: string = 'en',
): string {
  const isZh = locale === 'zh'
  const baseContext = buildFileContext(check, files, isZh)

  switch (check.id) {
    case 'memory-md-lines': {
      const memoryMd = files.find(f => f.relativePath === 'MEMORY.md')
      const content = memoryMd?.content ?? ''
      const lineCount = content.split('\n').length
      if (isZh) {
        return `用户的 MEMORY.md 有 ${lineCount} 行。加载到代理上下文时，200行之后的内容会被截断，因此200行之后的内容对代理是不可见的。

以下是当前的 MEMORY.md 内容：

\`\`\`markdown
${content}
\`\`\`

${baseContext}

请：
1. 识别哪些部分可以提取到单独的主题文件中（例如，patterns.md, debugging.md, architecture.md）
2. 为每个提取的部分建议具体的文件名
3. 展示精简后的 MEMORY.md 应该是什么样子（带有指向新文件的链接）
4. 解释200行截断规则及其对代理行为的重要性`
      }
      return `The user's MEMORY.md has ${lineCount} lines. Lines after 200 are truncated when loaded into agent context, so content beyond line 200 is invisible to agents.

Here is the current MEMORY.md content:

\`\`\`markdown
${content}
\`\`\`

${baseContext}

Please:
1. Identify which sections can be extracted into separate topic files (e.g., patterns.md, debugging.md, architecture.md)
2. Suggest specific filenames for each extracted section
3. Show what the slimmed-down MEMORY.md should look like (with links to the new files)
4. Explain the 200-line truncation rule and why this matters for agent behavior`
    }

    case 'file-size': {
      const affected = check.affectedFiles ?? []
      const details = affected.map(path => {
        const f = files.find(fi => fi.relativePath === path)
        return isZh
          ? (f ? `  ${f.relativePath}: ${formatBytes(f.sizeBytes)}` : `  ${path}`)
          : (f ? `  ${f.relativePath}: ${formatBytes(f.sizeBytes)}` : `  ${path}`)
      }).join('\n')

      if (isZh) {
        return `以下记忆文件过大，不适合最佳检索：

${details}

${baseContext}

大文件会稀释向量搜索结果，因为来自一个大文件的分块可能会挤占其他文件的匹配。基于分块的检索最适合结构良好、聚焦的文件，大小应在50KB以下。

请：
1. 对于每个超大文件，确定自然的分割点（按主题、按章节标题）
2. 为每次分割建议新的文件名
3. 解释这如何提高代理的搜索精度`
      }
      return `The following memory files are too large for optimal retrieval:

${details}

${baseContext}

Large files dilute vector search results because chunks from one large file can crowd out matches from other files. Chunk-based retrieval works best with focused, well-structured files under 50KB.

Please:
1. For each oversized file, identify natural splitting points (by topic, by section heading)
2. Suggest new filenames for each split
3. Explain how this improves search precision for agents`
    }

    case 'stale-daily-logs': {
      const stalePaths = check.affectedFiles ?? []
      const details = stalePaths.map(path => {
        const f = files.find(fi => fi.relativePath === path)
        return f ? `  ${f.relativePath}: ${formatBytes(f.sizeBytes)}` : `  ${path}`
      }).join('\n')

      if (isZh) {
        return `以下每日日志已过期（30+天）：

${details}

${baseContext}

每日日志旨在捕捉特定于会话的上下文。旧日志会给搜索结果增加噪音并降低检索速度。但是，有些可能包含值得保留的宝贵模式。

请逐一检查每个过期日志并建议：
1. 哪些内容（如果有）应该提升到常绿文件（以及哪个文件）
2. 哪些日志可以安全删除
3. 解释时间衰减及其如何影响搜索结果中的旧每日日志`
      }
      return `The following daily logs are stale (30+ days old):

${details}

${baseContext}

Daily logs are meant to capture session-specific context. Old logs add noise to search results and slow retrieval. However, some may contain valuable patterns worth preserving.

Please walk through each stale log and suggest:
1. Which content (if any) should be promoted to an evergreen file (and which file)
2. Which logs can be safely deleted
3. Explain temporal decay and how it affects old daily logs in search results`
    }

    case 'total-size': {
      const bySize = [...files].sort((a, b) => b.sizeBytes - a.sizeBytes)
      const breakdown = bySize.slice(0, 10).map(f =>
        isZh
          ? `  ${f.relativePath}: ${formatBytes(f.sizeBytes)} (${translateCategory(f.category, isZh)})`
          : `  ${f.relativePath}: ${formatBytes(f.sizeBytes)} (${f.category})`
      ).join('\n')

      if (isZh) {
        return `总记忆大小为 ${formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0))}。大型记忆存储会降低搜索质量并增加嵌入成本。

大小分解（从大到小）：

${breakdown}

${baseContext}

请：
1. 优先确定要清理的内容（最大文件、过期每日日志、冗余内容）
2. 显示清理后的预期大小
3. 解释总大小如何影响检索质量和嵌入成本`
      }
      return `Total memory size is ${formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0))}. Large memory stores degrade search quality and increase embedding costs.

Size breakdown (largest first):

${breakdown}

${baseContext}

Please:
1. Prioritize what to prune (largest files, stale daily logs, redundant content)
2. Show the expected size after cleanup
3. Explain how total size affects retrieval quality and embedding costs`
    }

    case 'vector-search-disabled': {
      if (isZh) {
        return `向量搜索当前已禁用。代理只能直接访问 MEMORY.md -- 他们无法语义搜索您的其他记忆文件（常绿文档、每日日志、主题文件）。

${baseContext}

OpenClaw 的向量搜索允许代理使用语义相似性（而不仅仅是关键词匹配）在所有文件中查找相关的记忆分块。没有它，代理会错过不在 MEMORY.md 中的上下文。

请：
1. 解释向量搜索的作用及其对代理记忆检索的重要性
2. 显示在 openclaw.json 中启用它的配置（memorySearch.enabled: true，以及推荐的混合搜索权重）
3. 告诉用户在启用后运行 "openclaw memory reindex" 来构建初始索引
4. 提及将来记忆编辑后也需要重新索引`
      }
      return `Vector search is currently disabled. Agents can only access MEMORY.md directly -- they cannot semantically search your other memory files (evergreen docs, daily logs, topic files).

${baseContext}

OpenClaw's vector search lets agents find relevant memory chunks across all files using semantic similarity, not just keyword matching. Without it, agents miss context that isn't in MEMORY.md.

Please:
1. Explain what vector search does and why it matters for agent memory retrieval
2. Show the config to enable it in openclaw.json (memorySearch.enabled: true, with recommended hybrid search weights)
3. Tell the user to run "openclaw memory reindex" after enabling to build the initial index
4. Mention that reindexing is needed after future memory edits too`
    }

    case 'unindexed-vector': {
      if (isZh) {
        return `配置中已启用向量搜索，但尚未构建搜索索引。这意味着代理无法使用语义搜索来查找相关的记忆内容 -- 他们只能直接访问 MEMORY.md。

${baseContext}

请：
1. 解释重新索引的作用（为每个记忆文件分块构建向量嵌入）
2. 解释为什么代理没有索引就无法搜索
3. 告诉用户点击"立即重新索引"按钮或从 CLI 运行 "openclaw memory reindex"`
      }
      return `Vector search is enabled in the configuration but no search index has been built. This means agents cannot use semantic search to find relevant memory content -- they can only access MEMORY.md directly.

${baseContext}

Please:
1. Explain what reindexing does (builds vector embeddings for each memory file chunk)
2. Explain why agents can't search without an index
3. Tell the user to click the "Reindex now" button or run "openclaw memory reindex" from the CLI`
    }

    case 'stale-index': {
      const affected = check.affectedFiles ?? []
      const details = affected.map(path => {
        const f = files.find(fi => fi.relativePath === path)
        return isZh
          ? (f ? `  ${f.relativePath}: 修改于 ${f.lastModified}` : `  ${path}`)
          : (f ? `  ${f.relativePath}: modified ${f.lastModified}` : `  ${path}`)
      }).join('\n')

      if (isZh) {
        return `搜索索引已过期。这些文件在上次索引构建后被修改：

${details}

${baseContext}

当索引过期时，代理可能会错过最近的编辑，因为他们的语义搜索返回的是过时的分块。编辑和重新索引之间的差距是代理的反馈延迟。

请：
1. 列出哪些文件发生了变化以及这有什么影响
2. 解释编辑到代理反馈的延迟
3. 建议现在重新索引`
      }
      return `The search index is stale. These files were modified after the last index build:

${details}

${baseContext}

When the index is stale, agents may miss recent edits because their semantic search returns outdated chunks. The gap between edit and reindex is a feedback delay for agents.

Please:
1. List which files changed and what kind of impact this has
2. Explain the edit-to-agent feedback gap
3. Recommend reindexing now`
    }

    case 'stale-evergreen': {
      const affected = check.affectedFiles ?? []
      const details = affected.map(path => {
        const f = files.find(fi => fi.relativePath === path)
        return isZh
          ? (f ? `  ${f.relativePath}: 最后修改于 ${f.lastModified}` : `  ${path}`)
          : (f ? `  ${f.relativePath}: last modified ${f.lastModified}` : `  ${path}`)
      }).join('\n')

      if (isZh) {
        return `这些常绿文件已超过90天未更新：

${details}

${baseContext}

常绿文件旨在包含稳定、长期存在的知识。但"稳定"并不意味着"被遗忘" -- 项目在发展，事实在变化。

请：
1. 对于每个过期文件，建议一个审查清单（事实是否仍然准确？项目是否发生了变化？是否有新模式要添加？）
2. 注明哪些文件可以保持不变，哪些可能需要更新`
      }
      return `These evergreen files haven't been updated in 90+ days:

${details}

${baseContext}

Evergreen files are meant to contain stable, long-lived knowledge. But "stable" doesn't mean "forgotten" -- projects evolve and facts change.

Please:
1. For each stale file, suggest a review checklist (are facts still accurate? has the project changed? are there new patterns to add?)
2. Note which files might be safe to leave as-is vs which likely need updates`
    }

    case 'no-config': {
      if (isZh) {
        return `未找到显式的记忆配置。系统正在使用 OpenClaw 默认值。

${baseContext}

向 openclaw.json 添加 memorySearch 部分可以让您控制搜索权重、时间衰减和缓存。

请：
1. 显示一个带有推荐默认值的 memorySearch 配置块示例：
   - 启用向量搜索
   - 混合搜索，向量/文本权重为 0.7/0.3
   - 启用时间衰减，半衰期为14天
   - 启用缓存，100个条目
2. 解释每个设置的作用以及何时更改它`
      }
      return `No explicit memory configuration was found. The system is using OpenClaw defaults.

${baseContext}

Adding a memorySearch section to openclaw.json gives you control over search weights, temporal decay, and caching.

Please:
1. Show an example memorySearch config block with recommended defaults:
   - Vector search enabled
   - Hybrid search with 0.7 vector / 0.3 text weights
   - Temporal decay enabled with 14-day half-life
   - Cache enabled with 100 entries
2. Explain what each setting does and when you'd change it`
    }

    case 'decay-disabled': {
      if (isZh) {
        return `时间衰减当前已禁用。没有它，90天前的每日日志在搜索结果中与昨天的日志排名相同。

${baseContext}

请：
1. 解释权衡：衰减改善新近性偏差，但可能隐藏仍然相关的旧内容
2. 显示启用时间衰减的配置（halfLifeDays: 14 是一个好的默认值）
3. 解释何时需要禁用衰减（例如，全部常绿记忆，没有每日日志）`
      }
      return `Temporal decay is currently disabled. Without it, a 90-day-old daily log ranks equally with yesterday's log in search results.

${baseContext}

Please:
1. Explain the trade-offs: decay improves recency bias but may hide still-relevant old content
2. Show the config to enable temporal decay (halfLifeDays: 14 is a good default)
3. Explain when you'd want decay disabled (e.g., all-evergreen memory with no daily logs)`
    }

    default:
      if (isZh) {
        return `健康检查标记了一个问题：${check.title}

${check.description}

${baseContext}

请解释这意味着什么，并建议解决它的具体行动。`
      }
      return `A health check flagged an issue: ${check.title}

${check.description}

${baseContext}

Please explain what this means and suggest specific actions to resolve it.`
  }
}

// ── Helpers ─────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)}KB`
  return `${(kb / 1024).toFixed(1)}MB`
}

function buildFileContext(check: MemoryHealthCheck, files: MemoryFileInfo[], isZh: boolean = false): string {
  if (!check.affectedFiles || check.affectedFiles.length === 0) return ''
  const affected = check.affectedFiles
    .map(path => {
      const f = files.find(fi => fi.relativePath === path)
      return f
        ? `- ${f.relativePath} (${formatBytes(f.sizeBytes)}, ${isZh ? translateCategory(f.category, isZh) : f.category})`
        : `- ${path}`
    })
    .join('\n')
  return isZh ? `受影响文件:\n${affected}` : `Affected files:\n${affected}`
}

// ── Translation Helpers ─────────────────────────────────────

function translateCategory(category: string, isZh: boolean): string {
  if (!isZh) return category
  const map: Record<string, string> = {
    'evergreen': '常绿',
    'daily': '每日',
    'other': '其他',
  }
  return map[category] || category
}

function translateSeverity(severity: string, isZh: boolean): string {
  if (!isZh) return severity.toUpperCase()
  const map: Record<string, string> = {
    'critical': '严重',
    'warning': '警告',
    'info': '信息',
    'ok': '正常',
  }
  return map[severity] || severity.toUpperCase()
}

function translateCheckTitle(id: string, title: string, isZh: boolean): string {
  if (!isZh) return title
  const map: Record<string, string> = {
    'memory-md-lines': 'MEMORY.md 超过200行',
    'file-size': '文件过大',
    'stale-daily-logs': '每日日志过期',
    'total-size': '总记忆体积过大',
    'vector-search-disabled': '向量搜索已禁用',
    'unindexed-vector': '向量搜索未索引',
    'stale-index': '索引已过期',
    'stale-evergreen': '常绿文件未更新',
    'no-config': '无显式配置',
    'decay-disabled': '时间衰减已禁用',
  }
  return map[id] || title
}

function translateCheckDescription(id: string, description: string, isZh: boolean): string {
  if (!isZh) return description
  const map: Record<string, string> = {
    'memory-md-lines': 'MEMORY.md 行数过多。考虑拆分为更小的文件。',
    'file-size': '较大的记忆文件可能会降低检索质量。',
    'stale-daily-logs': '旧的每日日志会给搜索结果增加噪音。',
    'total-size': '总记忆体积较大可能会影响检索性能。',
    'vector-search-disabled': '代理只能直接读取 MEMORY.md。请在 openclaw.json 中启用向量搜索。',
    'unindexed-vector': '配置中已启用记忆搜索，但索引不存在。',
    'stale-index': '搜索索引已过期，可能缺少最新更改。',
    'stale-evergreen': '常绿记忆文件长期未更新。',
    'no-config': '使用 OpenClaw 默认值。添加显式配置以自定义搜索行为。',
    'decay-disabled': '没有时间衰减，旧日志与最近日志排名相同。',
  }
  return map[id] || description
}
