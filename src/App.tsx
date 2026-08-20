import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { supabase } from './supabase'
import TextToVideo from './TextToVideo'
type Profile = {
  id: string
  email: string | null
  role: 'user' | 'admin'
  created_at: string
}

type Tool = {
  id: string
  name: string
  description: string | null
  url: string
  icon: string | null
  is_active: boolean
  created_at: string
}

type VideoPlan = {
  id: string
  name: string
  price: string
  credits: number
  quality: string
  description: string
  icon: string
  popular?: boolean
}

const VIDEO_PLANS: VideoPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    credits: 3,
    quality: '720p',
    description: 'Try AI video generation',
    icon: '🆓',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99/mo',
    credits: 30,
    quality: '1080p',
    description: 'More generations + HD',
    icon: '🔵',
  },
  {
    id: 'popular',
    name: 'Popular',
    price: '$19.99/mo',
    credits: 100,
    quality: '1080p',
    description: 'Best value for creators',
    icon: '⭐',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$39.99/mo',
    credits: 300,
    quality: '1080p',
    description: 'Highest limits + premium features',
    icon: '👑',
  },
]

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [users, setUsers] = useState<Profile[]>([])
  const [tools, setTools] = useState<Tool[]>([])

  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [toolsLoading, setToolsLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSignup, setIsSignup] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  const [activePage, setActivePage] = useState('dashboard')
  const [message, setMessage] = useState('')

  // Text-to-Video
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoStyle, setVideoStyle] = useState('Cinematic')
  const [videoDuration, setVideoDuration] = useState('5')
  const [videoRatio, setVideoRatio] = useState('16:9')
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [videoCredits, setVideoCredits] = useState(3)

  const [videoGenerating, setVideoGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function start() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setSession(data.session)

      if (data.session) {
        await loadProfile(data.session.user.id)
      } else {
        setLoading(false)
      }
    }

    start()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return

        setSession(currentSession)

        if (event === 'SIGNED_OUT' || !currentSession) {
          setProfile(null)
          setUsers([])
          setTools([])
          setLoading(false)
          return
        }

        setTimeout(() => {
          if (mounted && currentSession) {
            loadProfile(currentSession.user.id)
          }
        }, 0)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      setProfile(null)
      setLoading(false)
      return
    }

    if (!data) {
      setMessage('Profile not found. Please contact administrator.')
      setProfile(null)
      setLoading(false)
      return
    }

    setProfile(data as Profile)

    await loadTools()

    if (data.role === 'admin') {
      await loadUsers()
    }

    setLoading(false)
  }

  async function loadUsers() {
    setUsersLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setUsers([])
    } else {
      setUsers((data || []) as Profile[])
    }

    setUsersLoading(false)
  }

  async function loadTools() {
    setToolsLoading(true)

    const { data, error } = await supabase
      .from('tools')
      .select(
        'id, name, description, url, icon, is_active, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      setTools([])
    } else {
      setTools((data || []) as Tool[])
    }

    setToolsLoading(false)
  }

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    if (isSignup) {
      if (password.length < 6) {
        setMessage('Password must be at least 6 characters.')
        return
      }

      if (password !== confirmPassword) {
        setMessage('Passwords do not match.')
        return
      }

      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        await loadProfile(data.session.user.id)
      } else {
        setMessage(
          'Account created. Please verify your email and login.'
        )
        setLoading(false)
      }

      return
    }

    setLoading(true)

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setMessage('Login successful, but no session was created.')
      setLoading(false)
      return
    }

    setSession(data.session)
    await loadProfile(data.session.user.id)
  }

  async function logout() {
    await supabase.auth.signOut()

    setSession(null)
    setProfile(null)
    setUsers([])
    setTools([])

    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMessage('')
    setActivePage('dashboard')
  }

  function selectPlan(plan: VideoPlan) {
    setSelectedPlan(plan.id)
    setVideoCredits(plan.credits)
    setMessage(`${plan.name} plan selected.`)
  }

  async function generateVideo() {
    if (!videoPrompt.trim()) {
      setMessage('Please enter a video prompt.')
      return
    }

    if (videoCredits <= 0) {
      setMessage(
        'You have no video credits remaining. Please upgrade your plan.'
      )
      return
    }

    setVideoGenerating(true)
    setGeneratedVideo(null)
    setMessage('Preparing your video...')

    try {
      /*
       * IMPORTANT:
       * This is the frontend generation flow.
       * A real AI video API will be connected here.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      )

      setVideoCredits((current) => current - 1)

      setMessage(
        'Video request prepared successfully. Connect your AI video API to generate the real MP4.'
      )
    } catch {
      setMessage('Video generation failed.')
    } finally {
      setVideoGenerating(false)
    }
  }

  function downloadVideo() {
    if (!generatedVideo) {
      setMessage('No generated video is available yet.')
      return
    }

    const link = document.createElement('a')
    link.href = generatedVideo
    link.download = 'toolmaster-ai-video.mp4'
    link.target = '_blank'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h2>Loading ToolMaster Pro...</h2>
          <p className="subtitle">Please wait</p>
        </div>
      </main>
    )
  }

  if (!session || !profile) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h1>ToolMaster Pro</h1>

          <p className="subtitle">
            {isAdminLogin
              ? 'Admin Login'
              : isSignup
                ? 'Create Account'
                : 'User Login'}
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
                setIsSignup((value) => !value)
                setMessage('')
              }}
            >
              {isSignup
                ? 'Already have an account? Login'
                : 'Create new account'}
            </button>
          )}

          <form onSubmit={handleAuth}>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">
              {isSignup ? 'New Password' : 'Password'}
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {isSignup && (
              <>
                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  minLength={6}
                  required
                />
              </>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={
                loading ||
                (isSignup &&
                  password !== confirmPassword)
              }
            >
              {loading
                ? 'Please wait...'
                : isSignup
                  ? 'Create Account'
                  : isAdminLogin
                    ? 'Admin Login'
                    : 'Login'}
            </button>
          </form>

          {message && (
            <p className="message">{message}</p>
          )}
        </div>
      </main>
    )
  }

  // USER AREA

  if (profile.role !== 'admin') {
    return (
      <main className="user-dashboard">
        <div className="user-card">
          <div className="user-topbar">
            <div>
              <h1>ToolMaster Pro</h1>
              <p>{profile.email}</p>
            </div>

            <button onClick={logout}>Logout</button>
          </div>

          <div className="video-page">
            <h2>🎬 AI Text-to-Video</h2>

            <p>
              Turn your text prompt into an amazing video.
            </p>

            <div className="credits-box">
              🪙 Video Credits:
              <strong>{videoCredits}</strong>
            </div>

            <textarea
              value={videoPrompt}
              onChange={(e) =>
                setVideoPrompt(e.target.value)
              }
              placeholder="Describe the video you want to create..."
              rows={6}
            />

            <div className="video-options">
              <label>
                Style
                <select
                  value={videoStyle}
                  onChange={(e) =>
                    setVideoStyle(e.target.value)
                  }
                >
                  <option>Cinematic</option>
                  <option>Realistic</option>
                  <option>Anime</option>
                  <option>3D Animation</option>
                  <option>Cartoon</option>
                  <option>Documentary</option>
                </select>
              </label>

              <label>
                Duration
                <select
                  value={videoDuration}
                  onChange={(e) =>
                    setVideoDuration(e.target.value)
                  }
                >
                  <option value="5">5 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                </select>
              </label>

              <label>
                Aspect Ratio
                <select
                  value={videoRatio}
                  onChange={(e) =>
                    setVideoRatio(e.target.value)
                  }
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="1:1">1:1 Square</option>
                </select>
              </label>
            </div>

            <button
              className="submit-button"
              onClick={generateVideo}
              disabled={videoGenerating}
            >
              {videoGenerating
                ? 'Generating...'
                : '🎬 Generate Video'}
            </button>

            {generatedVideo && (
              <div className="generated-video">
                <h3>Generated Video</h3>

                <video
                  src={generatedVideo}
                  controls
                  playsInline
                />

                <button
                  className="submit-button"
                  onClick={downloadVideo}
                >
                  ⬇️ Download Video
                </button>
              </div>
            )}

            <h2 className="plans-title">
              Choose Your Plan
            </h2>

            <div className="plans-grid">
              {VIDEO_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={
                    plan.id === selectedPlan
                      ? 'plan-card selected'
                      : 'plan-card'
                  }
                >
                  {plan.popular && (
                    <div className="popular-badge">
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div className="plan-icon">
                    {plan.icon}
                  </div>

                  <h3>{plan.name}</h3>

                  <div className="plan-price">
                    {plan.price}
                  </div>

                  <p>{plan.description}</p>

                  <strong>
                    {plan.credits} video credits
                  </strong>

                  <p>Quality: {plan.quality}</p>

                  <button
                    onClick={() => selectPlan(plan)}
                  >
                    {plan.id === selectedPlan
                      ? '✓ Selected'
                      : 'Choose Plan'}
                  </button>
                </div>
              ))}
            </div>

            {message && (
              <p className="message">{message}</p>
            )}
          </div>
        </div>
      </main>
    )
  }

  // ADMIN AREA

  const totalUsers = users.length
  const totalAdmins = users.filter(
    (user) => user.role === 'admin'
  ).length
  const normalUsers = users.filter(
    (user) => user.role === 'user'
  ).length
  const activeTools = tools.filter(
    (tool) => tool.is_active
  ).length

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">TM</div>

          <div>
            <h2>ToolMaster</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav>
          <button
            className={
              activePage === 'dashboard'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('dashboard')}
          >
            🏠 Dashboard
          </button>

          <button
            className={
              activePage === 'videos'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('videos')}
          >
            🎬 Text-to-Video
          </button>

          <button
            className={
              activePage === 'plans'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('plans')}
          >
            💳 Plans
          </button>

          <button
            className={
              activePage === 'users'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('users')}
          >
            👥 Users
          </button>

          <button
            className={
              activePage === 'tools'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('tools')}
          >
            🛠️ Tools
          </button>

          <button
            className={
              activePage === 'statistics'
                ? 'nav-item active'
                : 'nav-item'
            }
            onClick={() => setActivePage('statistics')}
          >
            📊 Statistics
          </button>
        </nav>

        <button
          className="logout-button"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>
              {activePage === 'dashboard'
                ? 'Dashboard'
                : activePage === 'videos'
                  ? 'Text-to-Video'
                  : activePage === 'plans'
                    ? 'Video Plans'
                    : activePage === 'users'
                      ? 'Users'
                      : activePage === 'tools'
                        ? 'Tools'
                        : 'Statistics'}
            </h1>

            <p>{profile.email}</p>
          </div>
        </header>

        {activePage === 'dashboard' && (
          <div className="stats-grid">
            <div className="stat-card blue">
              <span>Total Users</span>
              <strong>{totalUsers}</strong>
            </div>

            <div className="stat-card purple">
              <span>Admins</span>
              <strong>{totalAdmins}</strong>
            </div>

            <div className="stat-card green">
              <span>Normal Users</span>
              <strong>{normalUsers}</strong>
            </div>

            <div className="stat-card orange">
              <span>Active Tools</span>
              <strong>{activeTools}</strong>
            </div>
          </div>
        )}

        {activePage === 'videos' && (
          <section className="panel-card">
            <h2>🎬 Text-to-Video Settings</h2>

            <p>
              AI video generation dashboard.
            </p>

            <div className="credits-box">
              Available Plans:{' '}
              <strong>{VIDEO_PLANS.length}</strong>
            </div>

            <p>
              Real video generation API will be connected
              to this section.
            </p>
          </section>
        )}

        {activePage === 'plans' && (
          <section className="panel-card">
            <h2>💳 Text-to-Video Plans</h2>

            <div className="plans-grid">
              {VIDEO_PLANS.map((plan) => (
                <div
                  className="plan-card"
                  key={plan.id}
                >
                  {plan.popular && (
                    <div className="popular-badge">
                      ⭐ MOST POPULAR
                    </div>
                  )}

                  <div className="plan-icon">
                    {plan.icon}
                  </div>

                  <h3>{plan.name}</h3>

                  <div className="plan-price">
                    {plan.price}
                  </div>

                  <p>{plan.description}</p>

                  <strong>
                    {plan.credits} credits
                  </strong>

                  <p>{plan.quality}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activePage === 'users' && (
          <section className="panel-card">
            <h2>👥 Users</h2>

            <button
              className="refresh-button"
              onClick={loadUsers}
              disabled={usersLoading}
            >
              {usersLoading
                ? 'Loading...'
                : '↻ Refresh'}
            </button>

            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        {new Date(
                          user.created_at
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === 'tools' && (
          <section className="panel-card">
            <h2>🛠️ Tools</h2>

            <button
              className="refresh-button"
              onClick={loadTools}
              disabled={toolsLoading}
            >
              {toolsLoading
                ? 'Loading...'
                : '↻ Refresh'}
            </button>

            <div className="tools-grid">
              {tools.map((tool) => (
                <div
                  className="tool-admin-card"
                  key={tool.id}
                >
                  <div className="tool-card-icon">
                    {tool.icon || '🛠️'}
                  </div>

                  <h3>{tool.name}</h3>

                  <p>
                    {tool.description ||
                      'No description'}
                  </p>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Tool ↗
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {activePage === 'statistics' && (
          <section className="panel-card">
            <h2>📊 Statistics</h2>

            <div className="stats-grid">
              <div className="stat-card blue">
                <span>Users</span>
                <strong>{totalUsers}</strong>
              </div>

              <div className="stat-card purple">
                <span>Admins</span>
                <strong>{totalAdmins}</strong>
              </div>

              <div className="stat-card green">
                <span>Users</span>
                <strong>{normalUsers}</strong>
              </div>

              <div className="stat-card orange">
                <span>Tools</span>
                <strong>{tools.length}</strong>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
