# API Handler mit Token-Authentifizierung - Verwendungsanleitung

Diese Dokumentation erklärt, wie der neue `apiHandler` mit Bearer-Token-Authentifizierung verwendet wird.

## Überblick

Der `apiHandler` bietet eine einheitliche Schnittstelle für alle API-Aufrufe mit folgenden Features:
- **Versions-Support**: v1 und v2 API-Unterstützung
- **Bearer-Token-Authentifizierung**: Automatische Token-Verifikation und -Übertragung
- **Umfassende Fehlerbehandlung**: Strukturierte Error-Responses
- **TypeScript-Unterstützung**: Vollständig typisiert

## Import

```typescript
import { apiHandler, apiGet, apiPost, apiPut, apiDelete, apiPatch, verifyToken } from '../services/apiHandler';
import { getCurrentToken } from '../utils/authUtils';
```

## Basis-Verwendung

### 1. GET-Anfragen

```typescript
// Einfacher GET-Aufruf ohne Token
const response = await apiGet('v2', 'employees');

// GET-Aufruf mit Token
const token = getCurrentToken();
const response = await apiGet('v2', 'employees', undefined, token);

// GET-Aufruf mit Query-Parametern und Token
const response = await apiGet('v2', 'employees', { limit: 10, page: 1 }, token);
```

### 2. POST-Anfragen

```typescript
// POST-Aufruf mit Daten und Token
const token = getCurrentToken();
const response = await apiPost('v2', 'employees', {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max@example.com'
}, token);
```

### 3. PUT/PATCH-Anfragen

```typescript
// PUT-Aufruf für Updates
const token = getCurrentToken();
const response = await apiPut('v2', `employees/${employeeId}`, updatedData, token);

// PATCH-Aufruf für partielle Updates
const response = await apiPatch('v2', `employees/${employeeId}`, partialData, token);
```

### 4. DELETE-Anfragen

```typescript
// DELETE-Aufruf
const token = getCurrentToken();
const response = await apiDelete('v2', `employees/${employeeId}`, token);
```

## Erweiterte Verwendung

### Hauptfunktion `apiHandler`

```typescript
const response = await apiHandler({
  version: 'v2',
  endpoint: 'employees',
  method: 'POST',
  data: employeeData,
  params: { include: 'department' },
  headers: { 'Custom-Header': 'value' }
}, bearerToken);
```

### Token-Verifikation

```typescript
// Token vor Verwendung prüfen
const token = getCurrentToken();
if (verifyToken(token)) {
  const response = await apiGet('v2', 'protected-endpoint', undefined, token);
} else {
  console.error('Ungültiger Token');
}
```

## Response-Format

Alle API-Aufrufe geben ein standardisiertes Response-Objekt zurück:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}
```

### Erfolgreiche Antwort

```typescript
const response = await apiGet('v2', 'employees');
if (response.success) {
  console.log('Daten:', response.data);
  console.log('Status:', response.status); // z.B. 200
}
```

### Fehlerbehandlung

```typescript
const response = await apiPost('v2', 'employees', invalidData, token);
if (!response.success) {
  console.error('Fehler:', response.error);
  console.error('Status:', response.status); // z.B. 400, 401, 500
}
```

## Integration in React Hooks

### Beispiel: useEmployees Hook

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPost } from '../services/apiHandler';
import { getCurrentToken } from '../utils/authUtils';

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const token = getCurrentToken();
      const response = await apiGet('v2', 'employees', undefined, token);
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Laden der Mitarbeiter');
      }
      return response.data;
    }
  });
};

export const useAddEmployee = () => {
  return useMutation({
    mutationFn: async (employeeData: any) => {
      const token = getCurrentToken();
      const response = await apiPost('v2', 'employees', employeeData, token);
      if (!response.success) {
        throw new Error(response.error || 'Fehler beim Hinzufügen des Mitarbeiters');
      }
      return response.data;
    }
  });
};
```

## Fehlerbehandlung

### Automatische Token-Verifikation

Der `apiHandler` prüft automatisch die Gültigkeit des Tokens:

```typescript
// Ungültiger Token führt zu einem Fehler
const response = await apiGet('v2', 'employees', undefined, 'invalid-token');
// response.success = false
// response.error = "Ungültiger Bearer Token"
```

### HTTP-Status-Codes

```typescript
const response = await apiGet('v2', 'nonexistent-endpoint', undefined, token);
switch (response.status) {
  case 401:
    console.log('Nicht authentifiziert');
    break;
  case 403:
    console.log('Keine Berechtigung');
    break;
  case 404:
    console.log('Endpoint nicht gefunden');
    break;
  case 500:
    console.log('Server-Fehler');
    break;
}
```

## Best Practices

### 1. Token-Management

```typescript
// Immer aktuellen Token verwenden
const token = getCurrentToken();
if (!token) {
  // Benutzer zur Anmeldung weiterleiten
  return;
}
```

### 2. Fehlerbehandlung in Komponenten

```typescript
const handleApiCall = async () => {
  try {
    const token = getCurrentToken();
    const response = await apiPost('v2', 'endpoint', data, token);
    
    if (response.success) {
      toast.success('Erfolgreich gespeichert');
    } else {
      toast.error(response.error || 'Ein Fehler ist aufgetreten');
    }
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    toast.error('Ein unerwarteter Fehler ist aufgetreten');
  }
};
```

### 3. TypeScript-Typisierung

```typescript
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Typisierte API-Aufrufe
const response = await apiGet<Employee[]>('v2', 'employees', undefined, token);
if (response.success) {
  // response.data ist jetzt typisiert als Employee[]
  response.data.forEach(employee => {
    console.log(employee.firstName); // TypeScript-Unterstützung
  });
}
```

## Migration von bestehenden fetch-Aufrufen

### Vorher (alter fetch-Aufruf)

```typescript
const response = await fetch(`${API_BASE_URL_V2}/employees`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### Nachher (neuer apiHandler)

```typescript
const response = await apiGet('v2', 'employees', undefined, token);
if (response.success) {
  const data = response.data;
}
```

## Debugging

Der `apiHandler` loggt automatisch alle Anfragen und Antworten:

```
API GET Request: {
  url: "http://localhost:3001/api/v2/employees",
  version: "v2",
  endpoint: "employees",
  hasToken: true,
  hasData: false
}

API GET Success: {
  url: "http://localhost:3001/api/v2/employees",
  status: 200,
  hasData: true
}
```

Für detaillierteres Debugging können Sie die Browser-Entwicklertools verwenden.