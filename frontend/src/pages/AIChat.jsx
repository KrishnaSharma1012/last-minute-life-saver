import { Sparkles, Send, Mic, Lightbulb } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import './AIChat.css'

const SUGGESTED_PROMPTS = [
  "What should I work on right now?",
  "Plan my day for maximum productivity",
  "Break down my project report into steps",
  "How can I improve my completion rate?",
]

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey Krishna! 👋 I'm your AI productivity companion powered by **Gemini 2.0**. I can help you prioritize tasks, plan your day, break down complex projects, and keep you on track. What would you like to work on?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), history: messages }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "I'm having trouble connecting right now. Please make sure the backend server is running on port 5000.",
        timestamp: new Date(),
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ Couldn't reach the AI server. Make sure the backend is running with `npm run dev` in the `/backend` folder. I'll be ready to help once connected!",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestion = (prompt) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="ai-chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-ai-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>Gemini AI Assistant</h3>
            <span className="chat-status">
              <span className="status-dot"></span>
              Powered by Gemini 2.0 Flash
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar">
                <Sparkles size={14} />
              </div>
            )}
            <div className="msg-bubble">
              <p>{msg.content}</p>
              <span className="msg-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="msg-avatar">
              <Sparkles size={14} />
            </div>
            <div className="msg-bubble typing">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="chat-suggestions">
          <Lightbulb size={14} style={{ color: 'var(--yellow)' }} />
          <span className="suggestion-label">Try asking:</span>
          <div className="suggestion-chips">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button key={i} className="suggestion-chip" onClick={() => handleSuggestion(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your tasks..."
            className="chat-input"
            rows={1}
            id="ai-chat-input"
          />
          <div className="chat-input-actions">
            <button className="btn-ghost btn-icon chat-mic-btn" title="Voice input">
              <Mic size={18} />
            </button>
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              id="ai-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
