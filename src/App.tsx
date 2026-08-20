import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { supabase } from './supabase'

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
  price: number
  monthly_credits: number
  max_duration_seconds: number
  max_resolution: string
  watermark: boolean
  priority: number
  is_active: boolean
}

type VideoGeneration = {
  id: string
  prompt: string
  duration_seconds: number
  resolution: string
  aspect_ratio: string
  style: string | null
  status: string
  video_url: string | null
  thumbnail_url: string | null
  credits_used: number
  created_at: string
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [users, setUsers] = useState<Profile[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [videoPlans, setVideoPlans] = useState<VideoPlan[]>([])
  const [videos, setVideos] = useState<VideoGeneration[]>([])

  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [toolsLoading, setToolsLoading] = useState(false)
  const [savingTool, setSavingTool] = useState(false)
  const [plansLoading, setPlansLoading] = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSignup, setIsSignup] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  const [activePage, setActivePage] = useState('dashboard')
  const [message, setMessage] = useState('')

  const [showToolForm, setShowToolForm] = useState(false)
  const [editingToolId, setEditingToolId] = useState<string | null>(null)
  const [toolSearch, setToolSearch] = useState('')

  const [toolName, setToolName] = useState('')
  const [toolDescription, setToolDescription] = useState('')
  const [toolUrl, setToolUrl] = useState('')
  const [toolIcon, setToolIcon] = useState('🛠️')
  const [toolActive, setToolActive] = useState(true)

  // =========================
  // TEXT TO VIDEO STATE
  // =========================

  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDuration, setVideoDuration] = useState(10)
  const [videoResolution, setVideoResolution] = useState('480p')
  const [videoAspect, setVideoAspect] = useState('16:9')
  const [videoStyle, setVideoStyle] = useState('Cinematic')
  const [selectedPlan, setSelectedPlan] = useState<VideoPlan | null>(null)

  // =========================
  // AUTH START
  // =========================

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
          setVideos([])
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

  // =========================
  // PROFILE
  // =========================

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

    await Promise.all([
      loadTools(),
      loadVideoPlans(),
      loadMyVideos(userId),
    ])

    if (data.role === 'admin') {
      await loadUsers()
    }

    setLoading(false)
  }

  // =========================
  // USERS
  // =========================

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

  async function changeRole(
    userId: string,
    newRole: 'user' | 'admin'
  ) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Role updated successfully.')
    await loadUsers()
  }

  // =========================
  // TOOLS
  // =========================

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

  function resetToolForm() {
    setEditingToolId(null)
    setToolName('')
    setToolDescription('')
    setToolUrl('')
    setToolIcon('🛠️')
    setToolActive(true)
  }

  function openAddTool() {
    resetToolForm()
    setShowToolForm(true)
    setMessage('')
  }

  function openEditTool(tool: Tool) {
    setEditingToolId(tool.id)
    setToolName(tool.name)
    setToolDescription(tool.description || '')
    setToolUrl(tool.url)
    setToolIcon(tool.icon || '🛠️')
    setToolActive(tool.is_active)
    setShowToolForm(true)
    setMessage('')
  }

  function closeToolForm() {
    resetToolForm()
    setShowToolForm(false)
  }

  async function saveTool(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!toolName.trim() || !toolUrl.trim()) {
      setMessage('Tool name and URL are required.')
      return
    }

    setSavingTool(true)
    setMessage('')

    const toolData = {
      name: toolName.trim(),
      description: toolDescription.trim(),
      url: toolUrl.trim(),
      icon: toolIcon.trim() || '🛠️',
      is_active: toolActive,
    }

    if (editingToolId) {
      const { error } = await supabase
        .from('tools')
        .update(toolData)
        .eq('id', editingToolId)

      if (error) {
        setMessage(error.message)
        setSavingTool(false)
        return
      }

      setMessage('Tool updated successfully.')
    } else {
      const { error } = await supabase
        .from('tools')
        .insert(toolData)

      if (error) {
        setMessage(error.message)
        setSavingTool(false)
        return
      }

      setMessage('Tool added successfully.')
    }

    closeToolForm()
    await loadTools()
    setSavingTool(false)
  }

  async function toggleTool(tool: Tool) {
    const { error } = await supabase
      .from('tools')
      .update({
        is_active: !tool.is_active,
      })
      .eq('id', tool.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(
      tool.is_active
        ? 'Tool deactivated.'
        : 'Tool activated.'
    )

    await loadTools()
  }

  async function deleteTool(toolId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this tool?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Tool deleted successfully.')
    await loadTools()
  }

  // =========================
  // VIDEO PLANS
  // =========================

  async function loadVideoPlans() {
    setPlansLoading(true)

    const { data, error } = await supabase
      .from('video_plans')
      .select(
        'id, name, price, monthly_credits, max_duration_seconds, max_resolution, watermark, priority, is_active'
      )
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) {
      setMessage(error.message)
      setVideoPlans([])
    } else {
      const plans = (data || []) as VideoPlan[]
      setVideoPlans(plans)

      const popular =
        plans.find((plan) => plan.name === 'Popular') ||
        plans[0]

      if (popular) {
        setSelectedPlan(popular)
      }
    }

    setPlansLoading(false)
  }

  // =========================
  // VIDEOS
  // =========================

  async function loadMyVideos(userId: string) {
    setVideosLoading(true)

    const { data, error } = await supabase
      .from('video_generations')
      .select(
        'id, prompt, duration_seconds, resolution, aspect_ratio, style, status, video_url, thumbnail_url, credits_used, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      setVideos([])
    } else {
      setVideos((data || []) as VideoGeneration[])
    }

    setVideosLoading(false)
  }

  // =========================
  // GENERATE VIDEO
  // =========================

  async function generateVideo() {
    if (!session?.user?.id) {
      setMessage('Please login first.')
      return
    }

    if (!videoPrompt.trim()) {
      setMessage('Please enter a video prompt.')
      return
    }

    if (!selectedPlan) {
      setMessage('Please select a plan.')
      return
    }

    if (
      videoDuration >
      selectedPlan.max_duration_seconds
    ) {
      setMessage(
        `${selectedPlan.name} plan supports up to ${selectedPlan.max_duration_seconds} seconds.`
      )
      return
    }

    setGenerating(true)
    setMessage('Creating your video request...')

    const creditsUsed = Math.max(
      1,
      Math.ceil(videoDuration / 5)
    )

    const { error } = await supabase
      .from('video_generations')
      .insert({
        user_id: session.user.id,
        plan_id: selectedPlan.id,
        prompt: videoPrompt.trim(),
        duration_seconds: videoDuration,
        resolution: videoResolution,
        aspect_ratio: videoAspect,
        style: videoStyle,
        status: 'pending',
        credits_used: creditsUsed,
      })

    if (error) {
      setMessage(error.message)
      setGenerating(false)
      return
    }

    setMessage(
      'Video request created successfully. AI generation API will be connected in the next step.'
    )

    setVideoPrompt('')

    await loadMyVideos(session.user.id)

    setGenerating(false)
  }

  // =========================
  // AUTH
  // =========================

  async function handleAuth(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setMessage('')

    if (isSignup) {
      if (password.length < 6) {
        setMessage(
          'Password must be at least 6 characters.'
        )
        return
      }

      if (password !== confirmPassword) {
        setMessage(
          'New Password and Confirm Password do not match.'
        )
        return
      }

      setLoading(true)

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        setPassword('')
        setConfirmPassword('')
        await loadProfile(data.session.user.id)
      } else {
        setPassword('')
        setConfirmPassword('')

        setMessage(
          'Account created successfully. Please verify your email, then login.'
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
      setMessage(
        'Login successful, but no session was created.'
      )
      setLoading(false)
      return
    }

    setPassword('')
    setConfirmPassword('')

    setSession(data.session)
    await loadProfile(data.session.user.id)
  }

  async function logout() {
    await supabase.auth.signOut()

    setSession(null)
    setProfile(null)
    setUsers([])
    setTools([])
    setVideos([])

    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMessage('')
    setActivePage('dashboard')

    closeToolForm()
  }

  // =========================
  // STATS
  // =========================

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

  const inactiveTools =
    tools.length - activeTools

  const filteredTools = tools.filter((tool) => {
    const search = toolSearch.toLowerCase()

    return (
      tool.name.toLowerCase().includes(search) ||
      (tool.description || '')
        .toLowerCase()
        .includes(search)
    )
  })

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
          <p className="subtitle">
            Please wait
          </p>
        </div>
      </main>
    )
  }

  // =========================
  // LOGGED IN
  // =========================

  if (session && profile) {
    // =========================
    // NORMAL USER
    // =========================

    if (profile.role !== 'admin') {
      const userTools = tools.filter(
        (tool) => tool.is_active
      )

      return (
        <main className="user-dashboard">
          <div className="user-card">
            <div className="user-topbar">
              <div>
                <h1>ToolMaster Pro</h1>
                <p>{profile.email}</p>
              </div>

              <button onClick={logout}>
                Logout
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 25,
              }}
            >
              <button
                onClick={() =>
                  setActivePage('dashboard')
                }
              >
                🏠 Dashboard
              </button>

              <button
                onClick={() =>
                  setActivePage('text-to-video')
                }
              >
                🎬 Text to Video
              </button>

              <button
                onClick={() =>
                  setActivePage('my-videos')
                }
              >
                🎥 My Videos
              </button>
            </div>

            {activePage === 'text-to-video' ? (
              <TextToVideoPage
                videoPlans={videoPlans}
                plansLoading={plansLoading}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                videoPrompt={videoPrompt}
                setVideoPrompt={setVideoPrompt}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                videoResolution={videoResolution}
                setVideoResolution={setVideoResolution}
                videoAspect={videoAspect}
                setVideoAspect={setVideoAspect}
                videoStyle={videoStyle}
                setVideoStyle={setVideoStyle}
                generating={generating}
                generateVideo={generateVideo}
                message={message}
              />
            ) : activePage === 'my-videos' ? (
              <MyVideosPage
                videos={videos}
                loading={videosLoading}
              />
            ) : (
              <>
                <h2>Welcome 👋</h2>

                <p>
                  You have successfully logged in.
                </p>

                <div className="user-tools-box">
                  <h3>Your Tools</h3>

                  {userTools.length === 0 ? (
                    <p>
                      No tools are currently available.
                    </p>
                  ) : (
                    <div className="user-tools-grid">
                      {userTools.map((tool) => (
                        <a
                          key={tool.id}
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="user-tool-card"
                        >
                          <div className="user-tool-icon">
                            {tool.icon || '🛠️'}
                          </div>

                          <div>
                            <h4>{tool.name}</h4>
                            <p>
                              {tool.description ||
                                'Open this tool'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      )
    }

    // =========================
    // ADMIN
    // =========================

    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              TM
            </div>

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
              onClick={() =>
                setActivePage('dashboard')
              }
            >
              🏠 Dashboard
            </button>

            <button
              className={
                activePage === 'users'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActivePage('users')
              }
            >
              👥 Users
            </button>

            <button
              className={
                activePage === 'tools'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActivePage('tools')
              }
            >
              🛠️ Tools
            </button>

            <button
              className={
                activePage === 'text-to-video'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActivePage('text-to-video')
              }
            >
              🎬 Text to Video
            </button>

            <button
              className={
                activePage === 'statistics'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActivePage('statistics')
              }
            >
              📊 Statistics
            </button>

            <button
              className={
                activePage === 'settings'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() =>
                setActivePage('settings')
              }
            >
              ⚙️ Settings
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
                {activePage === 'dashboard' &&
                  'Dashboard'}

                {activePage === 'users' &&
                  'User Management'}

                {activePage === 'tools' &&
                  'Tools Management'}

                {activePage === 'text-to-video' &&
                  'Text to Video'}

                {activePage === 'statistics' &&
                  'Statistics'}

                {activePage === 'settings' &&
                  'Settings'}
              </h1>

              <p>
                Welcome back, {profile.email}
              </p>
            </div>

            <div className="admin-profile">
              <div className="avatar">
                A
              </div>

              <div>
                <strong>
                  Administrator
                </strong>

                <span>Admin</span>
              </div>
            </div>
          </header>

          {/* DASHBOARD */}

          {activePage === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">
                    👥
                  </div>
                  <div>
                    <span>Total Users</span>
                    <strong>
                      {totalUsers}
                    </strong>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">
                    👑
                  </div>
                  <div>
                    <span>Total Admins</span>
                    <strong>
                      {totalAdmins}
                    </strong>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">
                    👤
                  </div>
                  <div>
                    <span>Normal Users</span>
                    <strong>
                      {normalUsers}
                    </strong>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">
                    🛠️
                  </div>
                  <div>
                    <span>Active Tools</span>
                    <strong>
                      {activeTools}
                    </strong>
                  </div>
                </div>
              </div>

              <section className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2>Recent Users</h2>
                    <p>
                      Latest registered users
                    </p>
                  </div>

                  <button
                    className="refresh-button"
                    onClick={loadUsers}
                    disabled={usersLoading}
                  >
                    {usersLoading
                      ? 'Loading...'
                      : '↻ Refresh'}
                  </button>
                </div>

                <div className="users-table-wrapper">
                  {users.length === 0 ? (
                    <p>No users found.</p>
                  ) : (
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created</th>
                        </tr>
                      </thead>

                      <tbody>
                        {users
                          .slice(0, 5)
                          .map((user) => (
                            <tr key={user.id}>
                              <td>
                                {user.email ||
                                  'No email'}
                              </td>

                              <td>
                                <span
                                  className={
                                    user.role ===
                                    'admin'
                                      ? 'role admin-role'
                                      : 'role user-role'
                                  }
                                >
                                  {user.role}
                                </span>
                              </td>

                              <td>
                                {new Date(
                                  user.created_at
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* USERS */}

          {activePage === 'users' && (
            <section className="panel-card">
              <div className="panel-header">
                <div>
                  <h2>All Users</h2>
                  <p>
                    Manage user accounts and permissions
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadUsers}
                  disabled={usersLoading}
                >
                  {usersLoading
                    ? 'Loading...'
                    : '↻ Refresh'}
                </button>
              </div>

              <div className="users-table-wrapper">
                {users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            {user.email ||
                              'No email'}
                          </td>

                          <td>
                            <span
                              className={
                                user.role === 'admin'
                                  ? 'role admin-role'
                                  : 'role user-role'
                              }
                            >
                              {user.role}
                            </span>
                          </td>

                          <td>
                            {new Date(
                              user.created_at
                            ).toLocaleDateString()}
                          </td>

                          <td>
                            {user.id === profile.id ? (
                              <span className="current-user">
                                Current Admin
                              </span>
                            ) : (
                              <button
                                className="role-button"
                                onClick={() =>
                                  changeRole(
                                    user.id,
                                    user.role ===
                                      'admin'
                                      ? 'user'
                                      : 'admin'
                                  )
                                }
                              >
                                {user.role === 'admin'
                                  ? 'Make User'
                                  : 'Make Admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {message && (
                <p className="message">
                  {message}
                </p>
              )}
            </section>
          )}

          {/* TOOLS */}

          {activePage === 'tools' && (
            <>
              <section className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2>
                      Tools Management
                    </h2>

                    <p>
                      Add, edit and manage your website tools
                    </p>
                  </div>

                  <div className="tools-actions">
                    <button
                      className="refresh-button"
                      onClick={loadTools}
                      disabled={toolsLoading}
                    >
                      {toolsLoading
                        ? 'Loading...'
                        : '↻ Refresh'}
                    </button>

                    <button
                      className="add-tool-button"
                      onClick={openAddTool}
                    >
                      + Add Tool
                    </button>
                  </div>
                </div>

                {showToolForm && (
                  <form
                    className="tool-form"
                    onSubmit={saveTool}
                  >
                    <div className="tool-form-header">
                      <div>
                        <h3>
                          {editingToolId
                            ? 'Edit Tool'
                            : 'Add New Tool'}
                        </h3>

                        <p>
                          Enter the tool information below.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="close-button"
                        onClick={closeToolForm}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="tool-form-grid">
                      <div>
                        <label htmlFor="toolName">
                          Tool Name
                        </label>

                        <input
                          id="toolName"
                          value={toolName}
                          onChange={(e) =>
                            setToolName(
                              e.target.value
                            )
                          }
                          placeholder="Example: Image Compressor"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="toolIcon">
                          Icon
                        </label>

                        <input
                          id="toolIcon"
                          value={toolIcon}
                          onChange={(e) =>
                            setToolIcon(
                              e.target.value
                            )
                          }
                          placeholder="🛠️"
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="toolUrl">
                          Tool URL
                        </label>

                        <input
                          id="toolUrl"
                          type="url"
                          value={toolUrl}
                          onChange={(e) =>
                            setToolUrl(
                              e.target.value
                            )
                          }
                          placeholder="https://example.com"
                          required
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="toolDescription">
                          Description
                        </label>

                        <textarea
                          id="toolDescription"
                          value={toolDescription}
                          onChange={(e) =>
                            setToolDescription(
                              e.target.value
                            )
                          }
                          placeholder="Describe what this tool does..."
                        />
                      </div>

                      <label className="active-toggle">
                        <input
                          type="checkbox"
                          checked={toolActive}
                          onChange={(e) =>
                            setToolActive(
                              e.target.checked
                            )
                          }
                        />
                        Active
                      </label>
                    </div>

                    <div className="tool-form-buttons">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={closeToolForm}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-tool-button"
                        disabled={savingTool}
                      >
                        {savingTool
                          ? 'Saving...'
                          : editingToolId
                            ? 'Update Tool'
                            : 'Save Tool'}
                      </button>
                    </div>
                  </form>
                )}

                {message && (
                  <p className="message tool-message">
                    {message}
                  </p>
                )}
              </section>

              <section className="panel-card tools-list-panel">
                <div className="tools-list-header">
                  <div>
                    <h2>All Tools</h2>

                    <p>
                      {tools.length} total tool
                      {tools.length === 1
                        ? ''
                        : 's'}
                    </p>
                  </div>
                </div>

                <div className="tool-search">
                  <input
                    type="search"
                    placeholder="🔍 Search tools..."
                    value={toolSearch}
                    onChange={(e) =>
                      setToolSearch(
                        e.target.value
                      )
                    }
                  />
                </div>

                {toolsLoading ? (
                  <div className="empty-tools">
                    <h3>
                      Loading tools...
                    </h3>

                    <p>Please wait.</p>
                  </div>
                ) : filteredTools.length === 0 ? (
                  <div className="empty-tools">
                    <div className="empty-icon">
                      🛠️
                    </div>

                    <h3>
                      {tools.length === 0
                        ? 'No tools yet'
                        : 'No matching tools'}
                    </h3>

                    <p>
                      {tools.length === 0
                        ? 'Click "Add Tool" to create your first tool.'
                        : 'Try a different search.'}
                    </p>
                  </div>
                ) : (
                  <div className="tools-grid">
                    {filteredTools.map(
                      (tool) => (
                        <div
                          key={tool.id}
                          className={
                            tool.is_active
                              ? 'tool-admin-card'
                              : 'tool-admin-card inactive'
                          }
                        >
                          <div className="tool-card-top">
                            <div className="tool-card-icon">
                              {tool.icon ||
                                '🛠️'}
                            </div>

                            <span
                              className={
                                tool.is_active
                                  ? 'tool-status active-status'
                                  : 'tool-status inactive-status'
                              }
                            >
                              {tool.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </div>

                          <h3>
                            {tool.name}
                          </h3>

                          <p>
                            {tool.description ||
                              'No description provided.'}
                          </p>

                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tool-url"
                          >
                            Open Tool ↗
                          </a>

                          <div className="tool-card-actions">
                            <button
                              className="edit-tool-button"
                              onClick={() =>
                                openEditTool(
                                  tool
                                )
                              }
                            >
                              ✏️ Edit
                            </button>

                            <button
                              className="toggle-tool-button"
                              onClick={() =>
                                toggleTool(
                                  tool
                                )
                              }
                            >
                              {tool.is_active
                                ? '⏸️ Disable'
                                : '▶️ Enable'}
                            </button>

                            <button
                              className="delete-tool-button"
                              onClick={() =>
                                deleteTool(
                                  tool.id
                                )
                              }
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* TEXT TO VIDEO ADMIN */}

          {activePage === 'text-to-video' && (
            <TextToVideoPage
              videoPlans={videoPlans}
              plansLoading={plansLoading}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              videoPrompt={videoPrompt}
              setVideoPrompt={setVideoPrompt}
              videoDuration={videoDuration}
              setVideoDuration={setVideoDuration}
              videoResolution={videoResolution}
              setVideoResolution={setVideoResolution}
              videoAspect={videoAspect}
              setVideoAspect={setVideoAspect}
              videoStyle={videoStyle}
              setVideoStyle={setVideoStyle}
              generating={generating}
              generateVideo={generateVideo}
              message={message}
            />
          )}

          {/* STATISTICS */}

          {activePage === 'statistics' && (
            <section className="statistics-page">
              <div className="panel-card statistics-intro">
                <div>
                  <h2>
                    Website Statistics
                  </h2>

                  <p>
                    Overview of your users and tools.
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={async () => {
                    await loadUsers()
                    await loadTools()

                    setMessage(
                      'Statistics refreshed successfully.'
                    )
                  }}
                  disabled={
                    usersLoading ||
                    toolsLoading
                  }
                >
                  {usersLoading ||
                  toolsLoading
                    ? 'Loading...'
                    : '↻ Refresh'}
                </button>
              </div>

              <div className="stats-grid statistics-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">
                    👥
                  </div>

                  <div>
                    <span>Total Users</span>
                    <strong>
                      {totalUsers}
                    </strong>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">
                    👑
                  </div>

                  <div>
                    <span>Administrators</span>
                    <strong>
                      {totalAdmins}
                    </strong>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">
                    👤
                  </div>

                  <div>
                    <span>Normal Users</span>
                    <strong>
                      {normalUsers}
                    </strong>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">
                    🛠️
                  </div>

                  <div>
                    <span>Total Tools</span>
                    <strong>
                      {tools.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="statistics-columns">
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <h2>
                        Tools Overview
                      </h2>

                      <p>
                        Current tool status
                      </p>
                    </div>
                  </div>

                  <div className="statistics-list">
                    <div className="statistics-row">
                      <span>Active Tools</span>
                      <strong className="stat-green">
                        {activeTools}
                      </strong>
                    </div>

                    <div className="statistics-row">
                      <span>Inactive Tools</span>
                      <strong className="stat-red">
                        {inactiveTools}
                      </strong>
                    </div>

                    <div className="statistics-row">
                      <span>Total Tools</span>
                      <strong>
                        {tools.length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <h2>
                        Users Overview
                      </h2>

                      <p>
                        Current user roles
                      </p>
                    </div>
                  </div>

                  <div className="statistics-list">
                    <div className="statistics-row">
                      <span>Administrators</span>
                      <strong className="stat-purple">
                        {totalAdmins}
                      </strong>
                    </div>

                    <div className="statistics-row">
                      <span>Normal Users</span>
                      <strong className="stat-green">
                        {normalUsers}
                      </strong>
                    </div>

                    <div className="statistics-row">
                      <span>Total Users</span>
                      <strong>
                        {totalUsers}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SETTINGS */}

          {activePage === 'settings' && (
            <section className="panel-card empty-panel">
              <div className="empty-icon">
                ⚙️
              </div>

              <h2>Settings</h2>

              <p>
                Admin settings will be added here.
              </p>
            </section>
          )}
        </main>
      </div>
    )
  }

  // =========================
  // LOGIN / SIGNUP
  // =========================

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
            className={
              !isAdminLogin
                ? 'active'
                : ''
            }
            onClick={() => {
              setIsAdminLogin(false)
              setIsSignup(false)
              setPassword('')
              setConfirmPassword('')
              setMessage('')
            }}
          >
            User Login
          </button>

          <button
            type="button"
            className={
              isAdminLogin
                ? 'active'
                : ''
            }
            onClick={() => {
              setIsAdminLogin(true)
              setIsSignup(false)
              setPassword('')
              setConfirmPassword('')
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
              setPassword('')
              setConfirmPassword('')
              setMessage('')
            }}
          >
            {isSignup
              ? 'Already have an account? Login'
              : 'Create new account'}
          </button>
        )}

        <form onSubmit={handleAuth}>
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label htmlFor="password">
            {isSignup
              ? 'New Password'
              : 'Password'}
          </label>

          <input
            id="password"
            type="password"
            placeholder={
              isSignup
                ? 'Enter new password'
                : 'Enter password'
            }
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
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
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                minLength={6}
                required
              />

              {confirmPassword.length > 0 &&
                password !==
                  confirmPassword && (
                  <p
                    style={{
                      color: '#f87171',
                      fontSize: '13px',
                      marginTop: '7px',
                    }}
                  >
                    Passwords do not match.
                  </p>
                )}

              {confirmPassword.length > 0 &&
                password ===
                  confirmPassword && (
                  <p
                    style={{
                      color: '#4ade80',
                      fontSize: '13px',
                      marginTop: '7px',
                    }}
                  >
                    Passwords match ✓
                  </p>
                )}
            </>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={
              loading ||
              (isSignup &&
                password !==
                  confirmPassword)
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
          <p className="message">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}

// =====================================================
// TEXT TO VIDEO PAGE
// =====================================================

type TextToVideoProps = {
  videoPlans: VideoPlan[]
  plansLoading: boolean
  selectedPlan: VideoPlan | null
  setSelectedPlan: (plan: VideoPlan) => void
  videoPrompt: string
  setVideoPrompt: (value: string) => void
  videoDuration: number
  setVideoDuration: (value: number) => void
  videoResolution: string
  setVideoResolution: (value: string) => void
  videoAspect: string
  setVideoAspect: (value: string) => void
  videoStyle: string
  setVideoStyle: (value: string) => void
  generating: boolean
  generateVideo: () => Promise<void>
  message: string
}

function TextToVideoPage({
  videoPlans,
  plansLoading,
  selectedPlan,
  setSelectedPlan,
  videoPrompt,
  setVideoPrompt,
  videoDuration,
  setVideoDuration,
  videoResolution,
  setVideoResolution,
  videoAspect,
  setVideoAspect,
  videoStyle,
  setVideoStyle,
  generating,
  generateVideo,
  message,
}: TextToVideoProps) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <section
        style={{
          padding: 30,
          borderRadius: 20,
          marginBottom: 25,
          background:
            'linear-gradient(135deg,#111827,#312e81)',
          color: 'white',
        }}
      >
        <h2
          style={{
            fontSize: 34,
            marginBottom: 10,
          }}
        >
          🎬 AI Text to Video
        </h2>

        <p
          style={{
            opacity: 0.85,
            fontSize: 16,
          }}
        >
          Turn your text prompt into an amazing AI
          video.
        </p>
      </section>

      {/* PLANS */}

      <section style={{ marginBottom: 30 }}>
        <h2 style={{ marginBottom: 18 }}>
          Choose Your Plan
        </h2>

        {plansLoading ? (
          <p>Loading plans...</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(220px,1fr))',
              gap: 16,
            }}
          >
            {videoPlans.map((plan) => {
              const isPopular =
                plan.name === 'Popular'

              const selected =
                selectedPlan?.id === plan.id

              const icon =
                plan.name === 'Free'
                  ? '🆓'
                  : plan.name === 'Basic'
                    ? '🔵'
                    : plan.name === 'Popular'
                      ? '⭐'
                      : '👑'

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() =>
                    setSelectedPlan(plan)
                  }
                  style={{
                    textAlign: 'left',
                    padding: 22,
                    borderRadius: 18,
                    border: selected
                      ? '3px solid #6366f1'
                      : '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    boxShadow: selected
                      ? '0 12px 30px rgba(99,102,241,.20)'
                      : '0 5px 18px rgba(0,0,0,.06)',
                    position: 'relative',
                  }}
                >
                  {isPopular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        padding:
                          '5px 9px',
                        borderRadius: 20,
                        background:
                          '#f59e0b',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      MOST POPULAR
                    </span>
                  )}

                  <div
                    style={{
                      fontSize: 26,
                      marginBottom: 8,
                    }}
                  >
                    {icon}
                  </div>

                  <h3
                    style={{
                      margin: '0 0 8px',
                    }}
                  >
                    {plan.name}
                  </h3>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      marginBottom: 12,
                    }}
                  >
                    $
                    {Number(plan.price).toFixed(
                      2
                    )}
                    <small
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                      }}
                    >
                      /month
                    </small>
                  </div>

                  <p>
                    💰 {plan.monthly_credits}{' '}
                    credits/month
                  </p>

                  <p>
                    🎥 Up to{' '}
                    {plan.max_duration_seconds}
                    sec
                  </p>

                  <p>
                    🖥️{' '}
                    {plan.max_resolution}
                  </p>

                  <p>
                    {plan.watermark
                      ? '💧 Watermark'
                      : '✨ No watermark'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* VIDEO FORM */}

      <section
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 25,
          boxShadow:
            '0 8px 30px rgba(0,0,0,.08)',
          marginBottom: 30,
        }}
      >
        <h2>Describe Your Video</h2>

        <p
          style={{
            color: '#6b7280',
          }}
        >
          Write a detailed description of the
          video you want AI to create.
        </p>

        <textarea
          value={videoPrompt}
          onChange={(e) =>
            setVideoPrompt(e.target.value)
          }
          placeholder="Example: A cinematic drone shot flying over beautiful mountains at sunset, realistic clouds, dramatic lighting, ultra detailed..."
          rows={7}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 16,
            borderRadius: 14,
            border: '1px solid #d1d5db',
            resize: 'vertical',
            fontSize: 16,
            marginTop: 15,
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 15,
            marginTop: 20,
          }}
        >
          <div>
            <label>Duration</label>

            <select
              value={videoDuration}
              onChange={(e) =>
                setVideoDuration(
                  Number(e.target.value)
                )
              }
              style={{
                width: '100%',
                padding: 12,
                marginTop: 7,
              }}
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>

          <div>
            <label>Resolution</label>

            <select
              value={videoResolution}
              onChange={(e) =>
                setVideoResolution(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 12,
                marginTop: 7,
              }}
            >
              <option value="480p">
                480p
              </option>
              <option value="720p">
                720p HD
              </option>
              <option value="1080p">
                1080p Full HD
              </option>
            </select>
          </div>

          <div>
            <label>Aspect Ratio</label>

            <select
              value={videoAspect}
              onChange={(e) =>
                setVideoAspect(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 12,
                marginTop: 7,
              }}
            >
              <option value="16:9">
                16:9 Landscape
              </option>
              <option value="9:16">
                9:16 Portrait
              </option>
              <option value="1:1">
                1:1 Square
              </option>
            </select>
          </div>

          <div>
            <label>Style</label>

            <select
              value={videoStyle}
              onChange={(e) =>
                setVideoStyle(
                  e.target.value
                )
              }
              style={{
                width: '100%',
                padding: 12,
                marginTop: 7,
              }}
            >
              <option>Cinematic</option>
              <option>Realistic</option>
              <option>Anime</option>
              <option>3D Animation</option>
              <option>Documentary</option>
              <option>Fantasy</option>
              <option>Product Commercial</option>
            </select>
          </div>
        </div>

        {selectedPlan && (
          <div
            style={{
              marginTop: 20,
              padding: 15,
              borderRadius: 12,
              background: '#f3f4f6',
            }}
          >
            Selected plan:{' '}
            <strong>
              {selectedPlan.name}
            </strong>
            {' — '}
            {selectedPlan.monthly_credits}{' '}
            credits/month
          </div>
        )}

        <button
          type="button"
          onClick={generateVideo}
          disabled={generating}
          style={{
            width: '100%',
            marginTop: 22,
            padding: 16,
            border: 0,
            borderRadius: 14,
            background:
              'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white',
            fontSize: 17,
            fontWeight: 700,
            cursor: generating
              ? 'wait'
              : 'pointer',
          }}
        >
          {generating
            ? '⏳ Creating Request...'
            : '🎬 Generate Video'}
        </button>

        {message && (
          <p
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 10,
              background: '#eef2ff',
              color: '#3730a3',
            }}
          >
            {message}
          </p>
        )}
      </section>
    </div>
  )
}

// =====================================================
// MY VIDEOS
// =====================================================

function MyVideosPage({
  videos,
  loading,
}: {
  videos: VideoGeneration[]
  loading: boolean
}) {
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <div className="panel-card">
        <h2>🎥 My Videos</h2>

        <p>
          Your latest video generation requests.
        </p>

        {loading ? (
          <p>Loading videos...</p>
        ) : videos.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 50,
              }}
            >
              🎬
            </div>

            <h3>No videos yet</h3>

            <p>
              Your generated videos will appear
              here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(280px,1fr))',
              gap: 18,
              marginTop: 20,
            }}
          >
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 35,
                    marginBottom: 10,
                  }}
                >
                  🎬
                </div>

                <h3>
                  {video.prompt.length >
                  70
                    ? video.prompt.slice(
                        0,
                        70
                      ) + '...'
                    : video.prompt}
                </h3>

                <p>
                  Status:{' '}
                  <strong>
                    {video.status}
                  </strong>
                </p>

                <p>
                  {video.duration_seconds}s ·{' '}
                  {video.resolution} ·{' '}
                  {video.aspect_ratio}
                </p>

                <p>
                  Credits used:{' '}
                  {video.credits_used}
                </p>

                {video.video_url && (
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶️ Watch Video
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default App
