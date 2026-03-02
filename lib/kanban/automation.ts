'use client'

import type { KanbanTicket, TeamRole } from './types'

/* ── Role-specific work prompts ──────────────────────── */

const ROLE_PROMPTS: Record<TeamRole, string> = {
  'lead-dev': `You are working this ticket as the Lead Dev. Provide:
1. Technical breakdown of the work needed
2. Implementation plan with clear steps
3. Key technical decisions or trade-offs
4. Dependencies or blockers to flag

Be specific and actionable. Reference concrete files, APIs, or patterns where relevant.`,

  'ux-ui': `You are working this ticket as the UX/UI Lead. Provide:
1. Design review and recommendations
2. User flow walkthrough
3. Accessibility considerations (WCAG)
4. Visual/interaction suggestions

Focus on the user experience. Call out any usability concerns or improvements.`,

  'qa': `You are working this ticket as QA. Provide:
1. Test scenarios (happy path + edge cases)
2. Acceptance criteria checklist
3. Potential regression areas
4. Edge cases and boundary conditions to verify

Be thorough. Think about what could break and how to verify it works.`,
}

const FALLBACK_PROMPT = `You are working this ticket. Provide:
1. Analysis of what needs to be done
2. Recommended approach
3. Key considerations or risks
4. Next steps

Be concise and actionable.`

export function getWorkPrompt(ticket: KanbanTicket): string {
  const rolePrompt = ticket.assigneeRole
    ? ROLE_PROMPTS[ticket.assigneeRole] ?? FALLBACK_PROMPT
    : FALLBACK_PROMPT

  return `${rolePrompt}

Ticket: ${ticket.title}
${ticket.description ? `Description: ${ticket.description}` : 'No description provided.'}
Priority: ${ticket.priority}`
}

/* ── Execute work via chat API ───────────────────────── */

interface WorkResult {
  success: boolean
  content: string
  error?: string
}

export async function executeWork(
  agentId: string,
  ticket: KanbanTicket,
  onChunk?: (chunk: string) => void,
): Promise<WorkResult> {
  const prompt = getWorkPrompt(ticket)

  try {
    const res = await fetch(`/api/kanban/chat/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        ticket: {
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          assigneeRole: ticket.assigneeRole,
        },
      }),
    })

    if (!res.ok || !res.body) {
      return { success: false, content: '', error: `API error: ${res.status}` }
    }

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
              onChunk?.(chunk.content)
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    }

    if (!fullContent) {
      return { success: false, content: '', error: 'Empty response from agent' }
    }

    return { success: true, content: fullContent }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, content: '', error: message }
  }
}

/* ── Persist work chat to localStorage ───────────────── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function persistWorkChat(
  ticketId: string,
  prompt: string,
  response: string,
): void {
  if (typeof window === 'undefined') return

  const key = `manor-kanban-chat-${ticketId}`
  let existing: ChatMessage[] = []

  try {
    const raw = localStorage.getItem(key)
    if (raw) existing = JSON.parse(raw)
  } catch { /* start fresh */ }

  const now = Date.now()
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: prompt,
    timestamp: now,
  }
  const assistantMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: response,
    timestamp: now + 1,
  }

  try {
    localStorage.setItem(key, JSON.stringify([...existing, userMsg, assistantMsg]))
  } catch { /* storage full */ }
}
