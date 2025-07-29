import { RootState } from '../store';

/**
 * Holt den aktuellen Bearer-Token aus dem Redux-Store oder localStorage
 * @param state - Optional: Redux-State für direkten Zugriff
 * @returns Bearer-Token oder null falls nicht verfügbar/ungültig
 */
export const getCurrentToken = (state?: RootState): string | null => {
  let token: string | null = null;
  
  // Versuche Token aus Redux-Store zu holen
 
    // Fallback: Token aus localStorage holen
    token = localStorage.getItem('token');
  
  
  // Token validieren
  if (token) {
    return token;
  }
  
  return null;
};

/**
 * Prüft ob ein gültiger Token vorhanden ist
 * @param state - Optional: Redux-State für direkten Zugriff
 * @returns Boolean ob ein gültiger Token vorhanden ist
 */
export const hasValidToken = (state?: RootState): boolean => {
  return getCurrentToken(state) !== null;
};

/**
 * Entfernt den Token aus localStorage und Redux-Store
 * Wird beim Logout verwendet
 */
export const clearToken = (): void => {
  localStorage.removeItem('token');
};

/**
 * Erstellt Authorization-Header für API-Aufrufe
 * @param state - Optional: Redux-State für direkten Zugriff
 * @returns Authorization-Header-Objekt oder leeres Objekt
 */
export const getAuthHeaders = (state?: RootState): Record<string, string> => {
  const token = getCurrentToken(state);
  
  if (token) {
    return {
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
    };
  }
  
  return {};
};

/**
 * Hook-ähnliche Funktion für React-Komponenten
 * Gibt den aktuellen Token zurück und prüft die Gültigkeit
 */
export const useAuthToken = () => {
  const token = getCurrentToken();
  const isValid = hasValidToken();
  
  return {
    token,
    isValid,
    authHeaders: getAuthHeaders()
  };
};