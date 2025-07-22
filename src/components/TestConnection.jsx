import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

function TestConnection() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking connection...");
  const [lastChecked, setLastChecked] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    setStatus("checking");
    setMessage("Checking connection...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await axios.get(`${BACKEND_URL}/api/health`, {
        signal: controller.signal,
        timeout: 10000,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        setStatus("connected");
        setMessage(response.data?.message || "Backend is healthy");
        setRetryCount(0);
      } else {
        setStatus("error");
        setMessage(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Backend connection error:", error);
      setStatus("disconnected");

      if (error.code === "ECONNABORTED" || error.name === "AbortError") {
        setMessage("Connection timeout - Backend may be slow or down");
      } else if (error.code === "ECONNREFUSED") {
        setMessage("Connection refused - Backend server is not running");
      } else if (error.code === "ENETUNREACH") {
        setMessage("Network unreachable - Check your internet connection");
      } else {
        setMessage(`Connection failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkConnection();

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    checkConnection();
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "#10b981";
      case "checking":
        return "#f59e0b";
      case "disconnected":
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return "✅";
      case "checking":
        return "🔄";
      case "disconnected":
      case "error":
        return "❌";
      default:
        return "⚪";
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        border: `2px solid ${getStatusColor()}`,
        borderRadius: "8px",
        backgroundColor: `${getStatusColor()}10`,
        margin: "1rem 0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>{getStatusIcon()}</span>
        <strong style={{ color: getStatusColor() }}>
          Backend Status:{" "}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </strong>
      </div>

      <div style={{ color: "#374151", marginBottom: "0.5rem" }}>{message}</div>

      {lastChecked && (
        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Last checked: {lastChecked}
        </div>
      )}

      {status === "disconnected" && (
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={handleRetry}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Retry Connection {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      )}

      <div
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          marginTop: "0.5rem",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "0.5rem",
        }}
      >
        Endpoint: {BACKEND_URL}/api/health
      </div>
    </div>
  );
}

export default TestConnection;
