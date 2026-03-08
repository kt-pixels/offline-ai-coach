import { motion } from 'framer-motion';

function AppShell({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <div className="background-grid" />
      <header className="top-nav">
        <motion.div
          className="brand-block"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="brand-label">Aegis Coach OS</span>
          <h1>Offline Personal Growth Engine</h1>
        </motion.div>

        <motion.div
          className="user-pill"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div>
            <p className="muted">Signed in as</p>
            <strong>{user?.name}</strong>
          </div>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </motion.div>
      </header>

      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default AppShell;
