# API Client Usage Guide

Diese Datei erklärt, wie die erweiterten API-Request-Funktionen verwendet werden, um alle verschiedenen API_URL-Varianten zu unterstützen.

## Verfügbare Funktionen

### 1. `apiRequest` (Erweitert)
Die Haupt-API-Request-Funktion mit flexibler URL-Behandlung.

```typescript
import { apiRequest } from '../services/apiClient';

// Einfacher GET-Request mit v1 (Standard)
const data = await apiRequest('/employees');

// GET-Request mit v2
const data = await apiRequest('/employees-documents-view', { version: 'v2' });

// POST-Request mit Daten
const result = await apiRequest('/trainings', {
  method: 'POST',
  body: { name: 'New Training' }
});

// Mit custom Base URL
const data = await apiRequest('/custom-endpoint', {
  baseUrl: 'https://custom-api.example.com'
});
```

### 2. `universalApiRequest`
Universelle Funktion, die alle API_URL-Varianten unterstützt.

```typescript
import { universalApiRequest } from '../services/apiClient';

// Standard API_BASE_URL
const employees = await universalApiRequest('/employees', { apiType: 'base' });

// API_BASE_URL_V2
const documents = await universalApiRequest('/employees-documents-view', { apiType: 'v2' });

// Qualification Trainers API (API_BASE_URL + '/qualification-trainers')
const trainers = await universalApiRequest('/employee/123', { apiType: 'qualification-trainers' });

// Custom API URL
const customData = await universalApiRequest('/endpoint', {
  apiType: 'custom',
  customApiUrl: 'https://custom-api.example.com'
});
```

### 3. Vorkonfigurierte API-Clients
Fertige Clients für häufige Anwendungsfälle.

```typescript
import { baseApi, v2Api, qualificationTrainersApi } from '../services/apiClient';

// Base API (API_BASE_URL)
const employees = await baseApi.get('/employees');
const newEmployee = await baseApi.post('/employees', employeeData);

// V2 API (API_BASE_URL_V2)
const documents = await v2Api.get('/employees-documents-view');

// Qualification Trainers API
const trainers = await qualificationTrainersApi.get('/employee/123');
const deleteResult = await qualificationTrainersApi.delete('/remove', {
  body: { employeeId: 123, qualificationId: 456 }
});
```

### 4. `createApiFunction`
Erstellt custom API-Clients für spezielle Anwendungsfälle.

```typescript
import { createApiFunction } from '../services/apiClient';

// Custom API Client erstellen
const customApi = createApiFunction('custom', 'https://my-special-api.com');

// Verwenden
const data = await customApi.get('/special-endpoint');
const result = await customApi.post('/create', { name: 'Test' });
```

## Migration von bestehenden API_URL-Verwendungen

### Vorher (mit axios und API_URL)
```typescript
// useQualificationTrainers.ts
const API_URL = `${API_BASE_URL}/qualification-trainers`;
const response = await axios.get(`${API_URL}/employee/${employeeId}`);
```

### Nachher (mit universalApiRequest)
```typescript
// Option 1: universalApiRequest
const response = await universalApiRequest(`/employee/${employeeId}`, {
  apiType: 'qualification-trainers'
});

// Option 2: Vorkonfigurierter Client
const response = await qualificationTrainersApi.get(`/employee/${employeeId}`);
```

### Weitere Beispiele

```typescript
// useTrainings.ts - Vorher
const API_URL = API_BASE_URL;
const response = await axios.get(`${API_URL}/trainings`);

// Nachher
const response = await baseApi.get('/trainings');
// oder
const response = await universalApiRequest('/trainings', { apiType: 'base' });

// useAdditionalFunctions.ts - Vorher
const API_URL = API_BASE_URL_V2;
const response = await axios.get(`${API_URL}/some-endpoint`);

// Nachher
const response = await v2Api.get('/some-endpoint');
// oder
const response = await universalApiRequest('/some-endpoint', { apiType: 'v2' });
```

## Vorteile der neuen API-Funktionen

1. **Einheitliche Authentifizierung**: Alle Requests verwenden automatisch die Auth-Header
2. **Fehlerbehandlung**: Automatische 401-Behandlung und Session-Management
3. **Flexibilität**: Unterstützt alle API_URL-Varianten in einer Funktion
4. **TypeScript-Support**: Vollständige Typisierung für bessere Entwicklererfahrung
5. **Konsistenz**: Einheitliche API für alle HTTP-Methoden
6. **Wartbarkeit**: Zentrale Konfiguration aller API-Endpunkte

## Best Practices

1. Verwende die vorkonfigurierten Clients (`baseApi`, `v2Api`, etc.) für häufige Anwendungsfälle
2. Nutze `universalApiRequest` für spezielle Anforderungen
3. Erstelle custom API-Clients mit `createApiFunction` für wiederkehrende Patterns
4. Migriere schrittweise von axios zu den neuen API-Funktionen
5. Nutze die TypeScript-Typen für bessere Code-Qualität