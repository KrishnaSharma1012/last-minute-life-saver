import { Sparkles, Send, Mic, MicOff, Lightbulb, Loader2, Bot } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
      .replace(/`(.*?)`/g, '<code class="bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px] font-mono text-purple-400">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto w-full gap-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col h-full"
      >
        <Card className="flex flex-col h-full glass-strong border-white/[0.06] shadow-2xl overflow-hidden relative">
          {/* Subtle orb decoration */}
          <div className="absolute -top-20 -right-20 w-40 h-40 orb-purple opacity-20 pointer-events-none" />

          {/* Header */}
          <CardHeader className="border-b border-white/[0.04] py-4 px-6 glass relative z-10">
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 glow-purple">
                  <Bot size={20} className="text-purple-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold font-heading">Gemini AI Assistant</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Powered by Gemini 2.0 Flash</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "flex w-full gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 mt-1 glow-purple">
                      <Sparkles size={13} className="text-purple-400" />
                    </div>
                  )}

                  <div className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[75%]",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl text-[14px] leading-relaxed",
                      msg.role === 'user'
                        ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-md shadow-lg shadow-purple-500/20"
                        : "glass-card text-foreground rounded-tl-md"
                    )}>
                      <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground/40 mt-1.5 px-1">
                      {msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 mt-1 glow-purple">
                  <Sparkles size={13} className="text-purple-400" />
                </div>
                <div className="glass-card p-4 rounded-2xl rounded-tl-md flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <CardFooter className="flex flex-col gap-3 p-4 glass border-t border-white/[0.04]">
            {/* Suggestions */}
            <AnimatePresence>
              {messages.length <= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex flex-col gap-2 mb-1"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 ml-1">
                    <Lightbulb size={11} className="text-yellow-500" />
                    Try asking:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="text-[11px] glass-light hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] px-3 py-1.5 rounded-full transition-colors text-foreground/70 text-left"
                        onClick={() => handleSuggestion(prompt)}
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex w-full items-end gap-2 glass-light p-2 rounded-xl border border-white/[0.06] focus-within:border-purple-500/30 focus-within:shadow-[0_0_15px_rgba(124,111,255,0.08)] transition-all">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your tasks..."
                className="border-0 focus-visible:ring-0 bg-transparent flex-1 h-auto py-2 text-[14px] placeholder:text-muted-foreground/25"
                id="ai-chat-input"
                autoComplete="off"
              />
              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-9 h-9 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] transition-all",
                    isListening && "text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-500 animate-pulse"
                  )}
                  onClick={toggleVoice}
                  title="Voice input"
                >
                  {isListening ? <MicOff size={17} /> : <Mic size={17} />}
                </Button>
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/35"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  id="ai-send-btn"
                >
                  {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} className="ml-0.5" />}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
