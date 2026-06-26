import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Sparkles, CheckCircle2, Clock, Brain, Shield } from 'lucide-react'
import './Login.css'

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
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      <div className="login-container">
        {/* Left — Hero */}
        <div className="login-hero">
          <div className="login-logo animate-fade-up">
            <div className="login-logo-icon">
              <Zap size={28} />
            </div>
            <h1>The Last-Minute<br /><span className="gradient-text">Life Saver</span></h1>
          </div>

          <p className="login-subtitle animate-fade-up delay-1">
            Your AI-powered productivity companion that doesn't just remind you —
            it <strong>plans, prioritizes, and guides</strong> you to completion.
          </p>

          <div className="login-features animate-fade-up delay-2">
            <div className="login-feature">
              <div className="lf-icon">
                <Brain size={18} />
              </div>
              <div>
                <strong>AI Task Prioritization</strong>
                <span>Gemini 2.0 ranks your tasks by urgency</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="lf-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <strong>Auto Action Plans</strong>
                <span>AI breaks down tasks into clear steps</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="lf-icon">
                <Clock size={18} />
              </div>
              <div>
                <strong>Smart Reminders</strong>
                <span>Proactive nudges before deadlines</span>
              </div>
            </div>
            <div className="login-feature">
              <div className="lf-icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong>Gamified Productivity</strong>
                <span>Earn XP, level up, unlock badges</span>
              </div>
            </div>
          </div>

          <div className="login-powered animate-fade-up delay-3">
            <Shield size={14} />
            <span>Powered by Google Gemini 2.0 Flash • Built for Vibe2Ship 2026</span>
          </div>
        </div>

        {/* Right — Sign In Card */}
        <div className="login-card animate-fade-up delay-1">
          <div className="login-card-header">
            <h2>Get Started</h2>
            <p>Sign in to start crushing your deadlines</p>
          </div>

          <button
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            id="google-signin-btn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="login-divider">
            <span>Why Google Sign-In?</span>
          </div>

          <div className="login-benefits">
            <div className="login-benefit">
              <CheckCircle2 size={14} />
              <span>One-click secure authentication</span>
            </div>
            <div className="login-benefit">
              <CheckCircle2 size={14} />
              <span>Sync with Google Calendar</span>
            </div>
            <div className="login-benefit">
              <CheckCircle2 size={14} />
              <span>Your data stays private & encrypted</span>
            </div>
          </div>

          <p className="login-footer-text">
            By signing in, you agree to let AI help you be more productive ✨
          </p>
        </div>
      </div>
    </div>
  )
}
