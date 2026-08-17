import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'

type Profile = {
  id: string
  email: string | null
  role: 'user' | 'admin'
  created_at: string
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const start = async () => {
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
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return

      setSession(currentSession)

      if (event === 'SIGNED_OUT' || !currentSession) {
        setProfile(null)
        setUsers([])
        setLoading(false)
        return
      }

      setTimeout(() => {
        if (mounted && currentSession) {
          loadProfile(currentSession.user.id)
        }
      }, 0)
    })

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

    setProfile(data)

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
      setUsers(data || [])
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

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
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
          'Account created. Please verify your email, then login.'
        )
        setLoading(false)
      }

      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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
    setEmail('')
    setPassword('')
    setMessage('')
  }

  const totalUsers = users.length
  const totalAdmins = users.filter(
    (user) => user.role === 'admin'
  ).length
  const normalUsers = users.filter(
    (user) => user.role === 'user'
  ).length

  if (loading) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
          <p className="subtitle">Please wait</p>
        </div>
      </main>
    )
  }

  if (session && profile) {
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

            <h2>Welcome 👋</h2>
            <p>You have successfully logged in.</p>

            <div className="user-tools-box">
              <h3>Your Tools</h3>
              <p>Your available tools will appear here.</p>
            </div>
          </div>
        </main>
      )
    }

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

            <button
              className={
                activePage === 'settings'
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() => setActivePage('settings')}
            >
              ⚙️ Settings
            </button>
          </nav>

          <button className="logout-button" onClick={logout}>
            🚪 Logout
          </button>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <div>
              <h1>
                {activePage === 'dashboard' && 'Dashboard'}
                {activePage === 'users' && 'User Management'}
                {activePage === 'tools' && 'Tools Management'}
                {activePage === 'statistics' && 'Statistics'}
                {activePage === 'settings' && 'Settings'}
              </h1>

              <p>Welcome back, {profile.email}</p>
            </div>

            <div className="admin-profile">
              <div className="avatar">A</div>
              <div>
                <strong>Administrator</strong>
                <span>Admin</span>
              </div>
            </div>
          </header>

          {activePage === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">👥</div>
                  <div>
                    <span>Total Users</span>
                    <strong>{totalUsers}</strong>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">👑</div>
                  <div>
                    <span>Total Admins</span>
                    <strong>{totalAdmins}</strong>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">👤</div>
                  <div>
                    <span>Normal Users</span>
                    <strong>{normalUsers}</strong>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">🛠️</div>
                  <div>
                    <span>Total Tools</span>
                    <strong>0</strong>
                  </div>
                </div>
              </div>

              <section className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2>Recent Users</h2>
                    <p>Latest registered users</p>
                  </div>

                  <button
                    className="refresh-button"
                    onClick={loadUsers}
                    disabled={usersLoading}
                  >
                    {usersLoading ? 'Loading...' : '↻ Refresh'}
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
                        {users.slice(0, 5).map((user) => (
                          <tr key={user.id}>
                            <td>{user.email || 'No email'}</td>

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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {activePage === 'users' && (
            <section className="panel-card">
              <div className="panel-header">
                <div>
                  <h2>All Users</h2>
                  <p>Manage user accounts and permissions</p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadUsers}
                  disabled={usersLoading}
                >
                  {usersLoading ? 'Loading...' : '↻ Refresh'}
                </button>
              </div>

              <div className="users-table-wrapper">
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
                        <td>{user.email || 'No email'}</td>

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
                                  user.role === 'admin'
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
              </div>

              {message && (
                <p className="message">{message}</p>
              )}
            </section>
          )}

          {activePage === 'tools' && (
            <section className="panel-card empty-panel">
              <div className="empty-icon">🛠️</div>
              <h2>Tools Management</h2>
              <p>
                Tool management will be added in the next step.
              </p>
            </section>
          )}

          {activePage === 'statistics' && (
            <section className="panel-card">
              <h2>Statistics</h2>
              <p>Your website statistics will appear here.</p>

              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">👥</div>
                  <div>
                    <span>Users</span>
                    <strong>{totalUsers}</strong>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">👑</div>
                  <div>
                    <span>Admins</span>
                    <strong>{totalAdmins}</strong>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">👤</div>
                  <div>
                    <span>Normal Users</span>
                    <strong>{normalUsers}</strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activePage === 'settings' && (
            <section className="panel-card empty-panel">
              <div className="empty-icon">⚙️</div>
              <h2>Settings</h2>
              <p>Admin settings will be added here.</p>
            </section>
          )}
        </main>
      </div>
    )
  }

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
              setIsSignup(!isSignup)
              setMessage('')
            }}
          >
            {isSignup
              ? 'Already have an account? Login'
              : 'Create new account'}
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

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
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

export default App
