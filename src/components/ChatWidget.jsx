import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Mic, Bot } from 'lucide-react'

function ChatWidget({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Hello! I am Ramon, CEO of Apex Collective. How can I help you today?', agent: { name: 'Ramon', emoji: '🦍' } }
  ])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')
    
    // Simulate agent response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'I understand. Let me process that for you.',
        agent: { name: 'Ramon', emoji: '🦍' }
      }])
    }, 1000)
  }

  const handleVoice = () => {
    setIsRecording(!isRecording)
    // Voice recording logic would go here
    alert('Voice recording feature - connect to n8n webhook for speech-to-text')
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-border z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Talk to Apex</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}>
              {msg.agent && (
                <div className="flex items-center gap-1 mb-1">
                  <span>{msg.agent.emoji}</span>
                  <span className="text-xs font-medium opacity-75">{msg.agent.name}</span>
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={handleVoice}
            className={`p-2 rounded-full transition-colors ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          <button
            onClick={handleSend}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary-400 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {isRecording && (
          <p className="text-xs text-red-500 mt-2 text-center">Recording... (connect to n8n)</p>
        )}
      </div>
    </div>
  )
}

export default ChatWidget
