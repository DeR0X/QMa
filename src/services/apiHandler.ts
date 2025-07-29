import { API_BASE_URL } from '../config/api';

interface ApiRequestOptions {
  version: 'v1' | 'v2';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Erstellt und verifiziert einen Bearer Authentication Token
 * @param token - Der Bearer Token
 * @returns Formatierter Authorization Header
 */
export const createBearerToken = (token: string): string => {
  if (!token) {
    throw new Error('Token ist erforderlich');
  }
  return `Bearer ${token}`;
};

// Token verification removed

/**
 * Hauptfunktion für API-Aufrufe mit Version-Support und Bearer-Authentifizierung
 * @param options - Konfiguration für den API-Aufruf
 * @param bearerToken - Bearer Token für Authentifizierung
 * @returns Promise mit API-Response
 */
export const apiHandler = async <T = any>(
  options: ApiRequestOptions,
  bearerToken?: string
): Promise<ApiResponse<T>> => {
  const { version, endpoint, method, data, headers = {}, params } = options;
  
  try {
    // URL zusammenbauen - mit Fallback falls API_BASE_URL undefined ist
    const apiBaseUrl = API_BASE_URL || 'http://localhost:5002/api';
    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    let url = `${baseUrl}/${version}/${endpoint}`;
    
    // Query-Parameter hinzufügen falls vorhanden
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value.toString());
      });
      url += `?${searchParams.toString()}`;
    }
    
    // Headers zusammenbauen
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Bearer Token hinzufügen falls vorhanden
    if (bearerToken) {
      requestHeaders['Authorization'] = bearerToken.startsWith('Bearer ') 
        ? bearerToken 
        : createBearerToken(bearerToken);
    }
    
    // Fetch-Konfiguration
    const fetchConfig: RequestInit = {
      method,
      headers: requestHeaders
    };
    
    // Body hinzufügen für POST/PUT/PATCH Requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchConfig.body = JSON.stringify(data);
    }
    
    console.log(`API ${method} Request:`, {
      url,
      version,
      endpoint,
      hasToken: !!bearerToken,
      hasData: !!data
    });
    
    // API-Aufruf durchführen
    const response = await fetch(url, fetchConfig);
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    if (!response.ok) {
      console.error(`API Error ${response.status}:`, responseData);
      return {
        success: false,
        error: responseData?.message || responseData || `HTTP ${response.status}`,
        status: response.status
      };
    }
    
    console.log(`API ${method} Success:`, {
      url,
      status: response.status,
      hasData: !!responseData
    });
    
    return {
      success: true,
      data: responseData,
      status: response.status
    };
    
  } catch (error) {
    console.error('API Handler Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      status: 0
    };
  }
};

// Convenience-Funktionen für häufige HTTP-Methoden
export const apiGet = <T = any>(
  version: 'v1' | 'v2',
  endpoint: string,
  params?: Record<string, string | number>,
  bearerToken?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return apiHandler<T>({ version, endpoint, method: 'GET', params, headers }, bearerToken);
};

export const apiPost = <T = any>(
  version: 'v1' | 'v2',
  endpoint: string,
  data?: any,
  bearerToken?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return apiHandler<T>({ version, endpoint, method: 'POST', data, headers }, bearerToken);
};

export const apiPut = <T = any>(
  version: 'v1' | 'v2',
  endpoint: string,
  data?: any,
  bearerToken?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return apiHandler<T>({ version, endpoint, method: 'PUT', data, headers }, bearerToken);
};

export const apiDelete = <T = any>(
  version: 'v1' | 'v2',
  endpoint: string,
  bearerToken?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return apiHandler<T>({ version, endpoint, method: 'DELETE', headers }, bearerToken);
};

export const apiPatch = <T = any>(
  version: 'v1' | 'v2',
  endpoint: string,
  data?: any,
  bearerToken?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return apiHandler<T>({ version, endpoint, method: 'PATCH', data, headers }, bearerToken);
};