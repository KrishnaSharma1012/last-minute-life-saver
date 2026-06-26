import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Sparkles, Clock, Tag, ArrowRight,
  CheckCircle2, Loader2, ChevronDown, Zap
} from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './TaskInput.css'

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
      toast('⚡ Using smart defaults (backend offline)', { icon: '⚠️' })
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

      await addDoc(collection(db, 'tasks'), {
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
        createdAt: serverTimestamp(),
      })

      toast.success('🎉 Task saved! Check your dashboard.')
      navigate('/')
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Failed to save task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="task-input-page">
      <div className="task-input-container">
        {/* Header */}
        <div className="ti-header animate-fade-up">
          <div className="ti-header-icon">
            <Zap size={22} />
          </div>
          <div>
            <h2>Add New Task</h2>
            <p>Type or speak your task — AI will handle the rest</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="ti-input-section animate-fade-up delay-1">
          <div className="ti-input-wrap">
            <textarea
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="e.g., Finish the marketing report by tomorrow 5pm, its urgent"
              className="ti-textarea"
              rows={3}
              id="task-text-input"
            />
            <div className="ti-input-actions">
              <button
                className={`ti-voice-btn ${isListening ? 'listening' : ''}`}
                onClick={isListening ? stopVoice : startVoice}
                id="voice-input-btn"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening ? 'Stop' : 'Voice'}
              </button>
              <button
                className="btn btn-primary"
                onClick={processWithAI}
                disabled={!taskText.trim() || isProcessing}
                id="ai-process-btn"
              >
                {isProcessing ? (
                  <><Loader2 size={16} className="spin" /> Processing...</>
                ) : (
                  <><Sparkles size={16} /> AI Process</>
                )}
              </button>
            </div>
          </div>
          {isListening && (
            <div className="listening-indicator">
              <span className="listening-dot"></span>
              Listening... speak your task
            </div>
          )}
        </div>

        {/* AI Result */}
        {aiResult && (
          <div className="ti-result animate-fade-up">
            <div className="ti-result-header">
              <Sparkles size={16} style={{ color: 'var(--purple)' }} />
              <span>AI-Processed Task</span>
            </div>

            <div className="ti-result-grid">
              <div className="ti-field">
                <label>Task Title</label>
                <div className="ti-field-value">{aiResult.title}</div>
              </div>
              <div className="ti-field">
                <label><Tag size={12} /> Priority</label>
                <div className="ti-field-value">
                  <span className={`badge badge-${aiResult.priority === 'high' ? 'pink' : aiResult.priority === 'critical' ? 'red' : 'orange'}`}>
                    {aiResult.priority?.toUpperCase()} — Score {aiResult.priorityScore}
                  </span>
                </div>
              </div>
              <div className="ti-field">
                <label><Clock size={12} /> Deadline</label>
                <div className="ti-field-value">{aiResult.deadline}</div>
              </div>
              <div className="ti-field">
                <label><Clock size={12} /> Estimated Time</label>
                <div className="ti-field-value">{aiResult.estimatedHours} hours</div>
              </div>
            </div>

            {/* Action Steps */}
            <div className="ti-steps">
              <h4>
                <CheckCircle2 size={14} style={{ color: 'var(--green)' }} />
                AI-Generated Action Plan
              </h4>
              <div className="ti-steps-list">
                {aiResult.actionSteps?.map((step, i) => (
                  <div key={i} className="ti-step-item">
                    <span className="ti-step-num">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg w-full"
              onClick={saveTask}
              disabled={isSaving}
              id="save-task-btn"
            >
              {isSaving ? (
                <><Loader2 size={18} className="spin" /> Saving...</>
              ) : (
                <>Save Task <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
