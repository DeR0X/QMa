import { API_BASE_URL, API_BASE_URL_V2 } from '../config/api';

// Helper function to get token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Enhanced API request options
export interface ApiRequestOptions extends RequestInit {
  version?: 'v1' | 'v2';
  baseUrl?: string; // Custom base URL override
  body?: any; // Allow any body type for convenience
}

// Generic API request function with authentication and flexible URL handling
export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { version = 'v1', baseUrl, body, ...fetchOptions } = options;
  
  // Determine the full URL
  let fullUrl: string;
  
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    // Full URL provided
    fullUrl = endpoint;
  } else if (baseUrl) {
    // Custom base URL provided
    fullUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  } else {
    // Use standard base URLs based on version
    const apiBaseUrl = version === 'v2' ? API_BASE_URL_V2 : API_BASE_URL;
    fullUrl = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  const authHeaders = getAuthHeaders();
  
  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...authHeaders,
      ...fetchOptions.headers,
    },
  };
  
  // Handle body serialization
  if (body !== undefined) {
    if (typeof body === 'string') {
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  const response = await fetch(fullUrl, config);
  
  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as T;
};

// Legacy API request function for backward compatibility
export const apiRequestLegacy = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const authHeaders = getAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401) {
    // Clear token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as T;
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, version: 'v1' | 'v2' = 'v1'): string => {
  const baseUrl = version === 'v2' ? API_BASE_URL_V2 : API_BASE_URL;
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Convenience methods for common HTTP operations
export const apiClient = {
  get: <T>(url: string, version: 'v1' | 'v2' = 'v1'): Promise<T> => {
    const fullUrl = buildApiUrl(url, version);
    return apiRequest<T>(fullUrl, { method: 'GET' });
  },
  
  post: <T>(url: string, data: any, version: 'v1' | 'v2' = 'v1'): Promise<T> => {
    const fullUrl = buildApiUrl(url, version);
    return apiRequest<T>(fullUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put: <T>(url: string, data: any, version: 'v1' | 'v2' = 'v1'): Promise<T> => {
    const fullUrl = buildApiUrl(url, version);
    return apiRequest<T>(fullUrl, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: <T>(url: string, version: 'v1' | 'v2' = 'v1'): Promise<T> => {
    const fullUrl = buildApiUrl(url, version);
    return apiRequest<T>(fullUrl, { method: 'DELETE' });
  },
  
  patch: <T>(url: string, data: any, version: 'v1' | 'v2' = 'v1'): Promise<T> => {
    const fullUrl = buildApiUrl(url, version);
    return apiRequest<T>(fullUrl, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Universal API request function that handles all API_URL variations
export const universalApiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions & {
    apiType?: 'base' | 'v2' | 'qualification-trainers' | 'custom';
    customApiUrl?: string;
  } = {}
): Promise<T> => {
  const { apiType = 'base', customApiUrl, ...requestOptions } = options;
  
  let baseUrl: string;
  
  switch (apiType) {
    case 'v2':
      baseUrl = API_BASE_URL_V2;
      break;
    case 'qualification-trainers':
      baseUrl = `${API_BASE_URL}/qualification-trainers`;
      break;
    case 'custom':
      if (!customApiUrl) {
        throw new Error('customApiUrl must be provided when apiType is "custom"');
      }
      baseUrl = customApiUrl;
      break;
    case 'base':
    default:
      baseUrl = API_BASE_URL;
      break;
  }
  
  return apiRequest<T>(endpoint, {
    ...requestOptions,
    baseUrl,
  });
};

// Convenience function for common API patterns
export const createApiFunction = (apiType: 'base' | 'v2' | 'qualification-trainers' | 'custom', customApiUrl?: string) => {
  return {
    get: <T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> => {
      return universalApiRequest<T>(endpoint, {
        ...options,
        method: 'GET',
        apiType,
        customApiUrl,
      });
    },
    
    post: <T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> => {
      return universalApiRequest<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data,
        apiType,
        customApiUrl,
      });
    },
    
    put: <T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> => {
      return universalApiRequest<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data,
        apiType,
        customApiUrl,
      });
    },
    
    delete: <T>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<T> => {
      return universalApiRequest<T>(endpoint, {
        ...options,
        method: 'DELETE',
        apiType,
        customApiUrl,
      });
    },
    
    patch: <T>(endpoint: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> => {
      return universalApiRequest<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data,
        apiType,
        customApiUrl,
      });
    },
  };
};

// Pre-configured API clients for common use cases
export const baseApi = createApiFunction('base');
export const v2Api = createApiFunction('v2');
export const qualificationTrainersApi = createApiFunction('qualification-trainers');

export default apiClient;