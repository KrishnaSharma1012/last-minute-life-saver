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

/* ───────────────────────────────────────────
   ANIMATION VARIANTS
   ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

/* ───────────────────────────────────────────
   DESIGN TOKENS — Priority Colors
   ─────────────────────────────────────────── */
const priorityColors = {
  critical: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', gradient: 'from-red-500/20 to-rose-600/5', iconBg: 'bg-red-500/15', glow: 'shadow-red-500/20' },
  high: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', gradient: 'from-orange-500/20 to-pink-500/5', iconBg: 'bg-orange-500/15', glow: 'shadow-pink-500/10' },
  medium: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-amber-500/20 to-orange-500/5', iconBg: 'bg-amber-500/15', glow: 'shadow-orange-500/10' },
  low: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', gradient: 'from-emerald-500/20 to-green-500/5', iconBg: 'bg-emerald-500/15', glow: 'shadow-green-500/10' },
}

export default function TaskInput() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [taskText, setTaskText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [isFocused, setIsFocused] = useState(false)
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

  const pConfig = aiResult ? (priorityColors[aiResult.priority] || priorityColors.medium) : null;

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center w-full px-4">
      {/* ═══════════════════════════════════════════
          PREMIUM BACKGROUND EFFECTS
          ═══════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Ambient floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <motion.div
        className="flex flex-col items-center justify-center gap-8 max-w-3xl w-full"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
      >
        {/* ═══════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="flex flex-col items-center text-center gap-5 mt-8 md:mt-0">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-full opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20 relative z-10 backdrop-blur-md">
              <Zap size={30} className="text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            </div>
            
            <div className="absolute inset-0 rounded-2xl border border-purple-400/30 animate-ping opacity-20" style={{ animationDuration: '2.5s' }} />
          </div>
          <div>
            <h2 className="text-[32px] md:text-4xl font-bold font-heading mb-3 tracking-tight">
              <span className="text-white">Add New </span>
              <span className="gradient-text-animated">Task</span>
            </h2>
            <p className="text-muted-foreground/80 text-[15px] max-w-sm leading-relaxed">
              Type or speak your task — our <strong className="text-purple-300 font-medium">AI</strong> will handle the rest.
            </p>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            INPUT AREA
            ═══════════════════════════════════════════ */}
        <motion.div variants={fadeUp} className="w-full">
          <Card className={cn(
            "border-white/[0.06] shadow-2xl overflow-hidden relative transition-all duration-500",
            isFocused ? "glass-strong shadow-purple-900/20 border-purple-500/30" : "glass-card hover:border-white/[0.1] hover:shadow-black/40"
          )}>
            
            {/* Top gradient accent */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[2px] transition-all duration-500",
              isFocused ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" : "bg-gradient-to-r from-purple-500/40 to-transparent"
            )} />

            {/* Listening Progress Bar / AI Processing Shimmer */}
            {isListening && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 origin-left shadow-[0_0_12px_rgba(239,68,68,0.8)]"
              />
            )}
            {isProcessing && (
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 animate-shimmer shadow-[0_0_15px_rgba(124,111,255,0.6)]" style={{ backgroundSize: '200% 100%' }} />
            )}

            <CardContent className="p-6 md:p-8">
              <div className="relative group/textarea">
                <Textarea
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g., Finish the marketing report by tomorrow 5pm, it's urgent..."
                  className="min-h-[140px] text-[15px] leading-relaxed bg-white/[0.02] border-white/[0.05] group-hover/textarea:bg-white/[0.04] group-hover/textarea:border-white/[0.1] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-transparent focus-visible:bg-white/[0.03] placeholder:text-muted-foreground/30 transition-all rounded-xl p-5"
                  id="task-text-input"
                />
                
                {/* Focus indicator glow */}
                <div className={cn(
                  "absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 border",
                  isFocused ? "border-purple-500/30 shadow-[inset_0_0_20px_rgba(124,111,255,0.05)]" : "border-transparent"
                )} />

                {isListening && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 flex items-center gap-2 text-red-400 text-[11px] font-bold uppercase tracking-wider animate-pulse bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 backdrop-blur-md shadow-lg shadow-red-900/20"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Listening...
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    className={cn(
                      "w-full sm:w-auto gap-2.5 h-12 rounded-xl transition-all duration-300 font-semibold text-[13px] tracking-wide",
                      isListening 
                        ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-foreground/80 hover:text-foreground hover:shadow-lg"
                    )}
                    onClick={isListening ? stopVoice : startVoice}
                    id="voice-input-btn"
                  >
                    {isListening ? (
                      <><MicOff size={16} /> Stop Listening</>
                    ) : (
                      <><div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center"><Mic size={14} className="text-purple-400" /></div> Voice Input</>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Button
                    className={cn(
                      "w-full sm:w-auto relative h-12 px-6 rounded-xl text-white gap-2.5 shadow-xl transition-all group overflow-hidden font-bold text-[14px]",
                      (!taskText.trim() || isProcessing) ? "opacity-50 cursor-not-allowed bg-white/5 border border-white/10" : "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-500 shadow-purple-500/25 hover:shadow-purple-500/40"
                    )}
                    onClick={processWithAI}
                    disabled={!taskText.trim() || isProcessing}
                    id="ai-process-btn"
                  >
                    {!(!taskText.trim() || isProcessing) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                    
                    {isProcessing ? (
                      <><Loader2 size={16} className="animate-spin text-purple-300" /> <span className="text-purple-100">Processing...</span></>
                    ) : (
                      <><Sparkles size={16} className={cn("transition-transform group-hover:rotate-12", taskText.trim() ? "text-white" : "text-muted-foreground")} /> <span className="relative z-10">AI Process Task</span></>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════════════════════════════════════
            AI RESULT CARD
            ═══════════════════════════════════════════ */}
        <AnimatePresence>
          {aiResult && pConfig && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="glass-card border-white/[0.08] shadow-2xl overflow-hidden relative backdrop-blur-2xl">
                {/* Dynamic top gradient based on priority */}
                <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r", pConfig.gradient.replace('/20', '').replace('/5', ''))} />
                
                {/* Subtle ambient glow in background based on priority */}
                <div className={cn("absolute top-0 right-0 w-64 h-64 opacity-[0.03] bg-gradient-to-bl blur-[40px] pointer-events-none", pConfig.gradient.replace('/20', '').replace('/5', ''))} />

                <CardHeader className="border-b border-white/[0.04] pb-5 pt-6 px-6 md:px-8 relative z-10">
                  <CardTitle className="flex items-center gap-2.5 text-lg font-heading">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/20 shadow-inner shadow-purple-500/10">
                      <Sparkles size={16} className="text-purple-400" />
                    </div>
                    <span>AI-Processed Task</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 flex flex-col gap-6 relative z-10">
                  <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Title Box */}
                    <motion.div
                      variants={fadeUp}
                      className="flex flex-col gap-2 md:col-span-2 glass-light p-5 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 rounded-l-xl" />
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] ml-1">Task Title</span>
                      <span className="text-lg font-bold text-foreground/90 ml-1 leading-snug">{aiResult.title}</span>
                    </motion.div>

                    {/* Priority Box */}
                    <motion.div
                      variants={fadeUp}
                      className="flex flex-col gap-2 glass-light p-5 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors relative overflow-hidden group"
                    >
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", pConfig.gradient)} />
                      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-xl", pConfig.bg.replace('/10', ''))} />
                      <span className="relative z-10 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-1.5 ml-1">
                        <Tag size={12} className={pConfig.text} /> Priority
                      </span>
                      <div className="relative z-10 flex items-center gap-2 ml-1">
                        <Badge
                          variant="outline"
                          className={cn("font-bold uppercase tracking-[0.12em] shadow-sm text-[10px] py-0.5", pConfig.text, pConfig.bg, pConfig.border)}
                        >
                          {aiResult.priority}
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground/60">Score: {aiResult.priorityScore}</span>
                      </div>
                    </motion.div>

                    {/* Deadline Box */}
                    <motion.div
                      variants={fadeUp}
                      className="flex flex-col gap-2 glass-light p-5 rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 rounded-l-xl" />
                      <span className="relative z-10 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-1.5 ml-1">
                        <Clock size={12} className="text-blue-400" /> Deadline
                      </span>
                      <span className="relative z-10 font-bold text-foreground/90 ml-1">{aiResult.deadline}</span>
                    </motion.div>
                  </motion.div>

                  {/* Action Steps */}
                  {aiResult.actionSteps && aiResult.actionSteps.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="flex flex-col gap-4 mt-2"
                    >
                      <h4 className="font-bold flex items-center gap-2.5 font-heading text-[15px]">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                          <CheckCircle2 size={13} className="text-emerald-400" />
                        </div>
                        AI-Generated Action Plan
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        {aiResult.actionSteps.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.08 }}
                            className="flex items-start gap-3.5 bg-white/[0.015] border border-white/[0.03] p-3.5 rounded-xl hover:bg-white/[0.03] hover:border-white/[0.06] transition-all hover:shadow-lg hover:-translate-y-0.5 group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 text-[11px] font-bold border border-purple-500/20 shadow-inner group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                              {i + 1}
                            </div>
                            <span className="text-[13.5px] font-medium text-foreground/80 pt-1 leading-snug group-hover:text-foreground transition-colors">{step}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 p-6 md:p-8">
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-500 text-white gap-2.5 h-[56px] text-[15px] font-bold shadow-xl shadow-purple-500/25 transition-all hover:shadow-purple-500/40 group relative overflow-hidden rounded-xl"
                      onClick={saveTask}
                      disabled={isSaving}
                      id="save-task-btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {isSaving ? (
                        <><Loader2 size={18} className="animate-spin text-purple-200" /> <span className="relative z-10 text-purple-100">Saving Task...</span></>
                      ) : (
                        <><span className="relative z-10 tracking-wide">Save Task to Dashboard</span> <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" /></>
                      )}
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
