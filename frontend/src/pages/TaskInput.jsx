import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Sparkles, Clock, Tag, ArrowRight,
  CheckCircle2, Loader2, Zap
} from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { addDemoTask } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function TaskInput() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [taskText, setTaskText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const recognitionRef = useRef(null)

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setTaskText(transcript)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Voice recognition failed. Try again.')
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
    toast.success('🎙️ Listening...')
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const processWithAI = async () => {
    if (!taskText.trim()) return
    setIsProcessing(true)

    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskText.trim() }),
      })

      if (!response.ok) throw new Error('AI processing failed')
      const data = await response.json()
      setAiResult(data.task)
      toast.success('✨ AI processed your task!')
    } catch {
      // Fallback — use Gemini-style smart defaults
      const words = taskText.trim().split(' ')
      const hasUrgent = /urgent|asap|immediately|deadline|due|today|tonight/i.test(taskText)
      const hasTomorrow = /tomorrow/i.test(taskText)

      setAiResult({
        title: taskText.trim().slice(0, 80),
        priority: hasUrgent ? 'critical' : hasTomorrow ? 'high' : 'medium',
        priorityScore: hasUrgent ? 90 : hasTomorrow ? 75 : 50,
        deadline: hasUrgent ? 'Today, 11:59 PM' : hasTomorrow ? 'Tomorrow, 5:00 PM' : 'In 3 days',
        estimatedHours: Math.max(1, Math.min(words.length / 5, 4)),
        category: 'Work',
        actionSteps: [
          'Break down the main objective',
          'Gather necessary resources',
          'Complete the core work',
          'Review and finalize',
        ],
      })
      toast.info('⚡ Using smart defaults (backend offline)')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveTask = async () => {
    if (!aiResult || !user) return
    setIsSaving(true)

    try {
      // Parse deadline string to a Date
      let deadlineDate
      try {
        if (aiResult.deadline.toLowerCase().includes('today')) {
          deadlineDate = new Date()
          deadlineDate.setHours(23, 59, 0, 0)
        } else if (aiResult.deadline.toLowerCase().includes('tomorrow')) {
          deadlineDate = new Date()
          deadlineDate.setDate(deadlineDate.getDate() + 1)
          deadlineDate.setHours(17, 0, 0, 0)
        } else {
          deadlineDate = new Date(aiResult.deadline)
          if (isNaN(deadlineDate.getTime())) {
            deadlineDate = new Date()
            deadlineDate.setDate(deadlineDate.getDate() + 3)
          }
        }
      } catch {
        deadlineDate = new Date()
        deadlineDate.setDate(deadlineDate.getDate() + 3)
      }

      const taskData = {
        userId: user.uid,
        title: aiResult.title,
        description: taskText.trim(),
        deadline: deadlineDate.toISOString(),
        priority: aiResult.priority || 'medium',
        priorityScore: aiResult.priorityScore || 50,
        estimatedHours: aiResult.estimatedHours || 1,
        status: 'pending',
        category: aiResult.category || 'Work',
        actionSteps: aiResult.actionSteps || [],
        completedSteps: 0,
      }

      if (isDemoMode) {
        addDemoTask(taskData)
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          createdAt: serverTimestamp(),
        })
      }

      toast.success('🎉 Task saved! Check your dashboard.')
      navigate('/')
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Failed to save task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const priorityColors = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    high: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20',
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] gap-8 max-w-3xl mx-auto w-full px-4"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20 glow-purple animate-float">
            <Zap size={32} className="text-purple-400" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/20 animate-pulse-ring" />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-heading mb-2">Add New Task</h2>
          <p className="text-muted-foreground text-base">Type or speak your task — AI will handle the rest</p>
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div variants={fadeUp} className="w-full">
        <Card className="glass-strong border-white/[0.06] shadow-2xl overflow-hidden relative">
          {isListening && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 origin-left"
            />
          )}
          {isProcessing && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          )}
          <CardContent className="p-6">
            <div className="relative">
              <Textarea
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="e.g., Finish the marketing report by tomorrow 5pm, its urgent"
                className="min-h-[120px] text-base glass-light border-white/[0.06] resize-none focus-visible:ring-purple-500/30 focus-visible:border-purple-500/20 placeholder:text-muted-foreground/30 transition-all"
                id="task-text-input"
              />
              {isListening && (
                <div className="absolute top-3 right-3 flex items-center gap-2 text-red-400 text-xs font-semibold animate-pulse glass px-3 py-1.5 rounded-full border border-red-500/20">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  Listening...
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <Button
                variant={isListening ? "destructive" : "outline"}
                className={cn(
                  "w-full sm:w-auto gap-2 transition-all duration-300 glass-light border-white/[0.06] hover:border-white/[0.1]",
                  isListening && "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 animate-pulse"
                )}
                onClick={isListening ? stopVoice : startVoice}
                id="voice-input-btn"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} className="text-purple-400" />}
                {isListening ? 'Stop Listening' : 'Use Voice Input'}
              </Button>
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2 shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/35 hover:-translate-y-0.5 group"
                onClick={processWithAI}
                disabled={!taskText.trim() || isProcessing}
                id="ai-process-btn"
              >
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                  <><Sparkles size={18} className="transition-transform group-hover:rotate-12" /> AI Process Task</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Result */}
      <AnimatePresence>
        {aiResult && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="glass-strong border-purple-500/15 shadow-2xl overflow-hidden relative">
              {/* Top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" />

              <CardHeader className="border-b border-white/[0.04] pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-heading">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                  AI-Processed Task
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col gap-1.5 md:col-span-2 glass-light p-4 rounded-xl"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Task Title</span>
                    <span className="text-lg font-bold">{aiResult.title}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col gap-1.5 glass-light p-4 rounded-xl"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-1.5"><Tag size={12} /> Priority</span>
                    <Badge
                      variant="outline"
                      className={cn("font-bold uppercase tracking-[0.12em] w-fit", priorityColors[aiResult.priority] || priorityColors.medium)}
                    >
                      {aiResult.priority} — Score {aiResult.priorityScore}
                    </Badge>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-1.5 glass-light p-4 rounded-xl"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-1.5"><Clock size={12} /> Deadline</span>
                    <span className="font-semibold">{aiResult.deadline}</span>
                  </motion.div>
                </div>

                {/* Action Steps */}
                {aiResult.actionSteps && aiResult.actionSteps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-3 mt-1"
                  >
                    <h4 className="font-bold flex items-center gap-2 font-heading text-[15px]">
                      <CheckCircle2 size={16} className="text-green-400" />
                      AI-Generated Action Plan
                    </h4>
                    <div className="flex flex-col gap-2">
                      {aiResult.actionSteps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.06 }}
                          className="flex items-start gap-3 glass-light p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-[10px] font-bold border border-purple-500/20">
                            {i + 1}
                          </div>
                          <span className="text-[13px] font-medium pt-0.5">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="pt-0 p-6">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2 shadow-lg shadow-purple-500/25 h-14 text-lg font-bold transition-all hover:shadow-purple-500/35 hover:-translate-y-0.5 group"
                  onClick={saveTask}
                  disabled={isSaving}
                  id="save-task-btn"
                >
                  {isSaving ? (
                    <><Loader2 size={20} className="animate-spin" /> Saving...</>
                  ) : (
                    <>Save Task <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
