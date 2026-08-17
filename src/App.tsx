* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #f1f5f9;
  color: #0f172a;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

/* =========================
   LOGIN
========================= */

.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, #2563eb 0, transparent 35%),
    linear-gradient(135deg, #0f172a, #1e3a8a);
}

.auth-card {
  width: 100%;
  max-width: 430px;
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
  color: #fff;
}

.auth-card h1 {
  margin: 0 0 8px;
  text-align: center;
  font-size: 30px;
}

.subtitle {
  margin: 0 0 25px;
  text-align: center;
  color: #cbd5e1;
}

.mode-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.mode-buttons button {
  flex: 1;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: #334155;
  color: #fff;
}

.mode-buttons button.active {
  background: #2563eb;
}

.signup-toggle {
  width: 100%;
  margin-bottom: 18px;
  border: 0;
  background: transparent;
  color: #93c5fd;
}

.auth-card label {
  display: block;
  margin: 14px 0 7px;
  color: #e2e8f0;
}

.auth-card input {
  width: 100%;
  padding: 13px;
  border: 1px solid #475569;
  border-radius: 10px;
  outline: none;
  background: #0f172a;
  color: #fff;
}

.auth-card input:focus {
  border-color: #60a5fa;
}

.submit-button {
  width: 100%;
  margin-top: 22px;
  padding: 13px;
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
}

.submit-button:hover {
  background: #1d4ed8;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin: 18px 0 0;
  color: #fbbf24;
  text-align: center;
}

/* =========================
   ADMIN LAYOUT
========================= */

.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #f1f5f9;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 255px;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background: #0f172a;
  color: #fff;
  box-shadow: 8px 0 25px rgba(15, 23, 42, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 10px 28px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  font-weight: 800;
  font-size: 14px;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
}

.brand span {
  display: block;
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.nav-item {
  width: 100%;
  padding: 13px 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #cbd5e1;
  text-align: left;
  transition: 0.2s ease;
}

.nav-item:hover {
  background: #1e293b;
  color: #fff;
}

.nav-item.active {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
}

.logout-button {
  width: 100%;
  margin-top: auto;
  padding: 12px 14px;
  border: 0;
  border-radius: 10px;
  background: #7f1d1d;
  color: #fff;
}

.logout-button:hover {
  background: #991b1b;
}

/* =========================
   MAIN
========================= */

.admin-main {
  width: calc(100% - 255px);
  min-height: 100vh;
  margin-left: 255px;
  padding: 30px;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.admin-header h1 {
  margin: 0;
  font-size: 30px;
  color: #0f172a;
}

.admin-header p {
  margin: 7px 0 0;
  color: #64748b;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.06);
}

.avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
}

.admin-profile strong,
.admin-profile span {
  display: block;
}

.admin-profile strong {
  font-size: 13px;
}

.admin-profile span {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
}

/* =========================
   STAT CARDS
========================= */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.06);
}

.stat-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  font-size: 22px;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.stat-card strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 26px;
}

.stat-card.blue .stat-icon {
  background: #dbeafe;
}

.stat-card.purple .stat-icon {
  background: #ede9fe;
}

.stat-card.green .stat-icon {
  background: #dcfce7;
}

.stat-card.orange .stat-icon {
  background: #ffedd5;
}

/* =========================
   PANELS
========================= */

.panel-card {
  padding: 25px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 25px rgba(15, 23, 42, 0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.panel-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-button {
  padding: 9px 14px;
  border: 0;
  border-radius: 9px;
  background: #2563eb;
  color: #fff;
}

.refresh-button:hover {
  background: #1d4ed8;
}

.refresh-button:disabled {
  opacity: 0.6;
}

/* =========================
   TABLE
========================= */

.users-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

.users-table th {
  padding: 13px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  text-align: left;
  text-transform: uppercase;
}

.users-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 14px;
}

.users-table tbody tr:hover {
  background: #f8fafc;
}

.role {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.admin-role {
  background: #ede9fe;
  color: #6d28d9;
}

.user-role {
  background: #dcfce7;
  color: #15803d;
}

.role-button {
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 12px;
  font-weight: 600;
}

.role-button:hover {
  background: #c7d2fe;
}

.current-user {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

/* =========================
   EMPTY PAGES
========================= */

.empty-panel {
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  border-radius: 20px;
  background: #eff6ff;
  font-size: 32px;
}

.empty-panel h2 {
  margin: 0;
}

.empty-panel p {
  color: #64748b;
}

/* =========================
   USER DASHBOARD
========================= */

.user-dashboard {
  min-height: 100vh;
  padding: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, #2563eb 0, transparent 35%),
    linear-gradient(135deg, #0f172a, #1e3a8a);
}

.user-card {
  width: 100%;
  max-width: 900px;
  padding: 30px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  backdrop-filter: blur(15px);
}

.user-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 30px;
}

.user-topbar h1 {
  margin: 0;
}

.user-topbar p {
  margin: 5px 0 0;
  color: #cbd5e1;
}

.user-topbar button {
  padding: 10px 18px;
  border: 0;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
}

.user-tools-box {
  margin-top: 25px;
  padding: 25px;
  border-radius: 15px;
  background: rgba(15, 23, 42, 0.6);
}

/* =========================
   MOBILE
========================= */

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .sidebar {
    position: static;
    width: 100%;
    min-height: auto;
  }

  .admin-layout {
    display: block;
  }

  .admin-main {
    width: 100%;
    margin-left: 0;
    padding: 20px;
  }

  .sidebar nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .nav-item {
    width: auto;
  }

  .logout-button {
    margin-top: 20px;
  }

  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-main {
    padding: 15px;
  }

  .panel-card {
    padding: 18px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-header h1 {
    font-size: 24px;
  }

  .user-dashboard {
    padding: 15px;
  }

  .user-card {
    padding: 20px;
  }

  .user-topbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
