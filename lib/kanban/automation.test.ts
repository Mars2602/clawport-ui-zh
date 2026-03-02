import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getWorkPrompt, executeWork, persistWorkChat } from './automation'
import type { KanbanTicket } from './types'

/* ── Helpers ─────────────────────────────────────────── */

function makeTicket(overrides: Partial<KanbanTicket> = {}): KanbanTicket {
  return {
    id: 'ticket-1',
    title: 'Build login page',
    description: 'Implement login with email/password',
    status: 'todo',
    priority: 'high',
    assigneeId: 'agent-1',
    assigneeRole: 'lead-dev',
    workState: 'idle',
    workStartedAt: null,
    workError: null,
    workResult: null,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

// Mock localStorage
const storage: Record<string, string> = {}
beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, val: string) => { storage[key] = val },
    removeItem: (key: string) => { delete storage[key] },
  })
})

// Mock crypto.randomUUID
beforeEach(() => {
  let counter = 0
  vi.stubGlobal('crypto', {
    randomUUID: () => `test-uuid-${++counter}`,
  })
})

/* ── getWorkPrompt ───────────────────────────────────── */

describe('getWorkPrompt', () => {
  it('returns lead-dev prompt for lead-dev role', () => {
    const prompt = getWorkPrompt(makeTicket({ assigneeRole: 'lead-dev' }))
    expect(prompt).toContain('Lead Dev')
    expect(prompt).toContain('Technical breakdown')
    expect(prompt).toContain('Implementation plan')
    expect(prompt).toContain('Build login page')
  })

  it('returns ux-ui prompt for ux-ui role', () => {
    const prompt = getWorkPrompt(makeTicket({ assigneeRole: 'ux-ui' }))
    expect(prompt).toContain('UX/UI Lead')
    expect(prompt).toContain('Design review')
    expect(prompt).toContain('Accessibility')
  })

  it('returns qa prompt for qa role', () => {
    const prompt = getWorkPrompt(makeTicket({ assigneeRole: 'qa' }))
    expect(prompt).toContain('QA')
    expect(prompt).toContain('Test scenarios')
    expect(prompt).toContain('Acceptance criteria')
  })

  it('returns fallback prompt when no role assigned', () => {
    const prompt = getWorkPrompt(makeTicket({ assigneeRole: null }))
    expect(prompt).toContain('Analysis of what needs to be done')
    expect(prompt).toContain('Build login page')
  })

  it('includes ticket description when present', () => {
    const prompt = getWorkPrompt(makeTicket({ description: 'Custom desc' }))
    expect(prompt).toContain('Description: Custom desc')
  })

  it('handles empty description', () => {
    const prompt = getWorkPrompt(makeTicket({ description: '' }))
    expect(prompt).toContain('No description provided')
  })
})

/* ── executeWork ─────────────────────────────────────── */

describe('executeWork', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns success with streamed content', async () => {
    const sseData = [
      'data: {"content":"Hello "}\n\n',
      'data: {"content":"world"}\n\n',
      'data: [DONE]\n\n',
    ].join('')

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData))
        controller.close()
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }))

    const result = await executeWork('agent-1', makeTicket())
    expect(result.success).toBe(true)
    expect(result.content).toBe('Hello world')
  })

  it('calls onChunk for each SSE chunk', async () => {
    const sseData = 'data: {"content":"A"}\n\ndata: {"content":"B"}\n\ndata: [DONE]\n\n'

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData))
        controller.close()
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }))

    const chunks: string[] = []
    await executeWork('agent-1', makeTicket(), (c) => chunks.push(c))
    expect(chunks).toEqual(['A', 'B'])
  })

  it('returns error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    }))

    const result = await executeWork('agent-1', makeTicket())
    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
  })

  it('returns error on empty response', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }))

    const result = await executeWork('agent-1', makeTicket())
    expect(result.success).toBe(false)
    expect(result.error).toContain('Empty response')
  })

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))

    const result = await executeWork('agent-1', makeTicket())
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network down')
  })

  it('skips malformed SSE chunks gracefully', async () => {
    const sseData = 'data: {"content":"Good"}\n\ndata: not-json\n\ndata: {"content":"Also good"}\n\ndata: [DONE]\n\n'

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData))
        controller.close()
      },
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }))

    const result = await executeWork('agent-1', makeTicket())
    expect(result.success).toBe(true)
    expect(result.content).toBe('GoodAlso good')
  })
})

/* ── persistWorkChat ─────────────────────────────────── */

describe('persistWorkChat', () => {
  it('saves prompt and response to localStorage', () => {
    persistWorkChat('ticket-1', 'Do the work', 'Here is the result')

    const stored = JSON.parse(storage['manor-kanban-chat-ticket-1'])
    expect(stored).toHaveLength(2)
    expect(stored[0].role).toBe('user')
    expect(stored[0].content).toBe('Do the work')
    expect(stored[1].role).toBe('assistant')
    expect(stored[1].content).toBe('Here is the result')
  })

  it('appends to existing chat history', () => {
    const existing = [
      { id: 'old-1', role: 'user', content: 'Previous', timestamp: 500 },
      { id: 'old-2', role: 'assistant', content: 'Previous reply', timestamp: 501 },
    ]
    storage['manor-kanban-chat-ticket-1'] = JSON.stringify(existing)

    persistWorkChat('ticket-1', 'New prompt', 'New response')

    const stored = JSON.parse(storage['manor-kanban-chat-ticket-1'])
    expect(stored).toHaveLength(4)
    expect(stored[0].content).toBe('Previous')
    expect(stored[2].content).toBe('New prompt')
    expect(stored[3].content).toBe('New response')
  })

  it('handles corrupted existing data gracefully', () => {
    storage['manor-kanban-chat-ticket-1'] = 'not-json'

    persistWorkChat('ticket-1', 'Prompt', 'Response')

    const stored = JSON.parse(storage['manor-kanban-chat-ticket-1'])
    expect(stored).toHaveLength(2)
    expect(stored[0].content).toBe('Prompt')
  })

  it('generates unique IDs for messages', () => {
    persistWorkChat('ticket-1', 'Prompt', 'Response')

    const stored = JSON.parse(storage['manor-kanban-chat-ticket-1'])
    expect(stored[0].id).toBe('test-uuid-1')
    expect(stored[1].id).toBe('test-uuid-2')
  })
})
