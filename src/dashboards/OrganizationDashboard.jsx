import React, { useState, useEffect } from "react";
import "./OrganizationDashboard.css";
import LexiAgent from "../LexiAgent/LexiAgent";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

function OrganizationDashboard({ onLogout }) {
  const [active, setActive] = useState("Partnership Opportunities");
  const [partnerships, setPartnerships] = useState([]);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState({
    name: "",
    type: "",
    email: "",
    description: ""
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (user && user._id) {
          setProfile({
            name: user.name,
            type: user.organizationType || "",
            email: user.email,
            description: user.description || ""
          });
          
          // Fetch partnerships
          const resPartner = await fetch(`${BACKEND_BASE_URL}/api/partnerships?orgId=${user._id}`);
          if (resPartner.ok) {
            const dataPartner = await resPartner.json();
            setPartnerships(dataPartner.partnerships || []);
          }
          
          // Fetch events
          const resEvents = await fetch(`${BACKEND_BASE_URL}/api/events?orgId=${user._id}`);
          if (resEvents.ok) {
            const dataEvents = await resEvents.json();
            setEvents(dataEvents.events || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization data:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="organization-dashboard">
      <LexiAgent 
        userRole="organization" 
        userId={profile._id} 
        currentUser={profile} 
      />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">Organization Dashboard</div>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
        <div className="dashboard-menu">
          <div className="nav-buttons">
            {["Partnership Opportunities", "Event Management", "Collaboration Tools", "Profile", "Analytics"].map(tab => (
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
          {active === "Partnership Opportunities" && (
            <div>
              <h3>Partnership Opportunities</h3>
              <ul className="partnership-list">
                {partnerships.map((partnership, i) => (
                  <li key={partnership._id || i} className="partnership-item">
                    <div className="partnership-title">{partnership.title}</div>
                    <div className="partnership-description">{partnership.description}</div>
                  </li>
                ))}
                {partnerships.length === 0 && <li className="empty-state">No partnerships available.</li>}
              </ul>
            </div>
          )}
          {active === "Event Management" && (
            <div>
              <h3>Upcoming Events</h3>
              <ul className="event-list">
                {events.map((event, i) => (
                  <li key={event._id || i} className="event-item">
                    <div className="event-title">{event.title}</div>
                    <div className="event-date">{event.date}</div>
                    <div className="event-description">{event.description}</div>
                  </li>
                ))}
                {events.length === 0 && <li className="empty-state">No events scheduled.</li>}
              </ul>
            </div>
          )}
          {active === "Profile" && (
            <div className="profile-section">
              <div className="profile-display">
                <div className="profile-item">
                  <span className="profile-label">Organization Name:</span>
                  <span className="profile-value">{profile.name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Type:</span>
                  <span className="profile-value">{profile.type}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{profile.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Description:</span>
                  <span className="profile-value">{profile.description}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizationDashboard;