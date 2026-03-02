'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Agent } from '@/lib/types'
import type { KanbanTicket, TicketStatus, TicketPriority, TeamRole } from '@/lib/kanban/types'
import {
  loadTickets,
  saveTickets,
  createTicket,
  updateTicket,
  moveTicket,
  deleteTicket,
  type KanbanStore,
} from '@/lib/kanban/store'
import { useAgentWork } from '@/lib/kanban/useAgentWork'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CreateTicketModal } from '@/components/kanban/CreateTicketModal'
import { TicketDetailPanel } from '@/components/kanban/TicketDetailPanel'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'

export default function KanbanPage() {
  const [tickets, setTickets] = useState<KanbanStore>({})
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<KanbanTicket | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)

    // Load tickets from localStorage
    const stored = loadTickets()
    setTickets(stored)

    // Load agents from API
    fetch('/api/agents')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch agents')
        return r.json()
      })
      .then((a: Agent[]) => setAgents(a))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Persist tickets whenever they change
  useEffect(() => {
    if (!loading) {
      saveTickets(tickets)
    }
  }, [tickets, loading])

  // Keep selectedTicket in sync with store
  useEffect(() => {
    if (selectedTicket && tickets[selectedTicket.id]) {
      const current = tickets[selectedTicket.id]
      if (current.updatedAt !== selectedTicket.updatedAt) {
        setSelectedTicket(current)
      }
    }
  }, [tickets, selectedTicket])

  function handleCreateTicket(data: {
    title: string
    description: string
    priority: TicketPriority
    assigneeId: string | null
    assigneeRole: TeamRole | null
  }) {
    setTickets((prev) =>
      createTicket(prev, {
        ...data,
        status: 'backlog',
      }),
    )
  }

  function handleMoveTicket(ticketId: string, status: TicketStatus) {
    setTickets((prev) => moveTicket(prev, ticketId, status))
  }

  function handleDeleteTicket(ticketId: string) {
    setTickets((prev) => deleteTicket(prev, ticketId))
    setSelectedTicket(null)
  }

  const handleUpdateTicket = useCallback(
    (ticketId: string, updates: Partial<KanbanTicket>) => {
      setTickets((prev) => updateTicket(prev, ticketId, updates))
    },
    [],
  )

  const { isWorking } = useAgentWork({
    tickets,
    onUpdateTicket: handleUpdateTicket,
  })

  function handleRetryWork(ticketId: string) {
    setTickets((prev) =>
      updateTicket(prev, ticketId, {
        status: 'todo',
        workState: 'idle',
        workError: null,
        workStartedAt: null,
      }),
    )
  }

  function handleTicketClick(ticket: KanbanTicket) {
    setSelectedTicket(ticket)
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  const selectedAgent = selectedTicket?.assigneeId
    ? agents.find((a) => a.id === selectedTicket.assigneeId) ?? null
    : null

  const ticketCount = Object.keys(tickets).length

  return (
    <div className="flex h-full relative" style={{ background: 'var(--bg)' }}>
      {/* Board area */}
      <div className="flex-1 h-full flex flex-col" style={{ minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid var(--separator)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'var(--text-title2)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Kanban Board
            </h1>
            <p
              style={{
                fontSize: 'var(--text-caption1)',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0',
              }}
            >
              {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary focus-ring"
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: 'var(--text-footnote)',
              fontWeight: 'var(--weight-semibold)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            + New Ticket
          </button>
        </div>

        {/* Board */}
        <div style={{ flex: 1, padding: '0 var(--space-3)', minHeight: 0 }}>
          {loading ? (
            <div
              className="flex gap-3 h-full"
              style={{ padding: 'var(--space-4) 0' }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ flex: '1 0 200px' }}>
                  <Skeleton
                    width="100%"
                    height="100%"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              tickets={tickets}
              agents={agents}
              onTicketClick={handleTicketClick}
              onMoveTicket={handleMoveTicket}
              onCreateTicket={() => setCreateOpen(true)}
              isWorking={isWorking}
            />
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedTicket(null)}
        />
      )}

      {/* Detail panel */}
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          agent={selectedAgent}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={(status) => handleMoveTicket(selectedTicket.id, status)}
          onDelete={() => handleDeleteTicket(selectedTicket.id)}
          onRetryWork={() => handleRetryWork(selectedTicket.id)}
        />
      )}

      {/* Create ticket modal */}
      <CreateTicketModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        agents={agents}
        onSubmit={handleCreateTicket}
      />
    </div>
  )
}
