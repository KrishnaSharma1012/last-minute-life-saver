import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Sparkles, CheckCircle2, Clock, Brain, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:56px_56px] pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 max-w-6xl">
        {/* Left — Hero */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl animate-fade-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(124,111,255,0.4)]">
              <Zap size={32} className="text-white fill-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-white tracking-tight leading-tight">
              The Last-Minute<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Life Saver</span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground mb-12 animate-fade-up delay-100">
            Your AI-powered productivity companion that doesn't just remind you —
            it <strong className="text-foreground">plans, prioritizes, and guides</strong> you to completion.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full animate-fade-up delay-200 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Brain size={20} />
              </div>
              <div className="flex flex-col">
                <strong className="text-[15px] text-foreground mb-1">AI Task Prioritization</strong>
                <span className="text-[13px] text-muted-foreground">Gemini 2.0 ranks your tasks by urgency</span>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex flex-col">
                <strong className="text-[15px] text-foreground mb-1">Auto Action Plans</strong>
                <span className="text-[13px] text-muted-foreground">AI breaks down tasks into clear steps</span>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <strong className="text-[15px] text-foreground mb-1">Smart Reminders</strong>
                <span className="text-[13px] text-muted-foreground">Proactive nudges before deadlines</span>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex flex-col">
                <strong className="text-[15px] text-foreground mb-1">Gamified Productivity</strong>
                <span className="text-[13px] text-muted-foreground">Earn XP, level up, unlock badges</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-card/50 px-4 py-2 rounded-full border border-border animate-fade-up delay-300">
            <Shield size={14} />
            <span>Powered by Google Gemini 2.0 Flash</span>
          </div>
        </div>

        {/* Right — Sign In Card */}
        <div className="w-full max-w-md animate-fade-up delay-100">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl p-2">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription className="text-[15px]">Sign in to start crushing your deadlines</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 text-base font-semibold bg-background hover:bg-muted border-border flex items-center justify-center gap-3 relative overflow-hidden group"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg viewBox="0 0 24 24" width="22" height="22" className="relative z-10">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="relative z-10">Continue with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-semibold">Why Google Sign-In?</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[14px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                  <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                  <span>One-click secure authentication</span>
                </div>
                <div className="flex items-center gap-3 text-[14px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                  <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                  <span>Sync with Google Calendar</span>
                </div>
                <div className="flex items-center gap-3 text-[14px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                  <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                  <span>Your data stays private & encrypted</span>
                </div>
              </div>

              <p className="text-[13px] text-center text-muted-foreground mt-2">
                By signing in, you agree to let AI help you be more productive ✨
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
