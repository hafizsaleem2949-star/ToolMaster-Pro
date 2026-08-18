import { FormEvent, useEffect, useState } from 'react'
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
  icon: string | null
  url: string | null
  is_active: boolean
  created_at: string
}

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

  const [isSignup, setIsSignup] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)

  const [activePage, setActivePage] = useState('dashboard')
  const [message, setMessage] = useState('')

  const [showToolForm, setShowToolForm] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)

  const [toolName, setToolName] = useState('')
  const [toolDescription, setToolDescription] = useState('')
  const [toolIcon, setToolIcon] = useState('🛠️')
  const [toolUrl, setToolUrl] = useState('')
  const [toolActive, setToolActive] = useState(true)

  const [toolSearch, setToolSearch] = useState('')

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
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
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

    setProfile(data as Profile)

    if (data.role === 'admin') {
      await Promise.all([
        loadUsers(),
        loadTools(),
      ])
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
        'id, name, description, icon, url, is_active, created_at'
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

  function resetToolForm() {
    setToolName('')
    setToolDescription('')
    setToolIcon('🛠️')
    setToolUrl('')
    setToolActive(true)
    setEditingTool(null)
    setShowToolForm(false)
  }

  function openAddTool() {
    setEditingTool(null)
    setToolName('')
    setToolDescription('')
    setToolIcon('🛠️')
    setToolUrl('')
    setToolActive(true)
    setMessage('')
    setShowToolForm(true)
  }

  function openEditTool(tool: Tool) {
    setEditingTool(tool)
    setToolName(tool.name)
    setToolDescription(tool.description || '')
    setToolIcon(tool.icon || '🛠️')
    setToolUrl(tool.url || '')
    setToolActive(tool.is_active)
    setMessage('')
    setShowToolForm(true)
  }

  async function saveTool(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!toolName.trim()) {
      setMessage('Tool name is required.')
      return
    }

    setToolsLoading(true)
    setMessage('')

    const toolData = {
      name: toolName.trim(),
      description: toolDescription.trim() || null,
      icon: toolIcon.trim() || '🛠️',
      url: toolUrl.trim() || null,
      is_active: toolActive,
    }

    if (editingTool) {
      const { error } = await supabase
        .from('tools')
        .update(toolData)
        .eq('id', editingTool.id)

      if (error) {
        setMessage(error.message)
        setToolsLoading(false)
        return
      }

      setMessage('Tool updated successfully.')
    } else {
      const { error } = await supabase
        .from('tools')
        .insert(toolData)

      if (error) {
        setMessage(error.message)
        setToolsLoading(false)
        return
      }

      setMessage('Tool added successfully.')
    }

    resetToolForm()
    await loadTools()
  }

  async function deleteTool(toolId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this tool?'
    )

    if (!confirmed) return

    setToolsLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId)

    if (error) {
      setMessage(error.message)
      setToolsLoading(false)
      return
    }

    setMessage('Tool deleted successfully.')
    await loadTools()
  }

  async function toggleTool(tool: Tool) {
    setToolsLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('tools')
      .update({
        is_active: !tool.is_active,
      })
      .eq('id', tool.id)

    if (error) {
      setMessage(error.message)
      setToolsLoading(false)
      return
    }

    setMessage(
      tool.is_active
        ? 'Tool disabled successfully.'
        : 'Tool enabled successfully.'
    )

    await loadTools()
  }

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
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

    const { data, error } =
      await supabase.auth.signInWithPassword({
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
    setTools([])

    setEmail('')
    setPassword('')
    setMessage('')
    setActivePage('dashboard')
  }

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

  const filteredTools = tools.filter((tool) => {
    const search = toolSearch.toLowerCase().trim()

    if (!search) return true

    return (
      tool.name.toLowerCase().includes(search) ||
      (tool.description || '')
        .toLowerCase()
        .includes(search)
    )
  })

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
                      className="user-tool-card"
                      href={tool.url || '#'}
                      target={
                        tool.url ? '_blank' : undefined
                      }
                      rel={
                        tool.url
                          ? 'noopener noreferrer'
                          : undefined
                      }
                      onClick={(e) => {
                        if (!tool.url) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <div className="user-tool-icon">
                        {tool.icon || '🛠️'}
                      </div>

                      <div>
                        <h4>{tool.name}</h4>

                        <p>
                          {tool.description ||
                            'ToolMaster Pro tool'}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      )
    }

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
                <strong>Administrator</strong>
                <span>Admin</span>
              </div>
            </div>
          </header>

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
                    <span>Total Tools</span>
                    <strong>
                      {tools.length}
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
                                {user.role ===
                                'admin'
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

          {activePage === 'tools' && (
            <>
              <section className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2>Tools Management</h2>

                    <p>
                      Add and manage tools available
                      to your users
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

                <div className="tool-search">
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={toolSearch}
                    onChange={(e) =>
                      setToolSearch(e.target.value)
                    }
                  />
                </div>

                {showToolForm && (
                  <form
                    className="tool-form"
                    onSubmit={saveTool}
                  >
                    <div className="tool-form-header">
                      <div>
                        <h3>
                          {editingTool
                            ? 'Edit Tool'
                            : 'Add New Tool'}
                        </h3>

                        <p>
                          Enter the tool information
                          below.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="close-button"
                        onClick={resetToolForm}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="tool-form-grid">
                      <div>
                        <label htmlFor="tool-name">
                          Tool Name
                        </label>

                        <input
                          id="tool-name"
                          type="text"
                          placeholder="Example: Image Compressor"
                          value={toolName}
                          onChange={(e) =>
                            setToolName(
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="tool-icon">
                          Icon
                        </label>

                        <input
                          id="tool-icon"
                          type="text"
                          placeholder="🛠️"
                          value={toolIcon}
                          onChange={(e) =>
                            setToolIcon(
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="tool-description">
                          Description
                        </label>

                        <textarea
                          id="tool-description"
                          placeholder="Describe what this tool does..."
                          value={toolDescription}
                          onChange={(e) =>
                            setToolDescription(
                              e.target.value
                            )
                          }
                          rows={3}
                        />
                      </div>

                      <div className="full-width">
                        <label htmlFor="tool-url">
                          Tool URL
                        </label>

                        <input
                          id="tool-url"
                          type="url"
                          placeholder="https://example.com"
                          value={toolUrl}
                          onChange={(e) =>
                            setToolUrl(
                              e.target.value
                            )
                          }
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

                        <span>
                          Tool is active
                        </span>
                      </label>
                    </div>

                    <div className="tool-form-buttons">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={resetToolForm}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-tool-button"
                        disabled={toolsLoading}
                      >
                        {toolsLoading
                          ? 'Saving...'
                          : editingTool
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
                      {activeTools} active /{' '}
                      {tools.length} total
                    </p>
                  </div>
                </div>

                {filteredTools.length === 0 ? (
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
                        ? 'Click Add Tool to create your first tool.'
                        : 'Try a different search.'}
                    </p>
                  </div>
                ) : (
                  <div className="tools-grid">
                    {filteredTools.map((tool) => (
                      <div
                        className={
                          tool.is_active
                            ? 'tool-admin-card'
                            : 'tool-admin-card inactive'
                        }
                        key={tool.id}
                      >
                        <div className="tool-card-top">
                          <div className="tool-card-icon">
                            {tool.icon || '🛠️'}
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

                        <h3>{tool.name}</h3>

                        <p>
                          {tool.description ||
                            'No description provided.'}
                        </p>

                        {tool.url && (
                          <a
                            className="tool-url"
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Tool ↗
                          </a>
                        )}

                        <div className="tool-card-actions">
                          <button
                            className="edit-tool-button"
                            onClick={() =>
                              openEditTool(tool)
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            className="toggle-tool-button"
                            onClick={() =>
                              toggleTool(tool)
                            }
                          >
                            {tool.is_active
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          <button
                            className="delete-tool-button"
                            onClick={() =>
                              deleteTool(tool.id)
                            }
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === 'statistics' && (
            <section className="panel-card">
              <h2>Statistics</h2>

              <p>
                Overview of your ToolMaster Pro
                platform.
              </p>

              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">
                    👥
                  </div>

                  <div>
                    <span>Users</span>

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
                    <span>Admins</span>

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
            </section>
          )}

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
              !isAdminLogin ? 'active' : ''
            }
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
            className={
              isAdminLogin ? 'active' : ''
            }
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
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
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
          <p className="message">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}

export default App
