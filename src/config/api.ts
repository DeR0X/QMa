// API Configuration
const API_CONFIG = {
  // Use environment variables if available, fallback to localhost
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
  
  // API versions
  V1: '/api',
  V2: '/api/v2',
} as const;

// Exported API URLs - build consistently from base URL
export const API_BASE_URL = API_CONFIG.BASE_URL;
export const API_BASE_URL_V2 = import.meta.env.VITE_API_BASE_URL_V2 || 'http://localhost:5002/api/v2';

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, version: 'v1' | 'v2' = 'v1'): string => {
  const baseUrl = version === 'v2' ? API_BASE_URL_V2 : API_BASE_URL;
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export default API_CONFIG;