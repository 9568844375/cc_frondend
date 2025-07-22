import React, { useState, useEffect } from "react";
import ApplyForm from "../components/ApplyForm";
import "./StudentDashboard.css"; // Add CSS import
import LexiAgent from "../LexiAgent/LexiAgent";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

/**
 * StudentDashboard component renders the main dashboard for students.
 * Now fully connected to backend API for opportunities and applications.
 */
function StudentDashboard({ onLogout }) {
  const [active, setActive] = useState("Browse Opportunities");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Add user state
  const [user, setUser] = useState({});

  // Opportunities from backend
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [oppsError, setOppsError] = useState("");

  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    university: "",
    mobile: "",
  });
  const [editProfile, setEditProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState("");

  // User applications
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [appMsg, setAppMsg] = useState("");

  // Inquiries, messages, notifications (dummy for now)
  const [inquiries, setInquiries] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Add collaboration features
  const [collaborationRequests, setCollaborationRequests] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);

  // Fetch opportunities from backend
  useEffect(() => {
    async function fetchOpportunities() {
      setLoadingOpps(true);
      setOppsError("");
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/opportunities`);
        if (!res.ok) throw new Error("Failed to fetch opportunities");
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      } catch (err) {
        setOppsError("Could not load opportunities.");
      }
      setLoadingOpps(false);
    }
    fetchOpportunities();
  }, []);

  // Fetch profile and applications from backend
  useEffect(() => {
    async function fetchProfileAndApps() {
      setLoadingApps(true);
      setAppsError("");
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (user && user._id) {
          // Profile
          setProfile({
            name: user.name,
            email: user.email,
            university: user.university,
            mobile: user.mobile,
          });
          // Applications
          const res = await fetch(`${BACKEND_BASE_URL}/api/applications?studentId=${user._id}`);
          if (!res.ok) throw new Error("Failed to fetch applications");
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (err) {
        setAppsError("Could not load your applications.");
      }
      setLoadingApps(false);
    }
    fetchProfileAndApps();
  }, []);

  // Dummy fetch for inquiries/messages/notifications
  useEffect(() => {
    setInquiries([
      { from: "Computer Science Dept", question: "Can you provide more info?", date: "2025-06-01" },
    ]);
    setMessages([
      { from: "Prof. Smith", content: "Looking forward to our collaboration!", date: "2025-06-10" },
    ]);
    setNotifications([
      "Your profile was updated successfully.",
      "New opportunity posted in Biology.",
    ]);
  }, []);

  // Fetch collaboration requests
  useEffect(() => {
    async function fetchCollaborations() {
      setLoadingCollabs(true);
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const res = await fetch(`${BACKEND_BASE_URL}/api/collaborations?studentId=${user._id}`);
        if (res.ok) {
          const data = await res.json();
          setCollaborationRequests(data.collaborations || []);
        }
      } catch (err) {
        console.error('Failed to fetch collaborations:', err);
      }
      setLoadingCollabs(false);
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
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    if (!profile.name) errors.name = "Name required";
    if (!profile.email) errors.email = "Email required";
    if (!profile.university) errors.university = "University required";
    if (!profile.mobile) errors.mobile = "Mobile required";
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    setProfileMsg("");
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const res = await fetch(`${BACKEND_BASE_URL}/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setProfileMsg("Profile updated successfully!");
      setEditProfile(false);
      // Update localStorage
      localStorage.setItem("currentUser", JSON.stringify({ ...user, ...profile }));
    } catch {
      setProfileMsg("Failed to update profile.");
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setProfileErrors({});
    setProfileMsg("");
  };

  // Withdraw application
  const handleWithdraw = async (appId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    setAppMsg("");
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/applications/${appId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to withdraw application");
      setApplications(applications.filter(app => app._id !== appId));
      setAppMsg("Application withdrawn.");
    } catch {
      setAppMsg("Failed to withdraw application.");
    }
  };

  // Submit application
  const handleApplySubmit = async (form) => {
    setAppMsg("");
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const payload = {
        ...form,
        studentId: user._id,
        opportunityId: selectedOpportunity._id,
      };
      // File upload (CV)
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
      if (form.cv) fd.append("cv", form.cv);
      const res = await fetch(`${BACKEND_BASE_URL}/api/applications`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to submit application");
      const data = await res.json();
      setApplications([...applications, data.application]);
      setAppMsg("Application submitted!");
    } catch {
      setAppMsg("Failed to submit application.");
    }
  };

  // Search/filter for opportunities
  const [search, setSearch] = useState("");
  const filteredOpps = opportunities.filter(
    (card) =>
      card.title?.toLowerCase().includes(search.toLowerCase()) ||
      (card.department || card.dept || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="student-dashboard">
      <LexiAgent 
        userRole="student" 
        userId={user._id || user.id} 
        currentUser={user} 
      />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">Student Dashboard</div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
        <div className="dashboard-nav">
          <div className="nav-buttons">
            {["Browse Opportunities", "My Applications", "Collaborations", "Profile", "Inquiries", "Messages", "Notifications"].map(tab => (
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
          {active === "Browse Opportunities" && (
            <div>
              <input
                placeholder="Search opportunities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
                style={{ marginBottom: 12, width: "60%" }}
              />
              {loadingOpps ? (
                <div className="loading-text"><span className="loading-spinner"></span>Loading opportunities...</div>
              ) : oppsError ? (
                <div className="error-message">{oppsError}</div>
              ) : (
                <ul className="opportunity-list">
                  {filteredOpps.map((card, i) => (
                    <li className="opportunity-item" key={card._id || i}>
                      <div className="opportunity-title">{card.title}</div>
                      <div className="opportunity-details">
                        {card.department || card.dept} (Deadline: {card.deadline})
                      </div>
                      <button className="apply-button" onClick={() => { setSelectedOpportunity(card); setShowApplyForm(true); }}>Apply</button>
                    </li>
                  ))}
                  {filteredOpps.length === 0 && <li className="empty-state">No opportunities found.</li>}
                </ul>
              )}
              {showApplyForm && selectedOpportunity && (
                <div className="apply-form-modal">
                  <div className="apply-form-content">
                    <div className="modal-header">
                      <div className="modal-title">Apply for {selectedOpportunity.title}</div>
                      <button className="close-button" onClick={() => setShowApplyForm(false)}>&times;</button>
                    </div>
                    <ApplyForm
                      opportunity={selectedOpportunity}
                      onClose={() => setShowApplyForm(false)}
                      onSubmit={handleApplySubmit}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {active === "My Applications" && (
            <div>
              {loadingApps ? (
                <div className="loading-text"><span className="loading-spinner"></span>Loading applications...</div>
              ) : appsError ? (
                <div className="error-message">{appsError}</div>
              ) : (
                <ul className="application-list">
                  {applications.map((app, i) => (
                    <li className="application-item" key={app._id || i}>
                      <div className="application-info">
                        <div className="application-title">{app.title || app.opportunityTitle}</div>
                        <div>{app.department || app.dept || app.opportunityDept}</div>
                        <div className={`application-status status-${(app.status || "pending").toLowerCase()}`}>Status: {app.status}</div>
                      </div>
                      <button className="withdraw-button" onClick={() => handleWithdraw(app._id)}>Withdraw</button>
                    </li>
                  ))}
                  {applications.length === 0 && <li className="empty-state">No applications yet.</li>}
                </ul>
              )}
              {appMsg && <div className={appMsg.includes("withdrawn") || appMsg.includes("submitted") ? "success-message" : "error-message"}>{appMsg}</div>}
            </div>
          )}
          {active === "Collaborations" && (
            <div>
              {loadingCollabs ? (
                <div className="loading-text"><span className="loading-spinner"></span>Loading collaborations...</div>
              ) : (
                <ul className="collaboration-list">
                  {collaborationRequests.map((collab, i) => (
                    <li className="collaboration-item" key={collab._id || i}>
                      <div className="collaboration-info">
                        <div className="collaboration-title">{collab.title}</div>
                        <div className="collaboration-teacher">{collab.teacherName}</div>
                        <div className={`collaboration-status status-${(collab.status || "pending").toLowerCase()}`}>
                          Status: {collab.status || 'Pending'}
                        </div>
                      </div>
                    </li>
                  ))}
                  {collaborationRequests.length === 0 && <li className="empty-state">No collaboration requests yet.</li>}
                </ul>
              )}
            </div>
          )}
          {active === "Profile" && (
            <div className="profile-section">
              {editProfile ? (
                <form onSubmit={handleProfileSubmit} className="profile-form">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input name="name" value={profile.name} onChange={handleProfileChange} className="form-input" />
                    {profileErrors.name && <div className="error-message">{profileErrors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input name="email" value={profile.email} onChange={handleProfileChange} className="form-input" />
                    {profileErrors.email && <div className="error-message">{profileErrors.email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">University</label>
                    <input name="university" value={profile.university} onChange={handleProfileChange} className="form-input" />
                    {profileErrors.university && <div className="error-message">{profileErrors.university}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input name="mobile" value={profile.mobile} onChange={handleProfileChange} className="form-input" />
                    {profileErrors.mobile && <div className="error-message">{profileErrors.mobile}</div>}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-button">Save</button>
                    <button type="button" onClick={() => setEditProfile(false)} className="cancel-button">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="profile-item"><span className="profile-label">Name:</span> <span className="profile-value">{profile.name}</span></div>
                  <div className="profile-item"><span className="profile-label">Email:</span> <span className="profile-value">{profile.email}</span></div>
                  <div className="profile-item"><span className="profile-label">University:</span> <span className="profile-value">{profile.university}</span></div>
                  <div className="profile-item"><span className="profile-label">Mobile:</span> <span className="profile-value">{profile.mobile}</span></div>
                  <button onClick={() => setEditProfile(true)} className="edit-button">Edit</button>
                </div>
              )}
              {profileMsg && <div className={profileMsg.includes("success") ? "success-message" : "error-message"}>{profileMsg}</div>}
            </div>
          )}
          {active === "Inquiries" && (
            <ul>
              {inquiries.map((inq, i) => (
                <li key={i}>{inq.date}: {inq.from} - {inq.question}</li>
              ))}
            </ul>
          )}
          {active === "Messages" && (
            <ul>
              {messages.map((msg, i) => (
                <li key={i}>{msg.date}: {msg.from} - {msg.content}</li>
              ))}
            </ul>
          )}
          {active === "Notifications" && (
            <ul>
              {notifications.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
