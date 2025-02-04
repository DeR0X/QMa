import { User, Training, TrainingBooking, Qualification, QualificationHistory, TrainingDocument } from '../types';

export const users: User[] = [
  {
    id: '1',
    personalNumber: '123',
    email: 'john.acer@company.com',
    name: 'John Acer',
    role: 'employee',
    department: 'IT Operations',
    position: 'Software Engineer',
    supervisorId: '4',
    isActive: false,
    trainings: ['1', '2'],
    qualifications: ['1'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '2',
    personalNumber: '1234',
    email: 'max.mustermann@company.com',
    name: 'Max Mustermann',
    role: 'hr',
    department: 'HR',
    position: 'HR Specialist',
    supervisorId: '4',
    isActive: true,
    trainings: ['2'],
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '3',
    personalNumber: '12',
    email: 'hans.mueller@company.com',
    name: 'Hans Müller',
    role: 'employee',
    department: 'IT Operations',
    position: 'IT Security Specialist',
    isActive: true,
    trainings: ['2'],
    supervisorId: '4',
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '4',
    personalNumber: '1',
    email: 'michael.braun@company.com',
    name: 'Michael Braun',
    role: 'supervisor',
    department: 'IT Operations',
    position: 'System Administrator',
    isActive: true,
    trainings: [],
    supervisorId: '7',
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '6',
    personalNumber: '789',
    email: 'sarah.wilson@company.com',
    name: 'Sarah Wilson',
    role: 'hr',
    department: 'Human Resources',
    position: 'HR Director',
    isActive: true,
    trainings: ['1', '2'],
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '7',
    personalNumber: '111',
    email: 'james.bond@company.com',
    name: 'James Bond',
    role: 'supervisor',
    department: 'IT Operations',
    position: 'System Administrator',
    isActive: true,
    trainings: [],
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
];


export const trainings: Training[] = [
  {
    id: '1',
    title: 'Grundlagen der Informationssicherheit',
    description: 'Grundlegende Schulung zu IT-Sicherheitsprotokollen und Best Practices.',
    duration: '2 Stunden',
    validityPeriod: 12,
    isMandatory: true,
    trainer: 'Sarah Wilson',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1'],
    sessions: [
      {
        id: '1',
        date: '2025-03-15T09:00:00',
        location: 'Raum 101',
        availableSpots: 15,
      },
      {
        id: '2',
        date: '2025-03-22T09:00:00',
        location: 'Raum 101',
        availableSpots: 20,
      },
    ],
  },
  {
    id: '2',
    title: 'Kranführerschein - Qualifikation',
    description: 'Ein Kranführerschein ist ein Nachweis, der es einer Person ermöglicht, einen Kran sicher zu bedienen. Die Ausbildung umfasst theoretische Inhalte wie rechtliche Vorschriften, technische Grundlagen und Sicherheitsbestimmungen sowie praktische Übungen im Steuern des Krans und Heben von Lasten. Nach Bestehen einer schriftlichen und praktischen Prüfung erhält der Teilnehmer den Führerschein. Dieser ist in der Regel fünf Jahre gültig und muss danach gegebenenfalls erneuert werden. Der Kranführerschein ist erforderlich, um Kranarbeiten auf Baustellen oder in anderen Bereichen durchzuführen.',
    duration: '4 hours',
    validityPeriod: 60,
    isMandatory: false,
    trainer: 'Robert Johnson',
    maxParticipants: 10,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['2'],
    sessions: [
      {
        id: '3',
        date: '2025-03-20T13:00:00',
        location: 'Room 202',
        availableSpots: 6,
      },
    ],
  },
  {
    id: '3',
    title: 'Agiles Projektmanagement',
    description: 'Schulung in agilen Methoden wie Scrum und Kanban für das Projektmanagement.',
    duration: '3 Tage',
    validityPeriod: 24,
    isMandatory: false,
    trainer: 'Emily Carter',
    maxParticipants: 15,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '4',
        date: '2025-04-01T09:00:00',
        location: 'Konferenzraum A',
        availableSpots: 10,
      },
      {
        id: '5',
        date: '2025-04-08T09:00:00',
        location: 'Konferenzraum A',
        availableSpots: 15,
      },
    ],
  },
  {
    id: '4',
    title: 'Grundlagen des Cloud Computing',
    description: 'Einführung in Cloud-Computing-Konzepte, -Dienste und -Bereitstellungsmodelle.',
    duration: '1 Tag',
    validityPeriod: 36,
    isMandatory: true,
    trainer: 'David Lee',
    maxParticipants: 25,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '6',
        date: '2025-04-15T09:00:00',
        location: 'Online',
        availableSpots: 25,
      },
    ],
  },
  {
    id: '5',
    title: 'Datenschutz und DSGVO',
    description: 'Schulung zu Datenschutzprinzipien und Einhaltung der DSGVO.',
    duration: '4 Stunden',
    validityPeriod: 12,
    isMandatory: true,
    trainer: 'Laura White',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '7',
        date: '2025-04-22T13:00:00',
        location: 'Raum 102',
        availableSpots: 18,
      },
    ],
  },
  {
    id: '6',
    title: 'Sicherheit am Arbeitsplatz',
    description: 'Grundlegende Schulung zu Sicherheitsverfahren und Unfallverhütung am Arbeitsplatz.',
    duration: '2 Stunden',
    validityPeriod: 24,
    isMandatory: true,
    trainer: 'Hans Müller',
    maxParticipants: 30,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '8',
        date: '2025-05-05T09:00:00',
        location: 'Halle 8',
        availableSpots: 25,
      },
    ],
  },
  {
    id: '7',
    title: 'Qualitätsmanagement in der Produktion',
    description: 'Schulung zu Qualitätsstandards und -kontrollen in der Fertigung.',
    duration: '1 Tag',
    validityPeriod: 36,
    isMandatory: false,
    trainer: 'Maria Schmidt',
    maxParticipants: 20,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '9',
        date: '2025-05-12T09:00:00',
        location: 'Schulungsraum 1',
        availableSpots: 15,
      },
    ],
  },
  {
    id: '8',
    title: 'Maschinenbedienung und Wartung',
    description: 'Schulung zur sicheren Bedienung und grundlegenden Wartung von Produktionsmaschinen.',
    duration: '4 Stunden',
    validityPeriod: 48,
    isMandatory: true,
    trainer: 'Peter Wagner',
    maxParticipants: 15,
    targetPositions: ['Software Engineer', 'System Administrator'],
    isForEntireDepartment: true,
    department: 'IT Operations',
    qualificationIds: ['1', '2'],
    sessions: [
      {
        id: '10',
        date: '2025-05-19T13:00:00',
        location: 'Werkstatt',
        availableSpots: 10,
      },
    ],
  },
];

export const qualifications: Qualification[] = [
  {
    id: '1',
    name: 'IT Security Certification',
    description: 'Basic IT security certification required for all IT staff',
    requiredTrainings: ['1'],
    validityPeriod: 12,
  },
  {
    id: '2',
    name: 'Kranführerschein',
    description: 'Kranführerschein – Berechtigung zum sicheren Führen eines Krans',
    requiredTrainings: ['2'],
    validityPeriod: 60,
  },
];

export interface EmployeeQualification {
  id: string;
  employeeId: string;
  qualificationId: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil: string;
}

export const employeeQualifications: EmployeeQualification[] = [
  {
    id: '1',
    employeeId: '1',
    qualificationId: '1',
    qualifiedFrom: '2024-01-01',
    toQualifyUntil: '2024-12-31',
    isQualifiedUntil: '2024-12-31'
  },
  {
    id: '2',
    employeeId: '2',
    qualificationId: '2',
    qualifiedFrom: '2024-02-01',
    toQualifyUntil: '2025-01-31',
    isQualifiedUntil: '2025-01-31'
  },
  {
    id: '3',
    employeeId: '3',
    qualificationId: '1',
    qualifiedFrom: '2024-03-01',
    toQualifyUntil: '2024-12-31',
    isQualifiedUntil: '2024-12-31'
  },
  {
    id: '4',
    employeeId: '4',
    qualificationId: '2',
    qualifiedFrom: '2024-01-15',
    toQualifyUntil: '2025-01-14',
    isQualifiedUntil: '2025-01-14'
  }
];

export const qualificationHistory: QualificationHistory[] = [
  {
    id: '1',
    userId: '1',
    qualificationId: '1',
    type: 'granted',
    date: '2023-12-15T10:00:00',
    approvedBy: '3',
  },
  {
    id: '2',
    userId: '2',
    qualificationId: '2',
    type: 'expired',
    date: '2024-01-15T10:00:00',
    reason: 'Qualification period ended',
    approvedBy: '3',
  },
];

export const bookings: TrainingBooking[] = [
  {
    id: '1',
    userId: '1',
    trainingId: '1',
    sessionId: '1',
    status: 'genehmigt',
    completedAt: '2023-12-15T10:00:00',
    approvedBy: '3',
    createdAt: '2023-12-01T09:00:00',
  },
  {
    id: '2',
    userId: '2',
    trainingId: '2',
    sessionId: '3',
    status: 'ausstehend',
    createdAt: '2024-02-01T14:30:00',
  },
];


export const trainingDocuments: TrainingDocument[] = [
  {
    id: '1',
    trainingId: '1',
    fileName: 'Sicherheitsrichtlinien_2024.pdf',
    fileType: 'application/pdf',
    uploadedBy: '6', // HR user ID
    uploadedAt: '2024-03-15T10:00:00',
    fileUrl: '/documents/training/1/Sicherheitsrichtlinien_2024.pdf',
    description: 'Aktuelle Sicherheitsrichtlinien für IT-Systeme'
  },
  {
    id: '2',
    trainingId: '2',
    fileName: 'Kranführerschein_Handbuch.pdf',
    fileType: 'application/pdf',
    uploadedBy: '6',
    uploadedAt: '2024-03-14T15:30:00',
    fileUrl: '/documents/training/2/Kranführerschein_Handbuch.pdf',
    description: 'Handbuch für Kranführerschein-Qualifikation'
  }
];