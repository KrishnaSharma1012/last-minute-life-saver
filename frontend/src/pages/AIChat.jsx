import { Sparkles, Send, Mic, MicOff, Lightbulb, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import './AIChat.css'

const SUGGESTED_PROMPTS = [
  "What should I work on right now?",
  "Plan my day for maximum productivity",
  "Break down my highest priority task into steps",
  "How can I improve my completion rate?",
  "Give me a quick motivational boost",
]

export default function AIChat() {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.displayName?.split(' ')[0] || 'there'}! 👋 I'm your AI productivity companion powered by **Gemini 2.0**. I can help you prioritize tasks, plan your day, break down complex projects, and keep you on track. What would you like to work on?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build context about user's tasks for AI
  const buildTaskContext = async () => {
    if (!user) return ''
    try {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('status', 'in', ['pending', 'in-progress']),
      )
      const snap = await getDocs(q)
      const tasks = snap.docs.map(d => d.data())

      if (tasks.length === 0) return '\n\nUser has no active tasks.'

      const taskSummary = tasks
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
        .slice(0, 5)
        .map(t => `- "${t.title}" (${t.priority}, ~${t.estimatedHours || 1}h, deadline: ${t.deadline})`)
        .join('\n')

      return `\n\nUser's active tasks (sorted by priority):\n${taskSummary}\nUser's XP: ${userProfile?.xp || 0}, Level: ${userProfile?.level || 1}, Streak: ${userProfile?.streakDays || 0} days`
    } catch {
      return ''
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    const messageText = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Build context from user's actual tasks
      const taskContext = await buildTaskContext()

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText + taskContext,
          history: messages.slice(-10),
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || "I'm having trouble connecting right now. Please make sure the backend server is running on port 5000.",
        timestamp: new Date(),
      }])
    } catch {
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

  // Voice input
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('')
      setInput(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  // Simple markdown-like rendering
  const renderContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')
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
              <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
              <span className="msg-time">
                {msg.timestamp instanceof Date
                  ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''}
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
            <button
              className={`btn-ghost btn-icon chat-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              title="Voice input"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              id="ai-send-btn"
            >
              {isLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
