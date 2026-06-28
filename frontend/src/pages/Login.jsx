import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Sparkles, CheckCircle2, Clock, Brain, Shield, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Brain,
    color: 'purple',
    title: 'AI Task Prioritization',
    desc: 'Gemini 2.0 ranks your tasks by urgency, complexity, and impact',
  },
  {
    icon: Sparkles,
    color: 'blue',
    title: 'Auto Action Plans',
    desc: 'AI breaks down tasks into clear, actionable steps automatically',
  },
  {
    icon: Clock,
    color: 'orange',
    title: 'Smart Reminders',
    desc: 'Proactive nudges before deadlines — never miss a submission',
  },
  {
    icon: CheckCircle2,
    color: 'green',
    title: 'Gamified Productivity',
    desc: 'Earn XP, level up, build streaks, and unlock achievements',
  },
]

const colorMap = {
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Login() {
  const { signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background noise-overlay">
      {/* Animated Background Orbs */}
      <div className="orb orb-purple w-[500px] h-[500px] top-[10%] -left-[100px]" />
      <div className="orb orb-blue w-[400px] h-[400px] bottom-[10%] -right-[80px]" />
      <div className="orb orb-cyan w-[350px] h-[350px] top-[50%] left-[40%]" style={{ animationDelay: '4s' }} />

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)] pointer-events-none z-[1]" />

      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-6xl">
        {/* Left — Hero */}
        <motion.div
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center glow-purple-strong">
                <Zap size={32} className="text-white fill-white" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/40 animate-pulse-ring" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-white tracking-tight leading-tight">
              The Last-Minute<br />
              <span className="gradient-text-animated">Life Saver</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Your AI-powered productivity companion that doesn't just remind you —
            it <strong className="text-foreground">plans, prioritizes, and guides</strong> you to completion.
          </motion.p>

          {/* Feature Cards */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color]
              return (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="flex items-start gap-4 p-4 rounded-xl glass-card card-hover cursor-default group"
                >
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 border ${colors.border} transition-transform group-hover:scale-110`}>
                    <feature.icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-[14px] text-foreground mb-0.5">{feature.title}</strong>
                    <span className="text-[12px] text-muted-foreground leading-snug">{feature.desc}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Powered By Badge */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest glass-light px-4 py-2 rounded-full"
          >
            <Shield size={14} />
            <span>Powered by Google Gemini 2.0 Flash</span>
          </motion.div>
        </motion.div>

        {/* Right — Sign In Card */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass-strong border-border/30 shadow-2xl p-2 relative overflow-hidden">
            {/* Animated top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 opacity-80" />

            <CardHeader className="text-center pb-6 pt-8">
              <CardTitle className="text-2xl font-heading">Get Started</CardTitle>
              <CardDescription className="text-[15px]">Sign in to start crushing your deadlines</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base font-semibold bg-background/50 hover:bg-muted border-border/50 flex items-center justify-center gap-3 relative overflow-hidden group transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(124,111,255,0.1)]"
                onClick={handleGoogleSignIn}
                disabled={loading}
                id="google-sign-in-btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <svg viewBox="0 0 24 24" width="22" height="22" className="relative z-10">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="relative z-10">Continue with Google</span>
                <ArrowRight size={16} className="relative z-10 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 -ml-2 group-hover:ml-0" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/80 px-3 text-muted-foreground font-semibold tracking-wider">Why Google Sign-In?</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  'One-click secure authentication',
                  'Sync with Google Calendar',
                  'Your data stays private & encrypted',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                    className="flex items-center gap-3 text-[13px] text-muted-foreground glass-light p-3 rounded-lg"
                  >
                    <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
                    <span>{text}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-[12px] text-center text-muted-foreground/60 mt-1">
                By signing in, you agree to let AI help you be more productive ✨
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
