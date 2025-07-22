import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from 'react-error-boundary';
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUser, FaEnvelope, FaLock, FaUsers, FaCheckCircle, FaTimesCircle, FaSyncAlt, FaEye, FaEyeSlash, FaUniversity, FaPhone } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import StudentDashboard from "./dashboards/StudentDashboard";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import OrganizationDashboard from "./dashboards/OrganizationDashboard";
import LexiAgent from './LexiAgent/LexiAgent';
import { BACKEND_BASE_URL } from "./config/config";

// Enhanced backend connectivity check
async function checkBackendConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ok: true,
      status: data.status || 'connected',
      message: data.message || 'Backend is operational'
    };
  } catch (error) {
    console.error('Backend connection error:', error);
    return {
      ok: false,
      message: error.name === 'AbortError' ? 'Connection timeout' : (error.message || 'Connection failed')
    };
  }
}

// Enhanced connection status component - Hidden for auth pages
function ConnectionStatus({ status, message, onRetry }) {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/'].includes(location.pathname);

  // Hide connection status on auth pages
  if (isAuthPage) return null;

  const statusConfig = {
    connected: {
      icon: <FaCheckCircle />,
      color: "#10b981",
      text: "Connected",
      bgColor: "rgba(16, 185, 129, 0.1)"
    },
    connecting: {
      icon: <FaSyncAlt className="fa-spin" />,
      color: "#f59e0b",
      text: "Connecting...",
      bgColor: "rgba(245, 158, 11, 0.1)"
    },
    disconnected: {
      icon: <FaTimesCircle />,
      color: "#ef4444",
      text: "Disconnected",
      bgColor: "rgba(239, 68, 68, 0.1)"
    }
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="connection-status"
      style={{
        background: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}30`,
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.9rem",
        fontWeight: "600"
      }}
    >
      {config.icon}
      <span>{config.text}</span>
      {message && <span className="status-message">- {message}</span>}
      {status === 'disconnected' && (
        <button
          onClick={onRetry}
          className="retry-btn"
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: `1px solid ${config.color}`,
            color: config.color,
            padding: "0.25rem 0.75rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: "500",
            transition: "all 0.2s ease"
          }}
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="error-fallback">
      <h2>Something went wrong</h2>
      <pre style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '1rem' }}>
        {error.message}
      </pre>
      <button onClick={resetErrorBoundary} className="submit-button" style={{ marginTop: '1rem' }}>
        Try again
      </button>
    </div>
  );
}

// Enhanced password validation
function validatePassword(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    score,
    checks,
    strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'excellent'
  };
}

// Enhanced campus logo component
function CampusLogo() {
  return (
    <motion.div
      className="campus-logo"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="logo-container">
        <svg viewBox="0 0 100 100" className="logo-svg">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
          <path d="M25 60 Q50 35 75 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="50" r="15" fill="rgba(255,255,255,0.2)" />
          <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
      </div>
      <h1 className="campus-title">CampusConnect</h1>
      <p className="campus-subtitle">Your Gateway to Campus Life</p>
    </motion.div>
  );
}

// Enhanced login component with navigation wrapper
function LoginWrapper({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    login: "",
    password: "",
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState("connecting");
  const [backendMessage, setBackendMessage] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Real-time validation
  useEffect(() => {
    const newErrors = {};

    if (form.login && form.login.trim().length > 0) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.login);
      const isPhone = /^\+?[\d\s-()]{10,}$/.test(form.login);

      if (!isEmail && !isPhone) {
        newErrors.login = "Please enter a valid email or phone number";
      }
    }

    if (form.password && form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
  }, [form.login, form.password]);

  const checkConnection = async () => {
    setBackendStatus("connecting");
    setBackendMessage("");

    const result = await checkBackendConnection();

    if (result.ok) {
      setBackendStatus("connected");
      setBackendMessage(result.message);
    } else {
      setBackendStatus("disconnected");
      setBackendMessage(result.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation check
    if (!form.login.trim() || !form.password.trim()) {
      setErrors({ general: "Please fill in all required fields" });
      return;
    }

    if (Object.keys(errors).length > 0 && !errors.general) {
      return;
    }

    if (backendStatus !== "connected") {
      setErrors({ general: "Cannot connect to server. Please check your connection and try again." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: form.login.trim(),
          password: form.password,
          remember: form.remember
        }),
      });

      const data = await response.json();
      console.log("Login response data:", data);

      const token = data.access_token || data.token; // fallback support


      if (response.ok && data.user) {
        // Store user data and token
        // Store user data and token
        localStorage.setItem("authToken", token);
        localStorage.setItem("currentUser", JSON.stringify(data.user)); // <-- Store full user object
        localStorage.setItem("currentUserRole", data.user.role);

        if (form.remember) {
          localStorage.setItem("rememberedUser", form.login.trim());
        }

        onLoginSuccess(data.user);

        // Navigate based on role
        const roleRoutes = {
          student: "/student",
          teacher: "/teacher",
          admin: "/admin",
          organization: "/organization"
        };

        navigate(roleRoutes[data.role] || "/student");
      } else {
        setLoginAttempts(prev => prev + 1);

        if (response.status === 401) {
          setErrors({ general: "Invalid credentials. Please check your email/phone and password." });
        } else if (response.status === 423) {
          setErrors({ general: "Account locked due to too many failed attempts. Please try again later." });
        } else if (response.status === 403) {
          setErrors({ general: "Account not activated. Please check your email for activation instructions." });
        } else {
          setErrors({ general: data.message || "Login failed. Please try again." });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  // Load remembered user
  useEffect(() => {
    const rememberedUser = localStorage.getItem("rememberedUser");
    if (rememberedUser) {
      setForm(prev => ({ ...prev, login: rememberedUser, remember: true }));
    }
  }, []);

  const handleForgotPassword = () => {
    // Fixed: Add proper forgot password functionality or placeholder
    alert("Password reset functionality will be implemented soon!");
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <CampusLogo />

        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="error-alert"
            >
              {errors.general}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="auth-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="input-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                type="text"
                name="login"
                value={form.login}
                onChange={handleChange}
                placeholder="Email or Phone Number"
                className={`form-input ${errors.login ? 'error' : ''}`}
                required
                autoComplete="username"
              />
            </div>
            <AnimatePresence>
              {errors.login && (
                <motion.span
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.login}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="input-wrapper has-password-toggle">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.span
                  className="field-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.password}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="form-options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              <span className="checkbox-text">Remember me</span>
            </label>
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </motion.div>

          <motion.button
            type="submit"
            className="submit-button"
            disabled={loading || backendStatus !== "connected"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <span className="loading-content">
                <FaSyncAlt className="fa-spin" />
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </motion.form>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              className="link-button primary"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>
          </p>
        </motion.div>

        <AnimatePresence>
          {loginAttempts > 0 && (
            <motion.div
              className="security-notice"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <small>Login attempts: {loginAttempts}/5</small>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Enhanced signup component with navigation wrapper
function SignupWrapper({ onSignupSuccess }) {
  const navigate = useNavigate(); // <-- Add this line

  const [formData, setFormData] = useState({
    role: "",
    name: "",
    university: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false
  });

  // Add university and department fields to step1Fields
  const step1Fields = [
    {
      name: 'role', icon: FaUsers, placeholder: 'Select Your Role', type: 'select', options: [
        { value: '', text: 'Select Your Role' },
        { value: 'student', text: 'Student' },
        { value: 'teacher', text: 'Teacher/Department' },
        { value: 'admin', text: 'Administrator' },
        { value: 'organization', text: 'Organization' } // Add organization role
      ]
    },
    { name: 'name', icon: FaUser, placeholder: 'Full Name', type: 'text' },
    { name: 'email', icon: FaEnvelope, placeholder: 'Email Address', type: 'email' },
    { name: 'mobile', icon: FaPhone, placeholder: 'Mobile Number', type: 'tel' },
    { name: 'university', icon: FaUniversity, placeholder: 'University Name', type: 'text' },
    // Conditionally show department field for teachers
    ...(formData.role === 'teacher' ? [{ name: 'department', icon: FaUsers, placeholder: 'Department', type: 'text' }] : [])
  ];

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ score: 0, checks: {} });
  const [backendStatus, setBackendStatus] = useState("connecting");
  const [backendMessage, setBackendMessage] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setBackendStatus("connecting");
    const result = await checkBackendConnection();
    setBackendStatus(result.ok ? "connected" : "disconnected");
    setBackendMessage(result.message);
  };

  // Real-time validation
  useEffect(() => {
    const newErrors = {};

    // Email validation
    if (formData.email && formData.email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.mobile && formData.mobile.trim().length > 0 && !/^\+?[\d\s-()]{10,}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid phone number";
    }

    // Password validation
    if (formData.password && formData.password.length > 0) {
      const validation = validatePassword(formData.password);
      setPasswordValidation(validation);

      if (validation.score < 3) {
        newErrors.password = "Password is too weak. Include uppercase, lowercase, number, and special character.";
      }
    }

    // Confirm password validation
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
  }, [formData.email, formData.mobile, formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const requiredFields = ['role', 'name', 'email', 'mobile', 'university'];
      const missingFields = requiredFields.filter(field => !formData[field] || !formData[field].trim());

      if (missingFields.length > 0) {
        setErrors({ general: "Please fill in all required fields" });
        return;
      }

      if (errors.email || errors.mobile) {
        setErrors({ general: "Please fix the validation errors before continuing" });
        return;
      }

      setErrors({});
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(errors).filter(key => key !== 'general').length > 0) {
      setErrors({ general: "Please fix all validation errors" });
      return;
    }

    if (!formData.terms) {
      setErrors({ terms: "You must accept the terms and conditions" });
      return;
    }

    if (backendStatus !== "connected") {
      setErrors({ general: "Cannot connect to server. Please check your connection and try again." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Trim and map fields to match backend Pydantic model
      const cleanedForm = {
        role: formData.role,
        full_name: formData.name.trim(),             // ✅ correct key
        university_name: formData.university.trim(), // ✅ correct key
        mobile_number: formData.mobile.trim(),       // ✅ correct key
        email: formData.email.trim(),                // ✅ correct key
        password: formData.password,                 // ✅
        confirm_password: formData.confirmPassword                        // ✅
      };

      console.log("🚀 Cleaned Form Payload:", cleanedForm); // 👈 Add this line
      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedForm),
      });


      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem("authToken", data.access_token);
        localStorage.setItem("currentUser", JSON.stringify(data.user)); // <-- Store full user object
        localStorage.setItem("currentUserRole", data.user.role);

        // Show success message
        alert("Account created successfully! Please check your email for verification instructions.");
        navigate("/login");
      } else {
        if (response.status === 409) {
          setErrors({ general: "An account with this email or phone number already exists." });
        } else if (response.status === 400) {
          setErrors({ general: data.message || "Invalid input. Please check your information." });
        } else {
          setErrors({ general: data.message || "Registration failed. Please try again." });
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const colors = {
      weak: "#ef4444",
      medium: "#f59e0b",
      strong: "#10b981",
      excellent: "#059669"
    };
    return colors[passwordValidation.strength] || "#6b7280";
  };

  const showTermsAndConditions = () => {
    alert("Terms and Conditions will be displayed in a modal here.");
  };

  const showPrivacyPolicy = () => {
    alert("Privacy Policy will be displayed in a modal here.");
  };

  // Form field configurations
  const passwordRequirements = [
    { key: 'length', text: '8+ characters' },
    { key: 'uppercase', text: 'Uppercase' },
    { key: 'lowercase', text: 'Lowercase' },
    { key: 'number', text: 'Number' },
    { key: 'special', text: 'Special char' }
  ];

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card signup-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <CampusLogo />

        <motion.div
          className="step-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        </motion.div>

        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="error-alert"
            >
              {errors.general}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="form-step"
              >
                <h3>Create Your Account</h3>

                {step1Fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    className="form-group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                  >
                    <div className="input-wrapper">
                      <field.icon className="input-icon" />
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          className="form-input"
                          required
                        >
                          {field.options.map(option => (
                            <option key={option.value} value={option.value}>{option.text}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className={`form-input ${errors[field.name] ? 'error' : ''}`}
                          required
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {errors[field.name] && (
                        <motion.span
                          className="field-error"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors[field.name]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                <motion.div
                  className="step-navigation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <button
                    type="button"
                    className="step-button secondary"
                    onClick={() => navigate("/login")}
                  >
                    Back to Login
                  </button>
                  <button
                    type="button"
                    className="step-button primary"
                    onClick={handleNext}
                  >
                    Next Step
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="form-step"
              >
                <h3>Secure Your Account</h3>

                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div className="input-wrapper has-password-toggle">
                    <FaLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create Password"
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      required
                      autoComplete="new-password" // <-- Add this line
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.password}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {formData.password && (
                      <motion.div
                        className="password-strength"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="password-strength-bar">
                          <motion.div
                            className="password-strength-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                            transition={{ duration: 0.3 }}
                            style={{
                              background: getPasswordStrengthColor()
                            }}
                          />
                        </div>
                        <div className="password-requirements">
                          {passwordRequirements.map((req, index) => (
                            <motion.span
                              key={req.key}
                              className={`requirement ${passwordValidation.checks[req.key] ? 'met' : ''}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05, duration: 0.2 }}
                            >
                              {passwordValidation.checks[req.key] ? '✓' : '○'} {req.text}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="input-wrapper has-password-toggle">
                    <FaLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      required
                      autoComplete="new-password" // <-- Add this line
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.confirmPassword}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="terms"
                      checked={formData.terms}
                      onChange={handleChange}
                      required
                    />
                    <span className="checkbox-text">
                      I agree to the{" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={showTermsAndConditions}
                      >
                        Terms and Conditions
                      </button>
                      {" "}and{" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={showPrivacyPolicy}
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                  <AnimatePresence>
                    {errors.terms && (
                      <motion.span
                        className="field-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.terms}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="step-navigation"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <button
                    type="button"
                    className="step-button secondary"
                    onClick={() => setStep(1)}
                  >
                    Previous
                  </button>
                  <motion.button
                    type="submit"
                    className="step-button primary"
                    disabled={loading || backendStatus !== "connected"}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <span className="loading-content">
                        <FaSyncAlt className="fa-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <p>
            Already have an account?{" "}
            <button
              type="button"
              className="link-button primary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="submit-button"
          style={{ marginTop: "1rem" }}
        >
          Go Home
        </button>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState("connecting");
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }

    setLoading(false);

    // Check backend connection for non-auth pages
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setBackendStatus("connecting");
    const result = await checkBackendConnection();
    setBackendStatus(result.ok ? "connected" : "disconnected");
    setBackendMessage(result.message);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData && userData.access_token) {
      localStorage.setItem("authToken", userData.access_token);
    }
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (userData.role) {
      localStorage.setItem("currentUserRole", userData.role);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberedUser');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <FaSyncAlt className="fa-spin" size={32} color="#667eea" />
            <p style={{ marginTop: '1rem', color: '#667eea' }}>Loading...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ConnectionStatus
        status={backendStatus}
        message={backendMessage}
        onRetry={checkConnection}
      />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginWrapper onLoginSuccess={handleLogin} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={`/${user.role}`} replace /> : <SignupWrapper onSignupSuccess={handleLogin} />}
        />
        <Route
          path="/student"
          element={
            user && user.role === 'student' ? (
              <>
                <StudentDashboard onLogout={handleLogout} />
                <LexiAgent
                  userRole={user.role}
                  userId={user._id || user.id}
                  currentUser={user}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/teacher"
          element={
            user && user.role === 'teacher' ? (
              <>
                <TeacherDashboard onLogout={handleLogout} />
                <LexiAgent
                  userRole={user.role}
                  userId={user._id || user.id}
                  currentUser={user}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <>
                <AdminDashboard onLogout={handleLogout} />
                <LexiAgent
                  userRole={user.role}
                  userId={user._id || user.id}
                  currentUser={user}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/organization"
          element={
            user && user.role === 'organization' ? (
              <>
                <OrganizationDashboard onLogout={handleLogout} />
                <LexiAgent
                  userRole={user.role}
                  userId={user._id || user.id}
                  currentUser={user}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <div className="App">
        <AppContent />
      </div>
    </ErrorBoundary>
  );
}

export default App;