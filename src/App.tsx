 import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

type Profile = {
  id: string
  email: string | null
  role: 'user' | 'admin'
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (!session) {
        setProfile(null)
        setLoading(false)
      } else {
        loadProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    setSession(session)

    if (session) {
      await loadProfile(session.user.id)
    } else {
      setLoading(false)
    }
  }

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error(error)
      setProfile(null)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Account created. Agar email confirmation enabled hai to apni email verify karein.'
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      }
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setEmail('')
    setPassword('')
    setMessage('')
  }

  if (loading) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
        </div>
      </main>
    )
  }

  if (session && profile) {
    return (
      <main className="dashboard">
        <div className="dashboard-card">
          <div className="top-bar">
            <div>
              <h1>{profile.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}</h1>
              <p>{profile.email}</p>
            </div>

            <button onClick={logout}>Logout</button>
          </div>

          {profile.role === 'admin' ? (
            <section>
              <h2>Welcome, Admin 👑</h2>
              <p>You have administrator access.</p>

              <div className="dashboard-box">
                <h3>Admin Area</h3>
                <p>User management and website controls yahan add kiye ja sakte hain.</p>
              </div>
            </section>
          ) : (
            <section>
              <h2>Welcome, User 👋</h2>
              <p>Aap successfully login ho gaye hain.</p>

              <div className="dashboard-box">
                <h3>Your Tools</h3>
                <p>Aapke website tools yahan show kiye ja sakte hain.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>ToolMaster Pro</h1>

        <p className="subtitle">
          {isAdminLogin ? 'Admin Login' : isSignup ? 'Create Account' : 'User Login'}
        </p>

        <div className="mode-buttons">
          <button
            type="button"
            className={!isAdminLogin ? 'active' : ''}
            onClick={() => {
              setIsAdminLogin(false)
              setIsSignup(false)
              setMessage('')
            }}
          >
            User Login
          </button>

          <button
            type="button"
            className={isAdminLogin ? 'active' : ''}
            onClick={() => {
              setIsAdminLogin(true)
              setIsSignup(false)
              setMessage('')
            }}
          >
            Admin Login
          </button>
        </div>

        {!isAdminLogin && (
          <button
            type="button"
            className="signup-toggle"
            onClick={() => {
              setIsSignup(!isSignup)
              setMessage('')
            }}
          >
            {isSignup ? 'Already have an account? Login' : 'Create new account'}
          </button>
        )}

        <form onSubmit={handleAuth}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isSignup
                ? 'Create Account'
                : isAdminLogin
                  ? 'Admin Login'
                  : 'Login'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </main>
  )
}

export default App
