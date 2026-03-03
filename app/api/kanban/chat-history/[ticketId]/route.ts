import { NextRequest } from 'next/server'
import { getChatMessages, appendChatMessages, StoredChatMessage } from '@/lib/kanban/chat-store'
import { apiErrorResponse } from '@/lib/api-error'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params
    const messages = getChatMessages(ticketId)
    return Response.json(messages)
  } catch (err) {
    return apiErrorResponse(err, 'Failed to load chat history')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params
    const body = await req.json()
    const messages: StoredChatMessage[] = body.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 })
    }

    appendChatMessages(ticketId, messages)
    return Response.json({ ok: true })
  } catch (err) {
    return apiErrorResponse(err, 'Failed to save chat history')
  }
}
