// Development configuration
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const LEXI_API_URL = `${BACKEND_BASE_URL}/lexie`;

// Export configuration
export { BACKEND_BASE_URL, LEXI_API_URL };