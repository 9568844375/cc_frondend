import React, { useState, useEffect } from "react";
import "./TeacherDashboard.css";
import LexiAgent from "../LexiAgent/LexiAgent";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function TeacherDashboard({ onLogout }) {
  const [active, setActive] = useState("Post Opportunity");
  
  // Add user state
  const [user, setUser] = useState({});
  
  const [profile, setProfile] = useState({
    name: "",
    department: "",
    email: "",
    officeHours: ""
  });
  const [editProfile, setEditProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", skills: "", deadline: "", stipend: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formMsg, setFormMsg] = useState("");
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState({ notification: true, emailCopy: false });

  // Add collaboration management
  const [collaborationForm, setCollaborationForm] = useState({
    title: "",
    description: "",
    requirements: "",
    duration: ""
  });
  const [collaborations, setCollaborations] = useState([]);

  // Fetch teacher profile and opportunities
  useEffect(() => {
    async function fetchData() {
      try {
        // Fix: Use consistent localStorage key
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (user && user._id) {
          setProfile({
            name: user.name,
            department: user.department || "",
            email: user.email,
            officeHours: user.officeHours || "",
          });
          // Opportunities
          const resOpp = await fetch(`${BACKEND_BASE_URL}/api/opportunities?teacherId=${user._id}`);
          const dataOpp = await resOpp.json();
          setOpportunities(dataOpp.opportunities || []);
          // Applications
          const resApp = await fetch(`${BACKEND_BASE_URL}/api/applications?teacherId=${user._id}`);
          const dataApp = await resApp.json();
          setApplications(dataApp.applications || []);
          // Messages (dummy)
          setMessages([
            { from: "Admin", content: "Please review new guidelines.", date: "2025-06-10" }
          ]);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        // fallback to empty
      }
    }
    fetchData();
  }, []);

  // Fetch collaborations
  useEffect(() => {
    async function fetchCollaborations() {
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const res = await fetch(`${BACKEND_BASE_URL}/api/collaborations?teacherId=${user._id}`);
        if (res.ok) {
          const data = await res.json();
          setCollaborations(data.collaborations || []);
        }
      } catch (err) {
        console.error('Failed to fetch collaborations:', err);
      }
    }
    fetchCollaborations();
  }, []);

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

  // Profile update
  const handleProfileChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setProfileErrors({});
    setProfileMsg("");
  };
  
  const handleProfileSubmit = async e => {
    e.preventDefault();
    let errors = {};
    if (!profile.name) errors.name = "Name required";
    if (!profile.email) errors.email = "Email required";
    if (!profile.department) errors.department = "Department required";
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    setProfileMsg("");
    try {
      // Fix: Use consistent localStorage key
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setProfileMsg("Profile updated successfully!");
      setEditProfile(false);
      // Fix: Use consistent localStorage key
      localStorage.setItem("currentUser", JSON.stringify({ ...user, ...profile }));
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileMsg("Failed to update profile.");
    }
  };

  // Opportunity form
  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormErrors({});
    setFormMsg("");
  };
  
  const handleOpportunitySubmit = async e => {
    e.preventDefault();
    let errors = {};
    if (!form.title) errors.title = "Title required";
    if (!form.description) errors.description = "Description required";
    if (!form.deadline) errors.deadline = "Deadline required";
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormMsg("");
    try {
      // Fix: Use consistent localStorage key
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = { ...form, teacherId: user._id, department: profile.department };
      const res = await fetch(`${BACKEND_BASE_URL}/api/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to post opportunity");
      const data = await res.json();
      setOpportunities([...opportunities, data.opportunity]);
      setForm({ title: "", description: "", skills: "", deadline: "", stipend: "" });
      setFormMsg("Opportunity posted!");
    } catch (error) {
      console.error('Opportunity post error:', error);
      setFormMsg("Failed to post opportunity.");
    }
  };

  // Collaboration form
  const handleCollaborationSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = { ...collaborationForm, teacherId: user._id };
      const res = await fetch(`${BACKEND_BASE_URL}/api/collaborations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setCollaborations([...collaborations, data.collaboration]);
        setCollaborationForm({ title: "", description: "", requirements: "", duration: "" });
        setFormMsg("Collaboration request posted!");
      }
    } catch (error) {
      setFormMsg("Failed to post collaboration request.");
    }
  };

  // Application accept/reject
  const handleAppAction = async (appId, action) => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "accept" ? "Accepted" : "Rejected" }),
      });
      if (!res.ok) throw new Error("Failed to update application");
      setApplications(applications.map(app =>
        app._id === appId ? { ...app, status: action === "accept" ? "Accepted" : "Rejected" } : app
      ));
    } catch (error) {
      console.error('Application action error:', error);
      // error feedback
    }
  };

  const handleSettingsChange = e => {
    setSettings({ ...settings, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  };

  // Search/filter for opportunities
  const [search, setSearch] = useState("");
  const filteredOpps = opportunities.filter(
    (opp) =>
      opp.title?.toLowerCase().includes(search.toLowerCase()) ||
      opp.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="teacher-dashboard">
      <LexiAgent 
        userRole="teacher" 
        userId={user._id || user.id} 
        currentUser={user} 
      />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">Teacher Dashboard</div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
        <div className="dashboard-menu">
          <div className="nav-buttons">
            {["Post Opportunity", "Manage Opportunities", "Collaboration Requests", "Received Applications", "Profile", "Messages", "Settings"].map(tab => (
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
          {active === "Post Opportunity" && (
            <form onSubmit={handleOpportunitySubmit} className="form-container">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  name="title" 
                  placeholder="Opportunity Title" 
                  value={form.title} 
                  onChange={handleFormChange} 
                  className={`form-input ${formErrors.title ? 'error' : ''}`}
                />
                {formErrors.title && <div className="error-message">{formErrors.title}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  name="description" 
                  placeholder="Opportunity Description" 
                  value={form.description} 
                  onChange={handleFormChange} 
                  className={`form-input form-textarea ${formErrors.description ? 'error' : ''}`}
                  rows="4"
                />
                {formErrors.description && <div className="error-message">{formErrors.description}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Required Skills</label>
                <input 
                  name="skills" 
                  placeholder="Required Skills (Optional)" 
                  value={form.skills} 
                  onChange={handleFormChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input 
                  name="deadline" 
                  placeholder="Application Deadline" 
                  value={form.deadline} 
                  onChange={handleFormChange} 
                  className={`form-input ${formErrors.deadline ? 'error' : ''}`}
                  type="date"
                />
                {formErrors.deadline && <div className="error-message">{formErrors.deadline}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Stipend</label>
                <input 
                  name="stipend" 
                  placeholder="Stipend Amount (Optional)" 
                  value={form.stipend} 
                  onChange={handleFormChange} 
                  className="form-input" 
                />
              </div>
              
              <button type="submit" className="submit-button">Post Opportunity</button>
              {formMsg && <div className={formMsg.includes("posted") ? "success-message" : "error-message"}>{formMsg}</div>}
            </form>
          )}
          
          {active === "Manage Opportunities" && (
            <div>
              <div className="search-container">
                <input
                  placeholder="Search opportunities..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <ul className="opportunity-list">
                {filteredOpps.map((opp, i) => (
                  <li className="opportunity-item" key={opp._id || i}>
                    <div className="opportunity-title">{opp.title}</div>
                    <div className="opportunity-meta">
                      <span>📚 Dept: {opp.department || opp.dept}</span>
                      <span>📅 Deadline: {opp.deadline}</span>
                      <span>💰 Stipend: {opp.stipend || 'Not specified'}</span>
                    </div>
                    <div className="opportunity-description">
                      {opp.description && opp.description.substring(0, 150)}
                      {opp.description && opp.description.length > 150 && '...'}
                    </div>
                  </li>
                ))}
                {filteredOpps.length === 0 && <li className="empty-state">No opportunities found.</li>}
              </ul>
            </div>
          )}
          
          {active === "Collaboration Requests" && (
            <div>
              <form onSubmit={handleCollaborationSubmit} className="form-container">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input 
                    name="title" 
                    placeholder="Collaboration Title" 
                    value={collaborationForm.title} 
                    onChange={(e) => setCollaborationForm({...collaborationForm, title: e.target.value})} 
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description" 
                    placeholder="Collaboration Description" 
                    value={collaborationForm.description} 
                    onChange={(e) => setCollaborationForm({...collaborationForm, description: e.target.value})} 
                    className="form-input form-textarea"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <input 
                    name="requirements" 
                    placeholder="Required Skills/Experience" 
                    value={collaborationForm.requirements} 
                    onChange={(e) => setCollaborationForm({...collaborationForm, requirements: e.target.value})} 
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input 
                    name="duration" 
                    placeholder="Expected Duration" 
                    value={collaborationForm.duration} 
                    onChange={(e) => setCollaborationForm({...collaborationForm, duration: e.target.value})} 
                    className="form-input"
                  />
                </div>
                <button type="submit" className="submit-button">Post Collaboration Request</button>
              </form>
              
              <div className="collaborations-list">
                <h3>Posted Collaboration Requests</h3>
                <ul className="opportunity-list">
                  {collaborations.map((collab, i) => (
                    <li className="opportunity-item" key={collab._id || i}>
                      <div className="opportunity-title">{collab.title}</div>
                      <div className="opportunity-details">{collab.description}</div>
                      <div className="opportunity-meta">Requirements: {collab.requirements}</div>
                    </li>
                  ))}
                  {collaborations.length === 0 && <li className="empty-state">No collaboration requests posted yet.</li>}
                </ul>
              </div>
            </div>
          )}
          
          {active === "Received Applications" && (
            <ul className="application-list">
              {applications.map((app, i) => (
                <li className="application-item" key={app._id || i}>
                  <div className="application-header">
                    <div className="application-info">
                      <div className="application-title">
                        {app.studentName || app.student || 'Student'} applied for {app.opportunityTitle || app.opp}
                      </div>
                      <div className="application-meta">
                        📅 {app.date || app.createdAt?.slice(0,10)} - 
                        <span className={`application-status status-${(app.status || "pending").toLowerCase()}`}>
                          {app.status || 'Pending'}
                        </span>
                      </div>
                      {app.coverLetter && (
                        <div className="application-excerpt">
                          📝 {app.coverLetter.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                    <div className="application-actions">
                      {(!app.status || app.status === 'Pending') && (
                        <>
                          <button onClick={() => handleAppAction(app._id, "accept")} className="action-button accept">
                            ✓ Accept
                          </button>
                          <button onClick={() => handleAppAction(app._id, "reject")} className="action-button reject">
                            ✗ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {applications.length === 0 && <li className="empty-state">No applications received yet.</li>}
            </ul>
          )}
          
          {active === "Profile" && (
            <div className="profile-section">
              {editProfile ? (
                <form onSubmit={handleProfileSubmit} className="form-container">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input 
                      name="name" 
                      value={profile.name} 
                      onChange={handleProfileChange} 
                      className={`form-input ${profileErrors.name ? 'error' : ''}`}
                    />
                    {profileErrors.name && <div className="error-message">{profileErrors.name}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      name="department" 
                      value={profile.department} 
                      onChange={handleProfileChange} 
                      className={`form-input ${profileErrors.department ? 'error' : ''}`}
                    />
                    {profileErrors.department && <div className="error-message">{profileErrors.department}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      name="email" 
                      value={profile.email} 
                      onChange={handleProfileChange} 
                      className={`form-input ${profileErrors.email ? 'error' : ''}`}
                      type="email"
                    />
                    {profileErrors.email && <div className="error-message">{profileErrors.email}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Office Hours</label>
                    <input 
                      name="officeHours" 
                      value={profile.officeHours} 
                      onChange={handleProfileChange} 
                      className="form-input"
                      placeholder="e.g., Mon-Fri 2-4 PM"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="save-button">Save Changes</button>
                    <button type="button" onClick={() => setEditProfile(false)} className="cancel-button">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="profile-card">
                  <div className="profile-header">
                    <div className="profile-avatar">{profile.name?.[0]?.toUpperCase() || "T"}</div>
                    <div className="profile-name">{profile.name || 'Teacher Name'}</div>
                    <div className="profile-role">Teacher</div>
                  </div>
                  <div className="profile-display">
                    <div className="profile-item"><span className="profile-label">Department:</span> <span className="profile-value">{profile.department}</span></div>
                    <div className="profile-item"><span className="profile-label">Email:</span> <span className="profile-value">{profile.email}</span></div>
                    <div className="profile-item"><span className="profile-label">Office Hours:</span> <span className="profile-value">{profile.officeHours}</span></div>
                  </div>
                  <button onClick={() => setEditProfile(true)} className="edit-button">Edit</button>
                </div>
              )}
              {profileMsg && <div className={profileMsg.includes("success") ? "success-message" : "error-message"}>{profileMsg}</div>}
            </div>
          )}
          {active === "Messages" && (
            <ul className="message-list">
              {messages.map((msg, i) => (
                <li className="message-item" key={i}>
                  <div className="message-header">
                    <span className="message-sender">{msg.from}</span>
                    <span className="message-date">{msg.date}</span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </li>
              ))}
            </ul>
          )}
          {active === "Settings" && (
            <form className="settings-form">
              <div className="settings-group">
                <label className="settings-label">
                  <input type="checkbox" name="notification" checked={settings.notification} onChange={handleSettingsChange} className="settings-checkbox" />
                  Enable notifications
                </label>
                <label className="settings-label">
                  <input type="checkbox" name="emailCopy" checked={settings.emailCopy} onChange={handleSettingsChange} className="settings-checkbox" />
                  Send email copy
                </label>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}