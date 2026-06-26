import { Sparkles, Send, Mic, MicOff, Lightbulb, Loader2, Bot } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-purple-400">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto w-full gap-4">
      <Card className="flex flex-col h-full bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl animate-fade-up overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-border/50 py-4 px-6 bg-card/80">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Bot size={22} className="text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-heading">Gemini AI Assistant</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Powered by Gemini 2.0 Flash</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex w-full gap-3 animate-fade-up",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30 mt-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <Sparkles size={14} className="text-purple-400" />
                </div>
              )}
              
              <div className={cn(
                "flex flex-col max-w-[85%] md:max-w-[75%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-purple-600 text-white rounded-tr-sm" 
                    : "bg-background border border-border/50 text-foreground rounded-tl-sm"
                )}>
                  <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground mt-1.5 px-1">
                  {msg.timestamp instanceof Date
                    ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex w-full gap-3 justify-start animate-fade-up">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30 mt-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                <Sparkles size={14} className="text-purple-400" />
              </div>
              <div className="bg-background border border-border/50 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <CardFooter className="flex flex-col gap-3 p-4 bg-card/80 border-t border-border/50">
          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="w-full flex flex-col gap-2 mb-2 animate-fade-up">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                <Lightbulb size={12} className="text-yellow-500" />
                Try asking:
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button 
                    key={i} 
                    className="text-xs bg-background hover:bg-muted border border-border/50 px-3 py-1.5 rounded-full transition-colors text-foreground text-left"
                    onClick={() => handleSuggestion(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex w-full items-end gap-2 bg-background border border-border/50 p-2 rounded-xl focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your tasks..."
              className="border-0 focus-visible:ring-0 bg-transparent flex-1 h-auto py-2 text-base"
              id="ai-chat-input"
              autoComplete="off"
            />
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                  isListening && "text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600 animate-pulse"
                )}
                onClick={toggleVoice}
                title="Voice input"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                id="ai-send-btn"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
