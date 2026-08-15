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
      console.error('Profile error:', error)
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
      console.error('Users error:', error)
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
    return (
      <main className="dashboard">
        <div className="dashboard-card">
          <div className="top-bar">
            <div>
              <h1>
                {profile.role === 'admin'
                  ? 'Admin Dashboard'
                  : 'User Dashboard'}
              </h1>
              <p>{profile.email}</p>
            </div>

            <button onClick={logout}>Logout</button>
          </div>

          {profile.role === 'admin' ? (
            <section>
              <h2>Welcome, Admin 👑</h2>
              <p>You have administrator access.</p>

              <div className="dashboard-box">
                <div className="section-header">
                  <div>
                    <h3>User Management</h3>
                    <p>Total users: {users.length}</p>
                  </div>

                  <button
                    className="refresh-button"
                    onClick={loadUsers}
                    disabled={usersLoading}
                  >
                    {usersLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {usersLoading ? (
                  <p>Loading users...</p>
                ) : users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
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
                )}
              </div>

              {message && (
                <p className="message">{message}</p>
              )}
            </section>
          ) : (
            <section>
              <h2>Welcome, User 👋</h2>
              <p>You have successfully logged in.</p>

              <div className="dashboard-box">
                <h3>Your Tools</h3>
                <p>Your available tools will appear here.</p>
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
