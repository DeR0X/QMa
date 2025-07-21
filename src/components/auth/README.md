# Passwort-Ändern-Maske

Eine schöne und benutzerfreundliche Passwort-Ändern-Maske mit umfassenden Sicherheitsfeatures.

## Komponenten

### ChangePasswordModal
Das Haupt-Modal für die Passwort-Änderung.

**Props:**
- `isOpen: boolean` - Steuert die Sichtbarkeit des Modals
- `onClose: () => void` - Callback beim Schließen des Modals
- `onSuccess?: () => void` - Optionaler Callback bei erfolgreicher Passwort-Änderung

### ChangePasswordButton
Eine Button-Komponente mit integriertem Modal.

**Props:**
- `variant?: 'button' | 'link' | 'icon'` - Verschiedene Button-Varianten
- `className?: string` - Zusätzliche CSS-Klassen
- `children?: React.ReactNode` - Button-Text (optional)

## Verwendung

### 1. Direkte Modal-Verwendung

```tsx
import { useState } from 'react';
import ChangePasswordModal from './components/auth/ChangePasswordModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Passwort ändern
      </button>
      
      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          console.log('Passwort erfolgreich geändert!');
          // Optional: Benutzer abmelden oder andere Aktionen
        }}
      />
    </div>
  );
}
```

### 2. Button-Komponente verwenden

```tsx
import ChangePasswordButton from './components/auth/ChangePasswordButton';

function MyComponent() {
  return (
    <div>
      {/* Standard Button */}
      <ChangePasswordButton />
      
      {/* Link Button */}
      <ChangePasswordButton variant="link">
        Passwort ändern
      </ChangePasswordButton>
      
      {/* Icon Button */}
      <ChangePasswordButton variant="icon" />
    </div>
  );
}
```

### 3. In einem Header oder Menü

```tsx
function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Meine App</h1>
      
      <div className="flex items-center space-x-2">
        <ChangePasswordButton variant="icon" />
        <button>Einstellungen</button>
        <button>Abmelden</button>
      </div>
    </header>
  );
}
```

### 4. In einem Benutzerprofil

```tsx
function UserProfile() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium">Passwort</p>
          <p className="text-sm text-gray-500">Zuletzt geändert vor 30 Tagen</p>
        </div>
        <ChangePasswordButton variant="link">
          Ändern
        </ChangePasswordButton>
      </div>
    </div>
  );
}
```

## Features

### 🔒 Sicherheit
- **Passwort-Validierung**: Echtzeit-Überprüfung der Passwort-Anforderungen
- **Mindestanforderungen**: 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
- **Passwort-Bestätigung**: Doppelte Eingabe zur Vermeidung von Tippfehlern

### 👁️ Benutzerfreundlichkeit
- **Passwort-Sichtbarkeit**: Ein-/Ausblenden der Passwörter
- **Echtzeit-Feedback**: Sofortige Anzeige der Passwort-Stärke
- **Visueller Indikator**: Fortschrittsbalken für Passwort-Stärke

### 🎨 Design
- **Responsive**: Optimiert für alle Bildschirmgrößen
- **Dark Mode**: Vollständige Dark Mode Unterstützung
- **Accessibility**: Barrierefreie Bedienung
- **Moderne UI**: Schönes, modernes Design mit Tailwind CSS

### 🔧 Technische Features
- **TypeScript**: Vollständig typisiert
- **API-Integration**: Verwendet den zentralen API-Client
- **Error Handling**: Umfassende Fehlerbehandlung
- **Loading States**: Ladeanimationen während API-Aufrufen

## API-Endpunkt

Die Komponente erwartet einen API-Endpunkt für die Passwort-Änderung:

```typescript
POST /auth/change-password
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## Passwort-Anforderungen

Das neue Passwort muss folgende Anforderungen erfüllen:
- Mindestens 8 Zeichen
- Mindestens ein Kleinbuchstabe (a-z)
- Mindestens ein Großbuchstabe (A-Z)
- Mindestens eine Zahl (0-9)
- Mindestens ein Sonderzeichen (!@#$%^&*)

## Styling

Die Komponente verwendet Tailwind CSS und ist vollständig anpassbar. Die primären Farben können über CSS-Variablen oder Tailwind-Konfiguration angepasst werden:

```css
:root {
  --color-primary: #3b82f6; /* oder Ihre gewünschte Farbe */
}
```

## Browser-Kompatibilität

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Abhängigkeiten

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- Lucide React (für Icons)
- Sonner (für Toast-Benachrichtigungen)

## Lizenz

Diese Komponente ist Teil des reworkedQMatrix-Projekts. 