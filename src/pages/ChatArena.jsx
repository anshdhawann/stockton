import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, RefreshCw } from 'lucide-react'
import { getAgents, supabase } from '../utils/supabase'

function ChatArena() {
  const [messages, setMessages] = useState([])
  const [agents, setAgents] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
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
      setMessages(data || [])
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
      const filtered = (data || []).filter((agent) => agent.id && agent.id !== 'ansh')
      filtered.sort((a, b) =>
        getAgentMentionLabel(a).localeCompare(getAgentMentionLabel(b), undefined, { sensitivity: 'base' }),
      )
      setAgents(filtered)
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim()) return

    try {
      await supabase
        .from('chat_arena')
        .insert({
          agent_id: 'user',
          message_type: 'chat',
          content: input,
          priority: 3
        })
      
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Arena</h2>
          <p className="text-gray-500 mt-1">Real-time agent communication</p>
        </div>
        <button 
          onClick={loadData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-border p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-4 rounded-lg border ${getMessageStyle(msg.message_type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{msg.agents?.emoji || '👤'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {msg.agents?.name || msg.agent_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                    {msg.priority === 1 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Urgent</span>
                    )}
                  </div>
                  
                  <p className="text-gray-800">{msg.content}</p>
                  
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">Quick mentions:</span>
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => addMention(agent.id)}
            className="text-xs px-2 py-1 rounded-full border border-border bg-white hover:bg-gray-100 text-gray-700"
            title={`Mention ${agent.id}`}
          >
            {agent.emoji ? `${agent.emoji} ` : ''}@{getAgentMentionLabel(agent)}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send message to all agents..."
          className="flex-1 input"
        />
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
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
    if (cleaned) return cleaned
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

export default ChatArena
