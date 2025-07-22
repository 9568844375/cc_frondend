import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiMic,
  FiLoader,
  FiThumbsUp,
  FiThumbsDown,
  FiShield,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiUserCheck,
  FiUser,
  FiUploadCloud,
  FiUsers,
  FiBarChart,
  FiSettings,
  FiTrendingUp,
  FiPaperclip,
  FiPlay,
  FiPause,
  FiVolume2,
  FiMicOff
} from 'react-icons/fi';
import './LexiAgent.css';

// Fixed: Use proper config import
import { BACKEND_BASE_URL } from '../config/config';

const ROLE_SUGGESTIONS = {
  student: [
    { icon: <FiBookOpen />, text: "Help me with my coursework and assignments" },
    { icon: <FiFileText />, text: "Analyze my uploaded resume and documents" },
    { icon: <FiCalendar />, text: "Show me upcoming campus events" },
    { icon: <FiUserCheck />, text: "Review my academic progress" },
    { icon: <FiUsers />, text: "Find study groups for my courses" },
    { icon: <FiUploadCloud />, text: "Upload documents for Q&A assistance" }
  ],
  teacher: [
    { icon: <FiCalendar />, text: "Show my teaching schedule" },
    { icon: <FiUsers />, text: "List my registered students" },
    { icon: <FiFileText />, text: "Help with proposal writing" },
    { icon: <FiBookOpen />, text: "Enhanced document analysis tools" },
    { icon: <FiUserCheck />, text: "Review student applications" },
    { icon: <FiUploadCloud />, text: "Generate course reports" }
  ],
  admin: [
    { icon: <FiBarChart />, text: "Show analytics dashboard" },
    { icon: <FiFileText />, text: "Generate system reports" },
    { icon: <FiSettings />, text: "User management tools" },
    { icon: <FiUsers />, text: "Review user activity logs" },
    { icon: <FiUserCheck />, text: "System health monitoring" },
    { icon: <FiTrendingUp />, text: "Export analytics data" }
  ],
  organization: [
    { icon: <FiCalendar />, text: "Event information and management" },
    { icon: <FiUsers />, text: "Collaboration tools" },
    { icon: <FiFileText />, text: "Document processing services" },
    { icon: <FiBookOpen />, text: "Organizational knowledge base" },
    { icon: <FiSettings />, text: "Team coordination tools" },
    { icon: <FiUploadCloud />, text: "Bulk document analysis" }
  ]
};

function getRoleGreeting(role, userName) {
  const greetings = {
    student: `Hi ${userName}! 👋 I'm Lexie, your AI study companion. I can help you with coursework, career guidance, and campus life!`,
    teacher: `Welcome ${userName}! 🎓 I'm Lexie, here to assist with teaching, research, student management, and academic collaboration.`,
    admin: `Hello ${userName}! 🔧 I'm Lexie, your administrative assistant for user management, analytics, and system oversight.`,
    organization: `Greetings ${userName}! 🏢 I'm Lexie, here to help with partnerships, events, and organizational collaboration.`
  };
  return greetings[role] || greetings.student;
}

function LexiAgent({ userRole = "student", userId = null, currentUser = null }) {
  // Enhanced security check - only render if user is properly authenticated
  if (!userId || !currentUser || !userRole) {
    console.log('LexiAgent: Missing authentication data', { userId, currentUser, userRole });
    return (
      <div className="agent-error">
        Missing authentication data. Please log in again to use LexiAgent.
      </div>
    );
  }



  const [role] = useState(userRole);
  const [user] = useState(currentUser);
  const SUGGESTIONS = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.student;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [feedbackGiven, setFeedbackGiven] = useState(new Set());
  const [userPreferences, setUserPreferences] = useState({});
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(Date.now());

  // File upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');

  // Voice states
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);

  const recognition = useRef(null);
  const bodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const LEXI_API_URL = `${BACKEND_BASE_URL}/lexie`;

  // Enhanced click handler with debugging
  const handleToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('LexiAgent: Toggle clicked', { currentOpen: open });
    setOpen(prevOpen => {
      const newOpen = !prevOpen;
      console.log('LexiAgent: Setting open to', newOpen);
      return newOpen;
    });
  }, [open]);

  // Enhanced keyboard handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(e);
    }
  }, [handleToggle]);

  // Rate limiting check
  const checkRateLimit = () => {
    const now = Date.now();
    const timeDiff = now - lastRequestTime;

    if (timeDiff < 60000) { // Within 1 minute
      if (requestCount >= 10) {
        setError('Rate limit exceeded. Please wait a moment before sending another message.');
        return false;
      }
    } else {
      setRequestCount(0);
    }

    setRequestCount(prev => prev + 1);
    setLastRequestTime(now);
    return true;
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => setListening(true);
      recognition.current.onend = () => setListening(false);
      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };
      recognition.current.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        }
        setListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      const scrollContainer = bodyRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  // Suggestion carousel
  useEffect(() => {
    if (!showSuggestions || !SUGGESTIONS || SUGGESTIONS.length === 0) return;

    const interval = setInterval(() => {
      setSuggestionIdx(idx => (idx + 1) % SUGGESTIONS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [showSuggestions, SUGGESTIONS]);

  // Token validation
  const validateToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setConnectionStatus('disconnected');
      setError('Please log in to continue');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken');
        setConnectionStatus('disconnected');
        setError('Session expired. Please log in again.');
        return false;
      }
    } catch (e) {
      localStorage.removeItem('authToken');
      setConnectionStatus('disconnected');
      setError('Invalid session. Please log in again.');
      return false;
    }

    return true;
  };

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if(!token){
      throw new Error("Session expired. Please log in again.");
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const handleIdentityQuery = (msg) => {
    const identityTriggers = [
      "who are you", "what is your name", "are you a bot", "who made you", "your identity"
    ];
    return identityTriggers.some(trigger =>
      msg.toLowerCase().includes(trigger)
    );
  };

  // Enhanced file upload handler
  const handleFileUpload = async (file) => {
    if (!validateToken()) return;

    if (!file.type.includes('pdf')) {
      setUploadError('Only PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadProgress(0);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/lexie/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadedFiles(prev => [...prev, {
        id: data.file_id,
        filename: data.filename,
        status: data.status
      }]);

      // Add success message to chat
      const successMessage = {
        from: 'lexi',
        text: `✅ Successfully uploaded "${file.name}". You can now ask questions about this document!`,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      setMessages(prev => [...prev, successMessage]);

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error.message);
      setUploadProgress(0);
    }
  };

  // Voice to text conversion
  const handleVoiceToText = async (audioBlob) => {
    if (!validateToken()) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('userId', userId);

      const response = await fetch(`${LEXI_API_URL}/voice/stt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Voice transcription failed');
      }

      const data = await response.json();
      setInput(data.text);
    } catch (error) {
      console.error('Voice to text error:', error);
      setError('Voice transcription failed. Please try again.');
    }
  };

  // Text to speech conversion
  const handleTextToSpeech = async (text, messageId) => {
    if (!validateToken()) return;

    setTtsLoading(true);

    try {
      const response = await fetch(`${LEXI_API_URL}/voice/tts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: text,
          userId: userId,
          messageId: messageId
        })
      });

      if (!response.ok) {
        throw new Error('Text to speech failed');
      }

      const data = await response.json();
      setAudioUrl(data.audio_url);

      // Auto-play the audio
      if (audioRef.current) {
        audioRef.current.src = data.audio_url;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Text to speech error:', error);
      setError('Audio generation failed. Please try again.');
    } finally {
      setTtsLoading(false);
    }
  };

  const sendMessage = async (msg = input) => {
    const messageText = typeof msg === 'string' ? msg.trim() : input.trim();

    if (!messageText || loading) return;

    if (!validateToken()) return;

    if (!checkRateLimit()) return;

    setError('');
    const userMessage = {
      from: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    // Handle identity queries locally
    if (handleIdentityQuery(messageText)) {
      const lexiResponse = {
        from: 'lexi',
        text: `I'm Lexie, your personal AI assistant for CampusConnect! I'm here to help you, ${user.name}, with your ${role} activities, document analysis, voice interactions, and provide personalized assistance based on your preferences.`,
        timestamp: new Date().toISOString(),
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, lexiResponse]);
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${LEXI_API_URL}/chat/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: messageText,
          user_id: userId.toString(),
          user_role: role,
          user_profile: {
            name: user.name,
            email: user.email,
            university: user.university || '',
            department: user.department || '',
            preferences: userPreferences
          },
          context: messages.slice(-10).map(msg => ({
            role: msg.from === 'user' ? 'user' : 'assistant',
            content: msg.text,
            timestamp: msg.timestamp
          })),
          uploaded_files: uploadedFiles.map(f => f.id)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          setConnectionStatus('disconnected');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || typeof data.response !== 'string') {
        throw new Error('Invalid response format from server');
      }

      let toolMsg = '';
      if (data.file_used) {
        toolMsg = `📄 Information retrieved from: ${data.file_used}`;
      } else if (data.tools_used?.length > 0) {
        toolMsg = `🔧 Used tools: ${data.tools_used.join(', ')}`;
      }

      const lexiResponse = {
        from: 'lexi',
        text: `${data.response}${toolMsg ? "\n\n" + toolMsg : ""}`,
        timestamp: new Date().toISOString(),
        confidence: data.confidence || 0.8,
        id: Date.now() + 2,
        canPlayAudio: true
      };

      setMessages(prev => [...prev, lexiResponse]);

      if (data.updated_preferences) {
        setUserPreferences(prev => ({ ...prev, ...data.updated_preferences }));
      }

      setConnectionStatus('connected');

    } catch (error) {
      console.error('Chat error:', error);

      let errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";

      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again with a shorter message.";
      } else if (error.message.includes('Session expired') || error.message.includes('log in')) {
        errorMessage = error.message;
        setConnectionStatus('disconnected');
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = "Network connection issue. Please check your internet and try again.";
        setConnectionStatus('disconnected');
      }

      const errorResponse = {
        from: 'lexi',
        text: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
        id: Date.now() + 3
      };
      setMessages(prev => [...prev, errorResponse]);
      setError('Failed to get response from AI assistant.');
    }

    setLoading(false);
  };

  const handleMic = () => {
    if (!recognition.current) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    if (listening) {
      recognition.current.stop();
      return;
    }

    setError('');
    try {
      recognition.current.start();
    } catch (error) {
      console.error('Microphone error:', error);
      setError('Microphone access denied or unavailable.');
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (index) => {
    const suggestion = personalizedSuggestions[index] || SUGGESTIONS[index];
    if (suggestion && suggestion.text) {
      sendMessage(suggestion.text);
      setShowSuggestions(false);
    }
  };

  const handleFeedback = async (type, messageId) => {
    if (!validateToken()) return;

    setFeedbackGiven(prev => new Set([...prev, messageId]));

    try {
      await fetch(`${LEXI_API_URL}/feedback/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          message_id: messageId,
          feedback_type: type,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([]);
      setShowSuggestions(true);
      setError('');
      setFeedbackGiven(new Set());
      setUploadedFiles([]);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  console.log('LexiAgent: Rendering with open =', open);

  return (
    <>
      <button
        className={`lexi-trigger glassy-shadow ${open ? 'open' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label={open ? "Close Lexie chat" : "Open Lexie chat"}
        tabIndex={0}
        role="button"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none',
          outline: 'none',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 24px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
        }}
      >
        <span className="bubble-anim" style={{ color: 'white', transition: 'transform 0.3s ease' }}>
          {open ? <FiX size={28} /> : <FiMessageCircle size={28} />}
        </span>
        {!open && (
          <span className="user-indicator">
             {user && user.name ? user.name.charAt(0).toUpperCase() : ""}
          </span>
        )}
      </button>

      {open && (
        <div className="lexi-popup glassmorphism" role="dialog" aria-modal="true" aria-label="Lexie AI Chat">
          <div className="lexi-header">
            <span className="lexi-avatar">L</span>
            <div className="header-info">
              <span className="title">Lexie – Your AI Assistant</span>
              <span className="user-info">{user.name} ({role})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className={`connection-indicator ${connectionStatus}`} title={`Connection: ${connectionStatus}`} />
              <button className="clear-chat-btn" onClick={clearChat} aria-label="Clear chat history">
                <FiX size={16} />
              </button>
            </div>
          </div>

          <div className="lexi-body" ref={bodyRef}>
            {messages.length === 0 && (
              <div className="welcome-section">
                <div className="greeting">{getRoleGreeting(role, user.name)}</div>
                <div className="suggestions-container">
                  {showSuggestions && SUGGESTIONS && SUGGESTIONS.length > 0 && (
                    <div className="suggestion-carousel">
                      <button className="suggestion-btn" onClick={() => handleSuggestion(suggestionIdx)}>
                        <span className="icon">{SUGGESTIONS[suggestionIdx]?.icon}</span>
                        <span className="text">{SUGGESTIONS[suggestionIdx]?.text}</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="privacy-notice">
                  <FiShield /> Your data is secure and personalized just for you.
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-list">
                <h4>📄 Uploaded Documents:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <FiFileText /> {file.filename}
                  </div>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message.id || index} className={`lexi-message-bubble ${message.from} ${message.isError ? 'error' : ''}`}>
                <div className="message-content">{message.text}</div>
                <div className="message-meta">
                  <span className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.from === 'lexi' && !message.isError && message.canPlayAudio && (
                    <div className="message-actions">
                      <button
                        className="tts-button"
                        onClick={() => handleTextToSpeech(message.text, message.id)}
                        disabled={ttsLoading}
                        title="Play audio"
                      >
                        {ttsLoading ? <FiLoader className="spin" size={14} /> : <FiVolume2 size={14} />}
                      </button>
                      {!feedbackGiven.has(message.id) && (
                        <>
                          <button
                            className="feedback-btn positive"
                            onClick={() => handleFeedback('positive', message.id)}
                            title="Helpful"
                          >
                            <FiThumbsUp size={14} />
                          </button>
                          <button
                            className="feedback-btn negative"
                            onClick={() => handleFeedback('negative', message.id)}
                            title="Not helpful"
                          >
                            <FiThumbsDown size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="lexi-message-bubble loading">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <FiX size={16} />
                {error}
                <button onClick={() => setError('')}>
                  <FiX size={14} />
                </button>
              </div>
            )}

            {uploadError && (
              <div className="error-message">
                <FiX size={16} />
                Upload Error: {uploadError}
                <button onClick={() => setUploadError('')}>
                  <FiX size={14} />
                </button>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span>Uploading... {uploadProgress}%</span>
              </div>
            )}
          </div>

          <div className="lexi-footer">
            <div className="lexi-input">
              <button
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Upload PDF document"
              >
                <FiPaperclip size={16} />
              </button>
              <textarea
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                disabled={loading || connectionStatus === 'disconnected'}
                rows={1}
              />
              <button
                className="mic-button"
                onClick={handleMic}
                disabled={loading || connectionStatus === 'disconnected'}
                title={listening ? "Stop recording" : "Start voice input"}
              >
                {listening ? <FiMicOff className="pulse" size={16} /> : <FiMic size={16} />}
              </button>
            </div>
            <button
              className="lexi-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || connectionStatus === 'disconnected'}
              title="Send message"
            >
              {loading ? <FiLoader className="spin" size={18} /> : <FiSend size={18} />}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Hidden audio element for TTS */}
          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />

          {requestCount > 7 && (
            <div className="rate-limit-warning">
              ⚠️ You have {10 - requestCount} messages remaining in this minute.
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default LexiAgent;