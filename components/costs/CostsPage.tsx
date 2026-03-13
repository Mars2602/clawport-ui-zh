'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Agent, CostSummary, CronJob, RunCost, ClaudeCodeUsage } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, TrendingDown, TrendingUp, Activity, MessageSquare, ChevronDown } from 'lucide-react'
import { generateId } from '@/lib/id'
import { buildCostAnalysisPrompt } from '@/lib/costs'
import { renderMarkdown } from '@/lib/sanitize'
import { fmtCost, fmtTokens } from './formatters'
import { SummaryCard } from './SummaryCard'
import { DailyCostChart } from './DailyCostChart'
import { TokenDonut } from './TokenDonut'
import { TopCrons } from './TopCrons'
import { RunDetailTable } from './RunDetailTable'
import { OptimizationCard } from './OptimizationPanel'
import { ClaudeUsageRow } from './ClaudeUsageRow'

/* ── Chat message type ───────────────────────────────────────── */

interface CostChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

/* ── Labels interface ─────────────────────────────────────────── */

interface CostsPageLabels {
  title?: string
  noData?: string
  withCostData?: string
  noCostData?: string
  anomaly?: string
  anomalies?: string
  anomalyMedian?: string
  totalEstimatedCost?: string
  thisWeek?: string
  lastWeek?: string
  cacheSavings?: string
  cacheTokens?: string
  anomaliesLabel?: string
  agentOptimizer?: string
  aiAnalysisDesc?: string
  analyzing?: string
  analyze?: string
  askAbout?: string
  suggestionHaiku?: string
  suggestion5Hour?: string
  suggestionExpensive?: string
  suggestionThinking?: string
  followUpChanges?: string
  followUpThinking?: string
  followUpContext?: string
  placeholderFollowUp?: string
  send?: string
  job?: string
  runs?: string
  input?: string
  output?: string
  cache?: string
  estCost?: string
  noJobsCostData?: string
  perRunDetail?: string
  run?: string
  time?: string
  model?: string
  cost?: string
  showAllRuns?: string
  claudeCodeUsage?: string
  fiveHourWindow?: string
  resetsIn?: string
  weeklyCap?: string
  dailyEstimatedCost?: string
  tokenBreakdown?: string
  total?: string
  mostExpensiveCrons?: string
  avg?: string
  optimizationScore?: string
  potential?: string
  insights?: string
  showLess?: string
  showAllInsights?: string
  allClearNoIssues?: string
  savePerPeriod?: string
  howToFix?: string
  cacheLabel?: string
  tiering?: string
  efficiency?: string
  errorLoadCosts?: string
  errorLoadCrons?: string
  errorLoadAgents?: string
  errorUnknown?: string
}

/* ── CostsPage ───────────────────────────────────────────────── */

export function CostsPage({ labels }: { labels?: CostsPageLabels }) {
  const l = {
    title: labels?.title ?? 'Costs & Optimization',
    noData: labels?.noData ?? 'No data',
    withCostData: labels?.withCostData ?? 'with cost data',
    noCostData: labels?.noCostData ?? 'No cost data -- runs without usage metadata will not appear here.',
    anomaly: labels?.anomaly ?? 'anomaly',
    anomalies: labels?.anomalies ?? 'anomalies',
    anomalyMedian: labels?.anomalyMedian ?? 'median',
    totalEstimatedCost: labels?.totalEstimatedCost ?? 'Total Estimated Cost',
    thisWeek: labels?.thisWeek ?? 'This Week',
    lastWeek: labels?.lastWeek ?? 'last week',
    cacheSavings: labels?.cacheSavings ?? 'Cache Savings',
    cacheTokens: labels?.cacheTokens ?? 'cache tokens',
    anomaliesLabel: labels?.anomaliesLabel ?? 'Anomalies',
    agentOptimizer: labels?.agentOptimizer ?? 'Agent Optimizer',
    aiAnalysisDesc: labels?.aiAnalysisDesc ?? 'AI-powered analysis of your agent costs and throughput',
    analyzing: labels?.analyzing ?? 'Analyzing...',
    analyze: labels?.analyze ?? 'Analyze',
    askAbout: labels?.askAbout ?? 'Ask about',
    suggestionHaiku: labels?.suggestionHaiku ?? 'Which agents should switch to Haiku?',
    suggestion5Hour: labels?.suggestion5Hour ?? 'How do I reduce my 5-hour window usage?',
    suggestionExpensive: labels?.suggestionExpensive ?? 'Show me my most expensive agent and how to fix it',
    suggestionThinking: labels?.suggestionThinking ?? 'What thinking effort should each agent use?',
    followUpChanges: labels?.followUpChanges ?? 'Show me the config changes',
    followUpThinking: labels?.followUpThinking ?? 'Which agents need less thinking effort?',
    followUpContext: labels?.followUpContext ?? 'How do I trim agent context?',
    placeholderFollowUp: labels?.placeholderFollowUp ?? 'Ask a follow-up...',
    send: labels?.send ?? 'Send',
    job: labels?.job ?? 'Job',
    runs: labels?.runs ?? 'Runs',
    input: labels?.input ?? 'Input',
    output: labels?.output ?? 'Output',
    cache: labels?.cache ?? 'Cache',
    estCost: labels?.estCost ?? 'Est. Cost',
    noJobsCostData: labels?.noJobsCostData ?? 'No jobs with cost data',
    perRunDetail: labels?.perRunDetail ?? 'Per-Run Detail',
    run: labels?.run ?? 'Run',
    time: labels?.time ?? 'Time',
    model: labels?.model ?? 'Model',
    cost: labels?.cost ?? 'Cost',
    showAllRuns: labels?.showAllRuns ?? 'Show all runs',
    claudeCodeUsage: labels?.claudeCodeUsage ?? 'Claude Code Usage',
    fiveHourWindow: labels?.fiveHourWindow ?? '5-Hour Window',
    resetsIn: labels?.resetsIn ?? 'Resets in',
    weeklyCap: labels?.weeklyCap ?? 'Weekly Cap',
    dailyEstimatedCost: labels?.dailyEstimatedCost ?? 'Daily Estimated Cost',
    tokenBreakdown: labels?.tokenBreakdown ?? 'Token Breakdown',
    total: labels?.total ?? 'total',
    mostExpensiveCrons: labels?.mostExpensiveCrons ?? 'Most Expensive Crons',
    avg: labels?.avg ?? 'avg',
    optimizationScore: labels?.optimizationScore ?? 'Optimization Score',
    potential: labels?.potential ?? 'Potential',
    insights: labels?.insights ?? 'Insights',
    showLess: labels?.showLess ?? 'Show less',
    showAllInsights: labels?.showAllInsights ?? 'Show all {count} insights',
    allClearNoIssues: labels?.allClearNoIssues ?? 'All clear -- no optimization issues detected',
    savePerPeriod: labels?.savePerPeriod ?? 'Save per period',
    howToFix: labels?.howToFix ?? 'How to fix',
    cacheLabel: labels?.cacheLabel ?? 'Cache',
    tiering: labels?.tiering ?? 'Tiering',
    efficiency: labels?.efficiency ?? 'Efficiency',
    errorLoadCosts: labels?.errorLoadCosts ?? 'Failed to load costs',
    errorLoadCrons: labels?.errorLoadCrons ?? 'Failed to load crons',
    errorLoadAgents: labels?.errorLoadAgents ?? 'Failed to load agents',
    errorUnknown: labels?.errorUnknown ?? 'Unknown error',
  }
  const [data, setData] = useState<CostSummary | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [jobNames, setJobNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI Cost Analysis state
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysisStreaming, setAnalysisStreaming] = useState(false)
  const [analysisContent, setAnalysisContent] = useState('')
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [chatMessages, setChatMessages] = useState<CostChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatStreaming, setChatStreaming] = useState(false)

  // Claude Code usage state
  const [claudeUsage, setClaudeUsage] = useState<ClaudeCodeUsage | null>(null)

  const rootAgent = useMemo(
    () => agents.find(a => a.reportsTo === null) || agents[0] || null,
    [agents],
  )

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetch('/api/costs').then(r => {
        if (!r.ok) throw new Error(l.errorLoadCosts)
        return r.json()
      }),
      fetch('/api/crons').then(r => {
        if (!r.ok) throw new Error(l.errorLoadCrons)
        return r.json()
      }),
      fetch('/api/agents').then(r => {
        if (!r.ok) throw new Error(l.errorLoadAgents)
        return r.json()
      }),
    ])
      .then(([costData, cronData, agentData]: [CostSummary, { crons: CronJob[] }, Agent[]]) => {
        setData(costData)
        setAgents(agentData)
        const names: Record<string, string> = {}
        for (const c of cronData.crons) {
          names[c.id] = c.name
        }
        setJobNames(names)
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : l.errorUnknown)
        setLoading(false)
      })
  }, [])

  // Claude Code usage SSE stream
  useEffect(() => {
    const es = new EventSource('/api/usage/stream')
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.type === 'usage' && parsed.data) {
          const d = parsed.data
          // Only show when we have real utilization data
          if (d.fiveHour?.utilization > 0 || d.sevenDay?.utilization > 0) {
            setClaudeUsage(d)
          }
        }
      } catch { /* skip */ }
    }
    es.onerror = () => { /* keep last good value */ }
    return () => es.close()
  }, [])


  const jobName = (id: string) => jobNames[id] || id

  // Date range from run costs
  const dateRange = data && data.runCosts.length > 0
    ? {
        oldest: new Date(Math.min(...data.runCosts.map(r => r.ts))),
        newest: new Date(Math.max(...data.runCosts.map(r => r.ts))),
      }
    : null

  // Total projected savings from all insights
  const totalProjectedSavings = useMemo(
    () => data?.insights.reduce((s, i) => s + (i.projectedSavings ?? 0), 0) ?? 0,
    [data],
  )

  // Run AI cost analysis
  const runAnalysis = useCallback(async () => {
    if (!rootAgent || analysisStreaming || !data) return
    setAnalysisOpen(true)
    setAnalysisStreaming(true)
    setAnalysisContent('')
    setChatMessages([])

    const prompt = buildCostAnalysisPrompt(data, jobNames)

    try {
      const res = await fetch(`/api/chat/${rootAgent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const chunk = JSON.parse(line.slice(6))
              if (chunk.content) {
                fullContent += chunk.content
                setAnalysisContent(fullContent)
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setAnalysisContent(prev => prev + '\n\n[Error: Failed to connect to agent]')
    } finally {
      setAnalysisStreaming(false)
    }
  }, [rootAgent, analysisStreaming, data, jobNames])

  // Send follow-up chat message
  const sendChatMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim()
    if (!text || chatStreaming || !rootAgent || !data) return
    if (!overrideText) setChatInput('')

    const userMsg: CostChatMessage = { id: generateId(), role: 'user', content: text }
    const assistantMsgId = generateId()
    const assistantMsg: CostChatMessage = { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }

    setChatMessages(prev => [...prev, userMsg, assistantMsg])
    setChatStreaming(true)

    const prompt = buildCostAnalysisPrompt(data, jobNames)
    const allMessages = [...chatMessages, userMsg]
    const apiMessages = [
      { role: 'user' as const, content: prompt },
      ...(analysisContent ? [{ role: 'assistant' as const, content: analysisContent }] : []),
      ...allMessages.map(m => ({ role: m.role, content: m.content })),
    ]

    try {
      const res = await fetch(`/api/chat/${rootAgent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const chunk = JSON.parse(line.slice(6))
              if (chunk.content) {
                fullContent += chunk.content
                const captured = fullContent
                setChatMessages(prev =>
                  prev.map(m => m.id === assistantMsgId ? { ...m, content: captured, isStreaming: true } : m)
                )
              }
            } catch { /* skip */ }
          }
        }
      }

      const finalContent = fullContent
      setChatMessages(prev =>
        prev.map(m => m.id === assistantMsgId ? { ...m, content: finalContent, isStreaming: false } : m)
      )
    } catch {
      setChatMessages(prev =>
        prev.map(m => m.id === assistantMsgId ? { ...m, content: 'Error getting response. Check API connection.', isStreaming: false } : m)
      )
    } finally {
      setChatStreaming(false)
      chatTextareaRef.current?.focus()
    }
  }, [chatInput, chatStreaming, rootAgent, chatMessages, analysisContent, data, jobNames])

  // Handle insight action -- open analysis if needed, then send
  const handleInsightAction = useCallback((prompt: string) => {
    if (!analysisOpen) setAnalysisOpen(true)
    // If no analysis has been run, run it first then the user's action will be available in chat
    if (!analysisContent && !analysisStreaming) {
      runAnalysis()
      return
    }
    sendChatMessage(prompt)
  }, [analysisOpen, analysisContent, analysisStreaming, runAnalysis, sendChatMessage])

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in" style={{ background: 'var(--bg)' }}>
      {/* ── Sticky header ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 flex-shrink-0"
        style={{
          background: 'var(--material-regular)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid var(--separator)',
          padding: 'var(--space-4) var(--space-6)',
        }}
      >
        <h1 style={{
          fontSize: 'var(--text-title1)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          lineHeight: 'var(--leading-tight)',
        }}>
          {l.title}
        </h1>
        {!loading && data && (
          <p style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {dateRange
              ? `${dateRange.oldest.toLocaleDateString()} - ${dateRange.newest.toLocaleDateString()}`
              : l.noData}
            {' \u00b7 '}
            {data.runCosts.length} run{data.runCosts.length !== 1 ? 's' : ''} {l.withCostData}
          </p>
        )}
      </header>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-4) var(--space-6) var(--space-6)', minHeight: 0 }}>
        {error && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            color: 'var(--system-red)',
            fontSize: 'var(--text-footnote)',
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div>
            <div className="costs-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: 'var(--material-regular)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                  <Skeleton style={{ width: 100, height: 10, marginBottom: 8 }} />
                  <Skeleton style={{ width: 60, height: 20 }} />
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--material-regular)', border: '1px solid var(--separator)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center" style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: i < 4 ? '1px solid var(--separator)' : undefined, gap: 'var(--space-3)' }}>
                  <Skeleton style={{ width: 140, height: 14 }} />
                  <Skeleton style={{ width: 60, height: 14, flex: 1 }} />
                  <Skeleton style={{ width: 80, height: 14 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && (!data || data.runCosts.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-footnote)',
          }}>
            {l.noCostData}
          </div>
        )}

        {!loading && !error && data && data.runCosts.length > 0 && (
          <>
            {/* ── Anomaly banner ─────────────────────────────────── */}
            {data.anomalies.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(255, 149, 0, 0.08)',
                border: '1px solid rgba(255, 149, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-footnote)',
                color: 'var(--system-orange)',
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>{data.anomalies.length} {data.anomalies.length === 1 ? l.anomaly : l.anomalies}</strong>
                  {' -- '}
                  {data.anomalies.slice(0, 3).map((a, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {jobName(a.jobId)} ({a.ratio.toFixed(1)}x {l.anomalyMedian})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Claude Code Usage ──────────────────────────────── */}
            {claudeUsage && <ClaudeUsageRow usage={claudeUsage} labels={{
              claudeCodeUsage: l.claudeCodeUsage,
              fiveHourWindow: l.fiveHourWindow,
              resetsIn: l.resetsIn,
              weeklyCap: l.weeklyCap,
            }} />}

            {/* ── Summary cards ────────────────────────────────── */}
            <div className="costs-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {/* Total Estimated Cost */}
              <SummaryCard label={l.totalEstimatedCost}>
                <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-title2)', color: 'var(--text-primary)', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCost(data.totalCost)}
                  </span>
                  {data.weekOverWeek.changePct !== null && (
                    <span className="flex items-center" style={{
                      fontSize: 'var(--text-caption1)',
                      fontWeight: 'var(--weight-semibold)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: data.weekOverWeek.changePct <= 0 ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
                      color: data.weekOverWeek.changePct <= 0 ? 'var(--system-green)' : 'var(--system-red)',
                      gap: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}>
                      {data.weekOverWeek.changePct <= 0
                        ? <TrendingDown size={10} />
                        : <TrendingUp size={10} />}
                      {Math.abs(data.weekOverWeek.changePct).toFixed(0)}%
                    </span>
                  )}
                </div>
              </SummaryCard>

              {/* This Week vs Last Week */}
              <SummaryCard label={l.thisWeek}>
                <div style={{ fontSize: 'var(--text-title2)', color: 'var(--text-primary)', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCost(data.weekOverWeek.thisWeek)}
                </div>
                <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {l.lastWeek}: {fmtCost(data.weekOverWeek.lastWeek)}
                </div>
              </SummaryCard>

              {/* Cache Savings */}
              <SummaryCard label={l.cacheSavings}>
                <div style={{ fontSize: 'var(--text-title2)', color: 'var(--system-green)', fontWeight: 'var(--weight-bold)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCost(data.cacheSavings.estimatedSavings)}
                </div>
                <div style={{ fontSize: 'var(--text-caption1)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {fmtTokens(data.cacheSavings.cacheTokens)} {l.cacheTokens}
                </div>
              </SummaryCard>

              {/* Anomalies */}
              <SummaryCard label={l.anomaliesLabel}>
                <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                  {data.anomalies.length > 0 && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--system-orange)', flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontSize: 'var(--text-title2)',
                    fontWeight: 'var(--weight-bold)',
                    color: data.anomalies.length > 0 ? 'var(--system-orange)' : 'var(--system-green)',
                  }}>
                    {data.anomalies.length}
                  </span>
                </div>
              </SummaryCard>
            </div>

            {/* ── Optimization Score + Insights ─────────────────── */}
            <OptimizationCard
              score={data.optimizationScore}
              insights={data.insights}
              totalSavings={totalProjectedSavings}
              jobName={jobName}
              onAction={handleInsightAction}
              labels={{
                optimizationScore: l.optimizationScore,
                potential: l.potential,
                insights: l.insights,
                showLess: l.showLess,
                showAllInsights: l.showAllInsights,
                allClearNoIssues: l.allClearNoIssues,
                cache: l.cacheLabel,
                tiering: l.tiering,
                efficiency: l.efficiency,
                savePerPeriod: l.savePerPeriod,
                howToFix: l.howToFix,
              }}
            />

            {/* ── Agent Optimizer ─────────────────────────────────── */}
            <div style={{
              background: 'var(--material-regular)',
              border: '1px solid var(--separator)',
              borderRadius: 12,
              marginBottom: 'var(--space-4)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: analysisOpen ? '1px solid var(--separator)' : undefined,
              }}>
                <Activity size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {l.agentOptimizer}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {l.aiAnalysisDesc}
                  </div>
                </div>
                {analysisStreaming && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: 'var(--accent)', fontWeight: 500,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                      animation: 'pulse 1.2s infinite',
                    }} />
                    {l.analyzing}
                  </span>
                )}
                {!analysisOpen && !analysisContent && !analysisStreaming && (
                  <button
                    onClick={() => { setAnalysisOpen(true); runAnalysis() }}
                    className="btn-ghost focus-ring"
                    style={{
                      padding: '6px 16px', borderRadius: 8,
                      fontSize: 13, fontWeight: 600,
                      background: 'var(--accent)', color: 'white',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {l.analyze}
                  </button>
                )}
                {(analysisOpen || analysisContent) && (
                  <button
                    onClick={() => setAnalysisOpen(!analysisOpen)}
                    className="focus-ring"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--text-tertiary)',
                        transform: analysisOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease',
                      }}
                    />
                  </button>
                )}
              </div>

              {analysisOpen && (
                <div>
                  {/* Loading skeleton */}
                  {analysisStreaming && !analysisContent && (
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[180, 240, 160, 220, 140].map((w, i) => (
                        <div key={i} style={{
                          width: w, maxWidth: '100%', height: 12, borderRadius: 4,
                          background: 'var(--fill-tertiary)',
                          animation: `shimmer 1.6s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}

                  {/* Analysis content */}
                  {analysisContent && (
                    <div
                      className="markdown-body"
                      style={{
                        padding: '16px 20px',
                        maxHeight: 520,
                        overflowY: 'auto',
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: 'var(--text-primary)',
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisContent) }}
                    />
                  )}

                  {/* Suggested actions (before first analysis or after completion) */}
                  {!analysisContent && !analysisStreaming && (
                    <div style={{ padding: '12px 20px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                        {l.askAbout}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[
                          l.suggestionHaiku,
                          l.suggestion5Hour,
                          l.suggestionExpensive,
                          l.suggestionThinking,
                        ].map(q => (
                          <button
                            key={q}
                            onClick={() => { setAnalysisOpen(true); runAnalysis(); }}
                            className="btn-ghost focus-ring"
                            style={{
                              padding: '5px 12px', borderRadius: 14,
                              fontSize: 12, fontWeight: 500,
                              background: 'var(--fill-secondary)',
                              border: '1px solid var(--separator)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline chat (after analysis complete) */}
                  {analysisContent && !analysisStreaming && (
                    <>
                      <div style={{ height: 1, background: 'var(--separator)' }} />

                      {/* Chat messages */}
                      {chatMessages.length > 0 && (
                        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '12px 20px' }}>
                          {chatMessages.map(msg => (
                            <div key={msg.id} style={{
                              marginBottom: 12,
                              display: 'flex',
                              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                              <div style={{
                                maxWidth: '85%',
                                padding: '8px 14px',
                                borderRadius: 12,
                                fontSize: 14,
                                lineHeight: 1.55,
                                ...(msg.role === 'user' ? {
                                  background: 'var(--accent)',
                                  color: 'white',
                                } : {
                                  background: 'var(--fill-secondary)',
                                  color: 'var(--text-primary)',
                                }),
                              }}>
                                {msg.role === 'assistant' ? (
                                  <div
                                    className="markdown-body"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content || '...') }}
                                  />
                                ) : (
                                  msg.content
                                )}
                                {msg.isStreaming && (
                                  <span style={{
                                    display: 'inline-block', width: 6, height: 14,
                                    background: 'var(--text-tertiary)', borderRadius: 1,
                                    marginLeft: 2, animation: 'blink 1s step-end infinite',
                                  }} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {chatMessages.length === 0 && (
                        <div style={{ padding: '8px 20px 4px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {[
                            l.followUpChanges,
                            l.followUpThinking,
                            l.followUpContext,
                          ].map(q => (
                            <button
                              key={q}
                              onClick={() => sendChatMessage(q)}
                              className="btn-ghost focus-ring"
                              style={{
                                padding: '4px 10px', borderRadius: 12,
                                fontSize: 11, fontWeight: 500,
                                background: 'var(--fill-secondary)',
                                border: '1px solid var(--separator)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                              }}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Chat input */}
                      <div style={{
                        display: 'flex', alignItems: 'flex-end', gap: 8,
                        padding: '10px 20px 16px',
                      }}>
                        <textarea
                          ref={chatTextareaRef}
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendChatMessage()
                            }
                          }}
                          placeholder={l.placeholderFollowUp}
                          disabled={chatStreaming}
                          rows={1}
                          style={{
                            flex: 1, resize: 'none',
                            background: 'var(--fill-tertiary)',
                            border: '1px solid var(--separator)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            outline: 'none',
                            lineHeight: 1.4,
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={() => sendChatMessage()}
                          disabled={chatStreaming || !chatInput.trim()}
                          className="btn-ghost focus-ring"
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            cursor: chatStreaming || !chatInput.trim() ? 'not-allowed' : 'pointer',
                            opacity: chatStreaming || !chatInput.trim() ? 0.5 : 1,
                          }}
                        >
                          {l.send}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Most Expensive Crons ───────────────────────────── */}
            <TopCrons jobCosts={data.jobCosts} jobName={jobName} labels={{ mostExpensiveCrons: l.mostExpensiveCrons, avg: l.avg }} />

            {/* ── Charts row: daily cost + token donut ────────────── */}
            <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <DailyCostChart dailyCosts={data.dailyCosts} labels={{ dailyEstimatedCost: l.dailyEstimatedCost }} />
              <TokenDonut data={data} labels={{ tokenBreakdown: l.tokenBreakdown, total: l.total, input: l.input, output: l.output, cache: l.cache }} />
            </div>

            {/* ── Job cost table ──────────────────────────────────── */}
            <div style={{
              background: 'var(--material-regular)',
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div className="flex items-center" style={{
                padding: 'var(--space-2) var(--space-4)',
                borderBottom: '1px solid var(--separator)',
                fontSize: 'var(--text-caption1)',
                color: 'var(--text-tertiary)',
                fontWeight: 'var(--weight-medium)',
                gap: 'var(--space-3)',
              }}>
                <span style={{ flex: 2, minWidth: 0 }}>{l.job}</span>
                <span style={{ width: 50, textAlign: 'right' }}>{l.runs}</span>
                <span style={{ width: 80, textAlign: 'right' }}>{l.input}</span>
                <span style={{ width: 80, textAlign: 'right' }}>{l.output}</span>
                <span className="hidden-mobile" style={{ width: 80, textAlign: 'right' }}>{l.cache}</span>
                <span style={{ width: 80, textAlign: 'right' }}>{l.estCost}</span>
              </div>

              {data.jobCosts.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}>
                  {l.noJobsCostData}
                </div>
              ) : (
                data.jobCosts.map((job, i) => (
                  <div
                    key={job.jobId}
                    className="flex items-center"
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: i < data.jobCosts.length - 1 ? '1px solid var(--separator)' : undefined,
                      fontSize: 'var(--text-footnote)',
                      color: 'var(--text-primary)',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'var(--weight-medium)' }}>
                      {jobName(job.jobId)}
                    </span>
                    <span style={{ width: 50, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {job.runs}
                    </span>
                    <span style={{ width: 80, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTokens(job.totalInputTokens)}
                    </span>
                    <span style={{ width: 80, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTokens(job.totalOutputTokens)}
                    </span>
                    <span className="hidden-mobile" style={{ width: 80, textAlign: 'right', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTokens(job.totalCacheTokens)}
                    </span>
                    <span style={{ width: 80, textAlign: 'right', fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtCost(job.totalCost)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* ── Model breakdown (inline) ────────────────────────── */}
            {data.modelBreakdown.length > 0 && (
              <div style={{
                marginTop: 'var(--space-4)',
                display: 'flex',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                fontSize: 'var(--text-caption1)',
                color: 'var(--text-tertiary)',
              }}>
                {data.modelBreakdown.map(m => (
                  <span key={m.model}>
                    <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
                      {m.model}
                    </span>
                    {' '}
                    {m.pct.toFixed(0)}%
                  </span>
                ))}
              </div>
            )}

            {/* ── Per-run detail table ────────────────────────────── */}
            <RunDetailTable runCosts={data.runCosts} jobName={jobName} labels={{
              perRunDetail: l.perRunDetail,
              run: l.run,
              runs: l.runs,
              time: l.time,
              job: l.job,
              model: l.model,
              input: l.input,
              output: l.output,
              cache: l.cache,
              cost: l.cost,
              showAllRuns: l.showAllRuns,
            }} />
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .summary-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .top-crons-grid {
            grid-template-columns: 1fr !important;
          }
          .usage-row {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
