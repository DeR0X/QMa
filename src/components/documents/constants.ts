// Constants for document management
export const DOCUMENT_TYPES = [
    'Richtlinie',
    'Verfahrensanweisung',
    'Formular',
    'Vorlage',
    'Bericht',
    'Schulungsmaterial',
    'Vertrag',
    'Handbuch',
    'Leitfaden',
    'Zertifizierung',
  ];
  
  export const DOCUMENT_CATEGORIES = [
    'Personal',
    'Finanzen',
    'Betrieb',
    'IT',
    'Recht',
    'Qualität',
    'Sicherheit',
    'Schulung',
    'Compliance',
    'Allgemein',
  ];
  
  export const DOCUMENT_CLASSIFICATIONS = [
    { value: 'employee', label: 'Mitarbeiterdokumente' },
    { value: 'training', label: 'Schulungsmaterialien' },
    { value: 'policy', label: 'Richtlinien' },
    { value: 'procedure', label: 'Verfahrensanweisungen' },
  ];
  
  export const VISIBILITY_LEVELS = [
    { value: 'public', label: 'Öffentlich (Alle Mitarbeiter)', icon: 'Globe' },
    { value: 'department', label: 'Nur Abteilung', icon: 'Building2' },
    { value: 'role', label: 'Rollenbasiert', icon: 'Users' },
    { value: 'private', label: 'Privat (Ausgewählte Benutzer)', icon: 'Lock' },
  ];
  
  export const LANGUAGES = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'Englisch' },
  ];
  
  export const ROLES = [
    { value: 'employee', label: 'Mitarbeiter' },
    { value: 'supervisor', label: 'Vorgesetzter' },
    { value: 'hr', label: 'HR' },
  ];
  
  export const PERMISSIONS = [
    { value: 'view', label: 'Ansehen', description: 'Kann das Dokument öffnen und lesen' },
    { value: 'download', label: 'Herunterladen', description: 'Kann das Dokument herunterladen' },
    { value: 'edit', label: 'Bearbeiten', description: 'Kann das Dokument bearbeiten' },
    { value: 'delete', label: 'Löschen', description: 'Kann das Dokument löschen' },
    { value: 'share', label: 'Teilen', description: 'Kann das Dokument mit anderen teilen' },
    { value: 'print', label: 'Drucken', description: 'Kann das Dokument drucken' },
  ];