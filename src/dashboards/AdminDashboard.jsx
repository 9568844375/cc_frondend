import React, { useState, useEffect } from "react";
import "./AdminDashboard.css"; // Add CSS import
import LexiAgent from "../LexiAgent/LexiAgent";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

function AdminDashboard({ onLogout }) {
  const [active, setActive] = useState("User Management");
  
  // Add user state
  const [user, setUser] = useState({});
  
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, totalOpportunities: 0, totalApplications: 0 });
  const [opportunities, setOpportunities] = useState([]);
  const [reports, setReports] = useState([]);
  const [settings, setSettings] = useState({ siteTitle: "CampusConnect", supportEmail: "support@campusconnect.edu" });
  const [settingsError, setSettingsError] = useState("");
  const [msg, setMsg] = useState("");

  // Add Lexie analytics
  const [lexieAnalytics, setLexieAnalytics] = useState({
    totalChats: 0,
    activeUsers: 0,
    popularQueries: [],
    feedbackStats: { positive: 0, negative: 0 }
  });

  // Fetch users, stats, opportunities, reports
  useEffect(() => {
    async function fetchData() {
      try {
        // Users
        const resUsers = await fetch(`${BACKEND_BASE_URL}/api/users`);
        const dataUsers = await resUsers.json();
        setUsers(dataUsers.users || []);
        // Stats
        const resStats = await fetch(`${BACKEND_BASE_URL}/api/admin/stats`);
        const dataStats = await resStats.json();
        setStats(dataStats || {});
        // Opportunities
        const resOpp = await fetch(`${BACKEND_BASE_URL}/api/opportunities`);
        const dataOpp = await resOpp.json();
        setOpportunities(dataOpp.opportunities || []);
        // Reports
        const resReports = await fetch(`${BACKEND_BASE_URL}/api/reports`);
        const dataReports = await resReports.json();
        setReports(dataReports.reports || []);
      } catch {
        setUsersError("Failed to load admin data.");
      }
    }
    fetchData();
  }, []);

  // Fetch Lexie analytics
  useEffect(() => {
    async function fetchLexieAnalytics() {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/admin/analytics/lexie`);
        if (res.ok) {
          const data = await res.json();
          setLexieAnalytics(data.analytics || {});
        }
      } catch (err) {
        console.error('Failed to fetch Lexie analytics:', err);
      }
    }
    fetchLexieAnalytics();
  }, []);

  // Approve/reject/delete user
  const handleApprove = async (userId) => {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Active" }),
      });
      setUsers(users.map(u => u._id === userId ? { ...u, status: "Active" } : u));
    } catch {}
  };
  const handleReject = async (userId) => {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
      setUsers(users.map(u => u._id === userId ? { ...u, status: "Rejected" } : u));
    } catch {}
  };
  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await fetch(`${BACKEND_BASE_URL}/api/users/${userId}`, { method: "DELETE" });
      setUsers(users.filter(u => u._id !== userId));
    } catch {}
  };

  // Settings
  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
    setSettingsError("");
    setMsg("");
  };
  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    if (!settings.siteTitle.trim() || !settings.supportEmail.trim()) {
      setSettingsError("All fields are required.");
      return;
    }
    setSettingsError("");
    setMsg("Settings saved successfully!");
  };

  // Search/filter for users
  const [search, setSearch] = useState("");
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Add useEffect to get user data
  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  return (
    <div className="admin-dashboard">
      <LexiAgent 
        userRole="admin" 
        userId={user._id || user.id} 
        currentUser={user} 
      />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">Admin Dashboard</div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
        <div className="dashboard-menu">
          <div className="nav-buttons">
            {["User Management", "Analytics", "All Opportunities", "Lexie Analytics", "Moderation", "Reports & Feedback", "Settings"].map(tab => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`nav-button${active === tab ? " active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="dashboard-content">
          {active === "User Management" && (
            <div>
              <input
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
                style={{ marginBottom: 12, width: "60%" }}
              />
              {usersError ? (
                <div className="error-message">{usersError}</div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => (
                        <tr key={user._id || i}>
                          <td>{user.name}</td>
                          <td>{user.role}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`admin-status-badge ${user.status?.toLowerCase()}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="admin-action-buttons">
                            {user.status !== "Active" && (
                              <button className="admin-action-btn approve" onClick={() => handleApprove(user._id)}>Approve</button>
                            )}
                            {user.status === "Pending" && (
                              <button className="admin-action-btn reject" onClick={() => handleReject(user._id)}>Reject</button>
                            )}
                            <button className="admin-action-btn delete" onClick={() => handleDelete(user._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="empty-state">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {active === "Analytics" && (
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-header">
                  <span className="admin-stat-title">Total Users</span>
                  <span className="admin-stat-icon">👤</span>
                </div>
                <div className="admin-stat-value">{stats.totalUsers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-header">
                  <span className="admin-stat-title">Total Opportunities</span>
                  <span className="admin-stat-icon">📋</span>
                </div>
                <div className="admin-stat-value">{stats.totalOpportunities}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-header">
                  <span className="admin-stat-title">Total Applications</span>
                  <span className="admin-stat-icon">📝</span>
                </div>
                <div className="admin-stat-value">{stats.totalApplications}</div>
              </div>
            </div>
          )}
          {active === "All Opportunities" && (
            <ul className="opportunity-list">
              {opportunities.map((opp, idx) => (
                <li className="opportunity-item" key={opp._id || idx}>
                  <div className="opportunity-title">{opp.title}</div>
                  <div className="opportunity-meta">
                    <span>Dept: {opp.department || opp.dept}</span>
                    <span>Status: {opp.status || "Open"}</span>
                  </div>
                </li>
              ))}
              {opportunities.length === 0 && <li className="empty-state">No opportunities found.</li>}
            </ul>
          )}
          {active === "Moderation" && (
            <div>
              <b>Moderation Alerts:</b> There are {reports.filter(r => r.status === "Open").length} flagged items to review.
            </div>
          )}
          {active === "Reports & Feedback" && (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Report</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id || r.id}>
                      <td>{r._id || r.id}</td>
                      <td>{r.description}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr><td colSpan={3} className="empty-state">No reports found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {active === "Settings" && (
            <form className="admin-settings-form" style={{ maxWidth: 400 }} onSubmit={handleSettingsSubmit}>
              {settingsError && <div className="admin-message error">{settingsError}</div>}
              <div className="admin-form-group">
                <label htmlFor="siteTitle" className="admin-form-label">Site Title:</label>
                <input
                  type="text"
                  id="siteTitle"
                  name="siteTitle"
                  value={settings.siteTitle}
                  onChange={handleSettingsChange}
                  className="admin-form-input"
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="supportEmail" className="admin-form-label">Support Email:</label>
                <input
                  type="email"
                  id="supportEmail"
                  name="supportEmail"
                  value={settings.supportEmail}
                  onChange={handleSettingsChange}
                  className="admin-form-input"
                />
              </div>
              <button type="submit" className="admin-form-submit">
                Save Settings
              </button>
              {msg && <div className="admin-message success">{msg}</div>}
            </form>
          )}
          {active === "Lexie Analytics" && (
            <div className="analytics-section">
              <h3>Lexie AI Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-value">{lexieAnalytics.totalChats}</div>
                  <div className="analytics-label">Total Chats</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-value">{lexieAnalytics.activeUsers}</div>
                  <div className="analytics-label">Active Users</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-value">{lexieAnalytics.feedbackStats.positive}</div>
                  <div className="analytics-label">Positive Feedback</div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-value">{lexieAnalytics.feedbackStats.negative}</div>
                  <div className="analytics-label">Negative Feedback</div>
                </div>
              </div>
              <div className="popular-queries">
                <h4>Popular Queries</h4>
                <ul className="query-list">
                  {lexieAnalytics.popularQueries?.map((query, i) => (
                    <li key={i} className="query-item">
                      <span className="query-text">{query.text}</span>
                      <span className="query-count">{query.count} times</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
