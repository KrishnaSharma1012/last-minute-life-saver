import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Bell, BellRing, Check, Volume2, VolumeX } from 'lucide-react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoTasks, updateDemoTask } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { requestFCMToken, onMessageListener } from '../services/fcmService'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AlarmSystem() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [notifiedTasks, setNotifiedTasks] = useState(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef(null)

  // Initialize audio and request notification permission
  useEffect(() => {
    // A high-quality futuristic notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    if (user) {
      requestFCMToken(user.uid);
      
      onMessageListener().then(payload => {
        toast.info('New Push Message: ' + payload?.notification?.title);
      }).catch(err => console.log('failed: ', err));
    }
  }, [user])

  // Fetch tasks
  useEffect(() => {
    if (!user) return

    if (isDemoMode) {
      const activeTasks = getDemoTasks('active')
      setTasks(activeTasks)
      
      const interval = setInterval(() => {
        setTasks(getDemoTasks('active'))
      }, 10000)
      return () => clearInterval(interval)
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'in-progress'])
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsubscribe()
  }, [user])

  const triggerAlarm = (task) => {
    if (notifiedTasks.has(task.id)) return

    // 1. Play Sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e))
    }

    // 2. Browser Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task Deadline Alert!', {
        body: `Time to focus on: ${task.title}`,
        icon: '/vite.svg'
      })
    }

    // 3. In-App Toast
    toast.custom((t) => (
      <div className="flex flex-col gap-3 p-4 bg-[#1e163b] border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] min-w-[320px]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30 animate-pulse">
            <BellRing size={20} className="text-red-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-red-400 font-heading">ALARM: Task Due!</span>
            <span className="text-sm font-semibold text-white/90 leading-snug">{task.title}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            className="flex-1 h-9 border-white/10 hover:bg-white/10"
            onClick={() => toast.dismiss(t)}
          >
            Snooze 5m
          </Button>
          <Button 
            className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white gap-2"
            onClick={async () => {
              if (isDemoMode) {
                updateDemoTask(task.id, { status: 'completed' })
              } else {
                await updateDoc(doc(db, 'tasks', task.id), { status: 'completed', completedAt: serverTimestamp() })
              }
              toast.dismiss(t)
              toast.success('Task marked as completed!')
            }}
          >
            <Check size={14} /> Done
          </Button>
        </div>
      </div>
    ), { duration: 15000, id: `alarm-${task.id}` })

    // Mark as notified
    setNotifiedTasks(prev => new Set([...prev, task.id]))
  }

  // Interval to check for due tasks
  useEffect(() => {
    if (tasks.length === 0) return

    const checkDeadlines = () => {
      const now = new Date()
      tasks.forEach(task => {
        if (!task.deadline) return
        
        const deadlineDate = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline)
        const timeDiffMs = deadlineDate.getTime() - now.getTime()
        
        // If deadline is passed or within 1 minute, and hasn't been notified yet
        if (timeDiffMs <= 60000 && !notifiedTasks.has(task.id)) {
          triggerAlarm(task)
        }
      })
    }

    const interval = setInterval(checkDeadlines, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [tasks, notifiedTasks, soundEnabled])

  // Fake demo alarm trigger
  const triggerDemoAlarm = () => {
    triggerAlarm({
      id: 'demo-alarm-' + Date.now(),
      title: 'Finish Hackathon Video Presentation',
      deadline: new Date()
    })
  }

  // Hidden floating widget for the hackathon demo
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-white/[0.05] border-white/10 backdrop-blur-md shadow-lg text-muted-foreground hover:text-white"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? "Mute Alarms" : "Unmute Alarms"}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </Button>
      
      <Button
        className="h-10 px-4 rounded-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold shadow-lg shadow-red-500/20 border border-white/10 backdrop-blur-md gap-2"
        onClick={triggerDemoAlarm}
      >
        <Bell size={16} />
        Test Alarm
      </Button>
    </div>
  )
}
