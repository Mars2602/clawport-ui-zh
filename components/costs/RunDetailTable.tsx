'use client'

import { useState } from 'react'
import type { RunCost } from '@/lib/types'
import { fmtCost, fmtDate, fmtTokens } from './formatters'

interface RunDetailTableLabels {
  perRunDetail?: string
  run?: string
  runs?: string
  time?: string
  job?: string
  model?: string
  input?: string
  output?: string
  cache?: string
  cost?: string
  showAllRuns?: string
}

export function RunDetailTable({ runCosts, jobName, labels }: { runCosts: RunCost[]; jobName: (id: string) => string; labels?: RunDetailTableLabels }) {
  const l = {
    perRunDetail: labels?.perRunDetail ?? 'Per-Run Detail',
    run: labels?.run ?? 'run',
    runs: labels?.runs ?? 'runs',
    time: labels?.time ?? 'Time',
    job: labels?.job ?? 'Job',
    model: labels?.model ?? 'Model',
    input: labels?.input ?? 'Input',
    output: labels?.output ?? 'Output',
    cache: labels?.cache ?? 'Cache',
    cost: labels?.cost ?? 'Cost',
    showAllRuns: labels?.showAllRuns ?? 'Show all runs',
  }
  const [showAll, setShowAll] = useState(false)
  const sorted = [...runCosts].sort((a, b) => b.ts - a.ts)
  const visible = showAll ? sorted : sorted.slice(0, 50)
  const hasMore = sorted.length > 50

  if (sorted.length === 0) return null

  return (
    <div style={{
      background: 'var(--material-regular)',
      border: '1px solid var(--separator)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginTop: 'var(--space-4)',
    }}>
      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        borderBottom: '1px solid var(--separator)',
        fontSize: 'var(--text-caption1)',
        color: 'var(--text-tertiary)',
        fontWeight: 'var(--weight-medium)',
      }}>
        {l.perRunDetail} ({sorted.length} {sorted.length !== 1 ? l.runs : l.run})
      </div>

      {/* Header */}
      <div className="flex items-center run-detail-row" style={{
        padding: 'var(--space-2) var(--space-4)',
        borderBottom: '1px solid var(--separator)',
        fontSize: 'var(--text-caption1)',
        color: 'var(--text-tertiary)',
        fontWeight: 'var(--weight-medium)',
        gap: 'var(--space-3)',
      }}>
        <span style={{ width: 120, flexShrink: 0 }}>{l.time}</span>
        <span style={{ flex: 2, minWidth: 0 }}>{l.job}</span>
        <span className="hidden-mobile" style={{ width: 120 }}>{l.model}</span>
        <span style={{ width: 60, textAlign: 'right' }}>{l.input}</span>
        <span style={{ width: 60, textAlign: 'right' }}>{l.output}</span>
        <span className="hidden-mobile" style={{ width: 60, textAlign: 'right' }}>{l.cache}</span>
        <span style={{ width: 70, textAlign: 'right' }}>{l.cost}</span>
      </div>

      {/* Rows */}
      {visible.map((rc, i) => (
        <div
          key={`${rc.ts}-${rc.jobId}-${i}`}
          className="flex items-center run-detail-row"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderBottom: i < visible.length - 1 ? '1px solid var(--separator)' : undefined,
            fontSize: 'var(--text-footnote)',
            color: 'var(--text-primary)',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ width: 120, flexShrink: 0, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--text-caption1)' }}>
            {fmtDate(rc.ts)}
          </span>
          <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'var(--weight-medium)' }}>
            {jobName(rc.jobId)}
          </span>
          <span className="hidden-mobile" style={{ width: 120, color: 'var(--text-tertiary)', fontSize: 'var(--text-caption1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rc.model}
          </span>
          <span style={{ width: 60, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtTokens(rc.inputTokens)}
          </span>
          <span style={{ width: 60, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtTokens(rc.outputTokens)}
          </span>
          <span className="hidden-mobile" style={{ width: 60, textAlign: 'right', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtTokens(rc.cacheTokens)}
          </span>
          <span style={{ width: 70, textAlign: 'right', fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtCost(rc.minCost)}
          </span>
        </div>
      ))}

      {/* Show more */}
      {hasMore && !showAll && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              fontSize: 'var(--text-footnote)',
              color: 'var(--accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {l.showAllRuns} ({sorted.length})
          </button>
        </div>
      )}
    </div>
  )
}
