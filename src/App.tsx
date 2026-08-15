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
    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (!session) {
        setProfile(null)
        setUsers([])
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
      .select('id, email, role, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error(error)
      setProfile(null)
    } else {
      setProfile(data)

      if (data.role === 'admin') {
        loadUsers()
      }
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
      console.error(error)
      setMessage(error.message)
    } else {
      setUsers(data || [])
    }

    setUsersLoading(false)
  }

  async function changeRole(userId: string, newRole: 'user' | 'admin') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadUsers()
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

              {message && <p className="message">{message}</p>}
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

        {message && <p className="message">{message}</p>}
      </div>
    </main>
  )
}

export default App
