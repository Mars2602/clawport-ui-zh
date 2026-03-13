import type {
  MemoryFileInfo,
  MemoryConfig,
  MemoryStatus,
  MemoryStats,
  MemoryHealthCheck,
  MemoryHealthSummary,
  StaleDailyLogInfo,
  HealthSeverity,
} from '@/lib/types'

// No Node imports -- this module is used from both server and client code.
// Use relativePath (already available on MemoryFileInfo) instead of path.basename().

// ── Constants ────────────────────────────────────────────────

const DAILY_PATTERN = /^\d{4}-\d{2}-\d{2}\.md$/

const SEVERITY_DEDUCTIONS: Record<Exclude<HealthSeverity, 'ok'>, number> = {
  critical: 20,
  warning: 10,
  info: 3,
}

// ── Stale daily log helper ───────────────────────────────────

export function computeStaleDailyLogs(files: MemoryFileInfo[], now = Date.now()): StaleDailyLogInfo[] {
  const results: StaleDailyLogInfo[] = []
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  for (const file of files) {
    if (file.category !== 'daily') continue
    const filename = file.relativePath.split('/').pop() ?? ''
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})\.md$/)
    if (!match) continue

    const dateStr = match[1]
    const fileDate = new Date(dateStr + 'T00:00:00Z').getTime()
    if (isNaN(fileDate)) continue

    const ageDays = Math.floor((now - fileDate) / (24 * 60 * 60 * 1000))
    if (ageDays < 30) continue

    results.push({
      relativePath: file.relativePath,
      label: file.label,
      date: dateStr,
      ageDays,
      sizeBytes: file.sizeBytes,
    })
  }

  // Sort by age descending (oldest first)
  return results.sort((a, b) => b.ageDays - a.ageDays)
}

// ── Health score ─────────────────────────────────────────────

export function computeHealthScore(checks: MemoryHealthCheck[]): number {
  let score = 100
  for (const check of checks) {
    if (check.severity !== 'ok') {
      score -= SEVERITY_DEDUCTIONS[check.severity]
    }
  }
  return Math.max(0, Math.min(100, score))
}

// ── Per-file severity ────────────────────────────────────────

const SEVERITY_ORDER: Record<HealthSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  ok: 3,
}

export function fileHealthSeverity(
  file: MemoryFileInfo,
  checks: MemoryHealthCheck[]
): HealthSeverity {
  let worst: HealthSeverity = 'ok'

  for (const check of checks) {
    if (!check.affectedFiles) continue
    if (!check.affectedFiles.includes(file.relativePath)) continue
    if (SEVERITY_ORDER[check.severity] < SEVERITY_ORDER[worst]) {
      worst = check.severity
    }
  }

  return worst
}

// ── Health checks ────────────────────────────────────────────

function findMemoryMd(files: MemoryFileInfo[]): MemoryFileInfo | undefined {
  return files.find(f => f.relativePath === 'MEMORY.md')
}

function checkMemoryMdLineCount(files: MemoryFileInfo[], isZh: boolean = false): MemoryHealthCheck | null {
  const memoryMd = findMemoryMd(files)
  if (!memoryMd) return null

  const lineCount = memoryMd.content.split('\n').length

  if (lineCount > 200) {
    return {
      id: 'memory-md-lines',
      severity: 'critical',
      title: isZh ? 'MEMORY.md 超过 200 行' : 'MEMORY.md exceeds 200 lines',
      description: isZh
        ? `MEMORY.md 有 ${lineCount} 行。加载到代理上下文时，200行之后的内容会被截断。请拆分为主题文件并从 MEMORY.md 链接。`
        : `MEMORY.md has ${lineCount} lines. Lines after 200 are truncated when loaded into agent context. Split into topic files and link from MEMORY.md.`,
      affectedFiles: ['MEMORY.md'],
      action: isZh
        ? '将 MEMORY.md 拆分为主题文件（如 patterns.md, debugging.md）并从 MEMORY.md 链接。'
        : 'Split MEMORY.md into topic files (e.g., patterns.md, debugging.md) and link from MEMORY.md.',
    }
  }

  if (lineCount > 150) {
    return {
      id: 'memory-md-lines',
      severity: 'warning',
      title: isZh ? 'MEMORY.md 接近 200 行限制' : 'MEMORY.md approaching 200 line limit',
      description: isZh
        ? `MEMORY.md 有 ${lineCount} 行。最佳实践是保持在 200 行以下。考虑将不太重要的部分拆分到单独的文件。`
        : `MEMORY.md has ${lineCount} lines. Best practice is to keep it under 200 lines. Consider splitting less-critical sections into separate files.`,
      affectedFiles: ['MEMORY.md'],
      action: isZh
        ? '将详细部分移动到单独的主题文件中，以保持 MEMORY.md 简洁。'
        : 'Move detailed sections into separate topic files to keep MEMORY.md concise.',
    }
  }

  return null
}

function checkFileSizes(files: MemoryFileInfo[], isZh: boolean = false): MemoryHealthCheck | null {
  const critical: string[] = []
  const warning: string[] = []

  for (const file of files) {
    if (file.sizeBytes > 100 * 1024) {
      critical.push(file.relativePath)
    } else if (file.sizeBytes > 50 * 1024) {
      warning.push(file.relativePath)
    }
  }

  if (critical.length > 0) {
    return {
      id: 'file-size',
      severity: 'critical',
      title: isZh
        ? `${critical.length} 个文件超过 100KB`
        : `${critical.length} file${critical.length > 1 ? 's' : ''} over 100KB`,
      description: isZh
        ? '较大的记忆文件会降低检索质量。基于分块的搜索最适合结构良好、聚焦的文件，大小应在 50KB 以下。'
        : 'Large memory files dilute retrieval quality. Chunk-based search works best with focused, well-structured files under 50KB.',
      affectedFiles: critical,
      action: isZh
        ? '将大文件拆分为更小的、聚焦的主题文件。'
        : 'Split large files into smaller, focused topic files.',
    }
  }

  if (warning.length > 0) {
    return {
      id: 'file-size',
      severity: 'warning',
      title: isZh
        ? `${warning.length} 个文件超过 50KB`
        : `${warning.length} file${warning.length > 1 ? 's' : ''} over 50KB`,
      description: isZh
        ? '文件接近 100KB 阈值。考虑拆分以提高搜索精度。'
        : 'Files approaching the 100KB threshold. Consider splitting to improve search precision.',
      affectedFiles: warning,
      action: isZh
        ? '审查大文件，如果它们涵盖多个不同主题则进行拆分。'
        : 'Review large files and split if they cover multiple distinct topics.',
    }
  }

  return null
}

function checkStaleDailyLogs(files: MemoryFileInfo[], now: number, isZh: boolean = false): MemoryHealthCheck | null {
  const stale = computeStaleDailyLogs(files, now)
  if (stale.length === 0) return null

  const over60 = stale.filter(s => s.ageDays > 60)
  const affected = stale.map(s => s.relativePath)

  if (over60.length > 0) {
    return {
      id: 'stale-daily-logs',
      severity: 'warning',
      title: isZh
        ? `${stale.length} 个过期每日日志`
        : `${stale.length} stale daily log${stale.length > 1 ? 's' : ''}`,
      description: isZh
        ? `${over60.length} 个日志超过 60 天。旧日志会给搜索结果增加噪音并降低检索速度。`
        : `${over60.length} log${over60.length > 1 ? 's are' : ' is'} over 60 days old. Old logs add noise to search results and slow retrieval.`,
      affectedFiles: affected,
      action: isZh
        ? '审查旧每日日志：将有用的模式提升到常绿文件，然后删除过期日志。'
        : 'Review old daily logs: promote useful patterns to evergreen files, then delete stale logs.',
    }
  }

  return {
    id: 'stale-daily-logs',
    severity: 'info',
    title: isZh
      ? `${stale.length} 个每日日志超过 30 天`
      : `${stale.length} daily log${stale.length > 1 ? 's' : ''} over 30 days old`,
    description: isZh
      ? '考虑审查较旧的每日日志，寻找值得提升到常绿文件的模式。'
      : 'Consider reviewing older daily logs for patterns worth promoting to evergreen files.',
    affectedFiles: affected,
    action: isZh
      ? '审查超过 30 天的每日日志并归档或提升有用的内容。'
      : 'Review daily logs older than 30 days and archive or promote useful content.',
  }
}

function checkTotalMemorySize(stats: MemoryStats, isZh: boolean = false): MemoryHealthCheck | null {
  const totalBytes = stats.totalSizeBytes

  if (totalBytes > 1024 * 1024) {
    return {
      id: 'total-size',
      severity: 'critical',
      title: isZh ? '总记忆超过 1MB' : 'Total memory exceeds 1MB',
      description: isZh
        ? `总记忆大小为 ${(totalBytes / 1024 / 1024).toFixed(1)}MB。大型记忆存储会降低搜索质量并增加嵌入成本。`
        : `Total memory size is ${(totalBytes / 1024 / 1024).toFixed(1)}MB. Large memory stores degrade search quality and increase embedding costs.`,
      affectedFiles: null,
      action: isZh
        ? '清理旧每日日志并拆分或修剪超大文件。'
        : 'Prune old daily logs and split or trim oversized files.',
    }
  }

  if (totalBytes > 500 * 1024) {
    return {
      id: 'total-size',
      severity: 'warning',
      title: isZh ? '总记忆接近 1MB' : 'Total memory approaching 1MB',
      description: isZh
        ? `总记忆大小为 ${(totalBytes / 1024).toFixed(0)}KB。考虑清理以保持检索快速且相关。`
        : `Total memory size is ${(totalBytes / 1024).toFixed(0)}KB. Consider pruning to keep retrieval fast and relevant.`,
      affectedFiles: null,
      action: isZh
        ? '审查并清理低价值内容，保持在 500KB 以下。'
        : 'Review and prune low-value content to stay under 500KB.',
    }
  }

  return null
}

function checkVectorSearchDisabled(config: MemoryConfig, isZh: boolean = false): MemoryHealthCheck | null {
  if (config.memorySearch.enabled) return null

  return {
    id: 'vector-search-disabled',
    severity: 'warning',
    title: isZh ? '向量搜索已禁用' : 'Vector search is disabled',
    description: isZh
      ? '代理只能直接读取 MEMORY.md。请在 openclaw.json 中启用向量搜索，以便代理可以语义搜索所有记忆文件。'
      : 'Agents can only read MEMORY.md directly. Enable vector search in openclaw.json so agents can semantically search all memory files.',
    affectedFiles: null,
    action: isZh
      ? '在 openclaw.json 中启用 memorySearch 并运行 "openclaw memory reindex" 构建搜索索引。'
      : 'Enable memorySearch in openclaw.json and run "openclaw memory reindex" to build the search index.',
  }
}

function checkUnindexedVectorSearch(config: MemoryConfig, status: MemoryStatus, isZh: boolean = false): MemoryHealthCheck | null {
  if (!config.memorySearch.enabled) return null
  if (status.indexed) return null

  return {
    id: 'unindexed-vector',
    severity: 'critical',
    title: isZh ? '向量搜索已启用但未索引' : 'Vector search enabled but not indexed',
    description: isZh
      ? '配置中已启用记忆搜索，但索引不存在。在构建索引之前，代理无法使用语义搜索。'
      : 'Memory search is enabled in config but no index exists. Agents cannot use semantic search until the index is built.',
    affectedFiles: null,
    action: isZh
      ? '运行 "openclaw memory reindex" 构建搜索索引。'
      : 'Run "openclaw memory reindex" to build the search index.',
  }
}

function checkStaleIndex(
  config: MemoryConfig,
  status: MemoryStatus,
  files: MemoryFileInfo[],
  now: number,
  isZh: boolean = false
): MemoryHealthCheck | null {
  if (!config.memorySearch.enabled) return null
  if (!status.indexed || !status.lastIndexed) return null

  const lastIndexedMs = new Date(status.lastIndexed).getTime()
  if (isNaN(lastIndexedMs)) return null

  // Check if any file was modified after the last index
  const modifiedAfterIndex = files.filter(f => {
    const mtime = new Date(f.lastModified).getTime()
    return mtime > lastIndexedMs
  })

  if (modifiedAfterIndex.length === 0) return null

  const hoursSinceIndex = (now - lastIndexedMs) / (60 * 60 * 1000)
  if (hoursSinceIndex < 1) return null

  return {
    id: 'stale-index',
    severity: 'warning',
    title: isZh ? '搜索索引已过期' : 'Search index is stale',
    description: isZh
      ? `${modifiedAfterIndex.length} 个文件在上次索引后被修改（${Math.floor(hoursSinceIndex)}小时前）。代理可能会错过最近的编辑。`
      : `${modifiedAfterIndex.length} file${modifiedAfterIndex.length > 1 ? 's were' : ' was'} modified after the last index (${Math.floor(hoursSinceIndex)}h ago). Agents may miss recent edits.`,
    affectedFiles: modifiedAfterIndex.map(f => f.relativePath),
    action: isZh
      ? '重新索引记忆，使代理看到您的最新更改。'
      : 'Reindex memory so agents see your latest changes.',
  }
}

function checkStaleEvergreenFiles(files: MemoryFileInfo[], now: number, isZh: boolean = false): MemoryHealthCheck | null {
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
  const stale = files.filter(f => {
    if (f.category !== 'evergreen') return false
    const mtime = new Date(f.lastModified).getTime()
    return mtime < ninetyDaysAgo
  })

  if (stale.length === 0) return null

  return {
    id: 'stale-evergreen',
    severity: 'info',
    title: isZh
      ? `${stale.length} 个常绿文件超过 90 天未更新`
      : `${stale.length} evergreen file${stale.length > 1 ? 's' : ''} not updated in 90+ days`,
    description: isZh
      ? '最近未更新的常绿文件可能包含过时的事实。定期审查以保持信息最新。'
      : 'Evergreen files that haven\'t been updated recently may contain outdated facts. Review periodically to keep information current.',
    affectedFiles: stale.map(f => f.relativePath),
    action: isZh
      ? '审查常绿文件中过时的信息，并更新或删除陈旧内容。'
      : 'Review evergreen files for outdated information and update or remove stale content.',
  }
}

function checkNoExplicitConfig(config: MemoryConfig, isZh: boolean = false): MemoryHealthCheck | null {
  if (config.configFound) return null

  return {
    id: 'no-config',
    severity: 'info',
    title: isZh ? '无显式记忆配置' : 'No explicit memory configuration',
    description: isZh
      ? '使用 OpenClaw 默认值。在 openclaw.json 中添加显式 memorySearch 配置可让您调整搜索权重、时间衰减和缓存。'
      : 'Using OpenClaw defaults. Adding explicit memorySearch config in openclaw.json lets you tune search weights, temporal decay, and caching.',
    affectedFiles: null,
    action: isZh
      ? '向 openclaw.json 添加 memorySearch 部分以自定义搜索行为。'
      : 'Add a memorySearch section to openclaw.json to customize search behavior.',
  }
}

function checkTemporalDecayDisabled(config: MemoryConfig, isZh: boolean = false): MemoryHealthCheck | null {
  if (!config.memorySearch.enabled) return null
  if (config.memorySearch.hybrid.temporalDecay.enabled) return null

  return {
    id: 'decay-disabled',
    severity: 'info',
    title: isZh ? '时间衰减已禁用' : 'Temporal decay is disabled',
    description: isZh
      ? '没有时间衰减，旧每日日志在搜索结果中与最近的日志排名相同。启用衰减以优先显示最近的上下文。'
      : 'Without temporal decay, old daily logs rank equally with recent ones in search results. Enable decay to prioritize recent context.',
    affectedFiles: null,
    action: isZh
      ? '在 openclaw.json 中启用 temporalDecay，以降低旧每日日志在搜索中的排名。'
      : 'Enable temporalDecay in openclaw.json to down-rank old daily logs in search.',
  }
}

// ── Main function ────────────────────────────────────────────

export function computeMemoryHealth(
  files: MemoryFileInfo[],
  config: MemoryConfig,
  status: MemoryStatus,
  stats: MemoryStats,
  now = Date.now(),
  locale: string = 'en'
): MemoryHealthSummary {
  const isZh = locale === 'zh'
  const checks: MemoryHealthCheck[] = []

  const checkers = [
    () => checkMemoryMdLineCount(files, isZh),
    () => checkFileSizes(files, isZh),
    () => checkStaleDailyLogs(files, now, isZh),
    () => checkTotalMemorySize(stats, isZh),
    () => checkVectorSearchDisabled(config, isZh),
    () => checkUnindexedVectorSearch(config, status, isZh),
    () => checkStaleIndex(config, status, files, now, isZh),
    () => checkStaleEvergreenFiles(files, now, isZh),
    () => checkNoExplicitConfig(config, isZh),
    () => checkTemporalDecayDisabled(config, isZh),
  ]

  for (const checker of checkers) {
    const result = checker()
    if (result) checks.push(result)
  }

  // Sort by severity
  checks.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const score = computeHealthScore(checks)
  const staleDailyLogs = computeStaleDailyLogs(files, now)

  return { score, checks, staleDailyLogs }
}
