import React, { useState, useEffect, useMemo, useRef } from 'react'
import { MessageSquare, Send, RefreshCw, Reply, Activity } from 'lucide-react'
import { getAgents, supabase } from '../utils/supabase'

const STOCKTON_CHAT_WEBHOOK_URL =
  import.meta.env.VITE_STOCKTON_CHAT_WEBHOOK_URL ||
  'https://n8n.anshdhawan.cloud/webhook/stockton-chat-input'

function ChatArena() {
  const [messages, setMessages] = useState([])
  const [agents, setAgents] = useState([])
  const [input, setInput] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const aLabel = getAgentMentionLabel(a)
      const bLabel = getAgentMentionLabel(b)
      const byLabel = aLabel.localeCompare(bLabel, 'en', { sensitivity: 'base' })
      if (byLabel !== 0) return byLabel
      return String(a.id || '').localeCompare(String(b.id || ''), 'en', { sensitivity: 'base' })
    })
  }, [agents])

  function mergeMessages(existing, incoming) {
    const list = Array.isArray(incoming) ? incoming : [incoming]
    const map = new Map((existing || []).map((item) => [item.id, item]))
    for (const item of list) {
      if (!item || typeof item.id === 'undefined') continue
      map.set(item.id, { ...(map.get(item.id) || {}), ...item })
    }
    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime()
      const bTime = new Date(b.created_at || 0).getTime()
      return aTime - bTime
    })
  }

  useEffect(() => {
    loadData()
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('chat-arena')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_arena' 
      }, (payload) => {
        setMessages((prev) => mergeMessages(prev, payload.new))
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const subscription = supabase
      .channel('agents-realtime-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => {
        loadAgents()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadMessages()
    }, 5000)

    function onFocus() {
      loadMessages()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_arena')
        .select('*, agents(name, emoji)')
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (error) throw error
      setMessages((prev) => mergeMessages(prev, data || []))
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      await Promise.all([loadMessages(), loadAgents()])
    } finally {
      setLoading(false)
    }
  }

  async function loadAgents() {
    try {
      const data = await getAgents()
      setAgents((data || []).filter((agent) => agent.id && agent.id !== 'ansh'))
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return

    const message = input.trim()
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimisticRow = {
      id: optimisticId,
      message_id: optimisticId,
      content: message,
      agent_id: 'ansh',
      reply_to: replyTarget?.id || null,
      message_type: 'chat',
      status: 'active',
      created_at: new Date().toISOString(),
      context: null,
    }

    setMessages((prev) => [...prev, optimisticRow])
    setInput('')

    try {
      const response = await fetch(STOCKTON_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          agent_id: 'ansh',
          reply_to: replyTarget?.id || null,
          thread_id: 'stockton-chat',
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Webhook error ${response.status}: ${body.slice(0, 200)}`)
      }

      const inserted = await response.json()
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticId
            ? {
                ...msg,
                ...inserted,
                agents: { name: 'ansh', emoji: '👤' },
              }
            : msg,
        ),
      )
      setReplyTarget(null)
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic row on failure so UI stays accurate.
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      setInput(message)
    }
  }

  function setReplyForMessage(msg) {
    const agentId = String(msg.agent_id || '').trim()
    const displayName = formatAgentDisplayName(msg.agents?.name || msg.agent_id || 'agent')
    const mention = agentId ? `@${agentId}` : ''

    setReplyTarget({
      id: msg.id,
      agentId,
      displayName,
      preview: String(msg.content || '').slice(0, 80),
    })

    if (mention) {
      setInput((prev) => {
        const trimmed = prev.trim()
        if (!trimmed) return `${mention} `
        if (trimmed.toLowerCase().startsWith(`${mention.toLowerCase()} `)) return prev
        return `${mention} ${trimmed}`
      })
    }
    inputRef.current?.focus()
  }

  function addMention(agentId) {
    const mention = `@${agentId}`
    setInput((prev) => {
      const value = prev.trim()
      if (!value) return `${mention} `
      const needsSpace = /\s$/.test(prev)
      return `${prev}${needsSpace ? '' : ' '}${mention} `
    })
    inputRef.current?.focus()
  }

  const getMessageStyle = (type) => {
    switch (type) {
      case 'announcement':
        return 'bg-primary-50 border-primary-200 text-primary-800'
      case 'status':
        return 'bg-gray-50 border-gray-200'
      case 'task_complete':
        return 'bg-green-50 border-green-200'
      case 'alert':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const workingAgents = useMemo(() => {
    return (agents || [])
      .filter((agent) => {
        const status = String(agent?.status || '').toLowerCase()
        const task = String(agent?.current_task || '').trim()
        return status === 'busy' || task.length > 0
      })
      .sort((a, b) => {
        const aBusy = String(a?.status || '').toLowerCase() === 'busy' ? 0 : 1
        const bBusy = String(b?.status || '').toLowerCase() === 'busy' ? 0 : 1
        if (aBusy !== bBusy) return aBusy - bBusy
        return getAgentMentionLabel(a).localeCompare(getAgentMentionLabel(b), 'en', { sensitivity: 'base' })
      })
  }, [agents])

  function getAgentStatusStyle(status) {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'busy') return 'bg-red-100 text-red-700 border-red-200'
    if (normalized === 'active') return 'bg-green-100 text-green-700 border-green-200'
    if (normalized === 'idle') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100dvh-200px)] min-h-[520px] max-h-[900px] overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Chat Arena</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Real-time agent communication</p>
        </div>
        <button 
          onClick={loadData}
          className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 h-full grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        <div className="lg:col-span-8 xl:col-span-9 min-h-0 h-full flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 rounded-xl border border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-3 sm:p-4 rounded-lg border relative ${getMessageStyle(msg.message_type)}`}>
                  <button
                    type="button"
                    onClick={() => setReplyForMessage(msg)}
                    className="absolute top-3 right-3 p-1 rounded text-gray-800 hover:text-black hover:bg-gray-100"
                    title={`Reply to ${formatAgentDisplayName(msg.agents?.name || msg.agent_id || 'message')}`}
                    aria-label={`Reply to ${formatAgentDisplayName(msg.agents?.name || msg.agent_id || 'message')}`}
                  >
                    <Reply className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{msg.agents?.emoji || '👤'}</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1 pr-8 sm:pr-0">
                        <span className="font-semibold text-sm sm:text-base text-gray-900">
                          {formatAgentDisplayName(msg.agents?.name || msg.agent_id)}
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                        {msg.priority === 1 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Urgent</span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-800 break-words">{msg.content}</p>

                      {msg.context && Object.keys(msg.context).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 bg-white/50 p-2 rounded">
                          <pre>{JSON.stringify(msg.context, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Agent quick mentions */}
          <div className="mt-3 space-y-2">
            <span className="block text-xs font-medium text-gray-500">Quick mentions:</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedAgents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => addMention(agent.id)}
                  className="shrink-0 text-xs px-2 py-1 rounded-full border border-border bg-white hover:bg-gray-100 text-gray-700"
                  title={`Mention ${agent.id}`}
                >
                  {agent.emoji ? `${agent.emoji} ` : ''}@{getAgentMentionLabel(agent)}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="mt-4 flex flex-col gap-2">
            {replyTarget && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs px-3 py-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-900">
                <span className="break-words">
                  Replying to <strong>{replyTarget.displayName}</strong>: "{replyTarget.preview}"
                </span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send message to all agents..."
                className="flex-1 input"
              />
              <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-4 xl:col-span-3 min-h-0 h-full overflow-hidden">
          <div className="card h-full max-h-[30vh] lg:max-h-none overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">Agents Working Now</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {workingAgents.length} agent{workingAgents.length === 1 ? '' : 's'} currently running tasks
            </p>

            {workingAgents.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-border rounded-lg p-3">
                No agents are actively working right now.
              </div>
            ) : (
              <div className="space-y-2">
                {workingAgents.map((agent) => (
                  <div key={agent.id} className="border border-border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {agent.emoji ? `${agent.emoji} ` : ''}
                        {formatAgentDisplayName(agent.name || agent.id)}
                      </p>
                      <span className={`text-[11px] px-2 py-0.5 rounded border capitalize ${getAgentStatusStyle(agent.status)}`}>
                        {agent.status || 'active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mt-2">
                      {String(agent.current_task || '').trim() || 'Working on assigned task'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function getAgentMentionLabel(agent) {
  const name = String(agent?.name || '').trim()
  if (name) {
    const cleaned = name
      .replace(/^[^A-Za-z0-9]+/, '')
      .split(' - ')[0]
      .trim()
    if (cleaned) return toTitleCase(cleaned.toLowerCase())
  }
  return toTitleCase(String(agent?.id || 'agent'))
}

function toTitleCase(value) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatAgentDisplayName(value) {
  const text = String(value || '').trim()
  if (!text) return 'Agent'
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default ChatArena
