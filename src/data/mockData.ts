import { User, Training, TrainingBooking, Qualification, QualificationHistory, Employee } from '../types';

export const users: User[] = [
  {
    id: '1',
    personalNumber: '123',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'employee',
    department: 'IT',
    position: 'Software Engineer',
    supervisorId: '3',
    isActive: true,
    trainings: ['1', '2'],
    qualifications: ['1'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
    isLocked: false,
  },
  {
    id: '2',
    personalNumber: '1234',
    email: 'jane.smith@company.com',
    name: 'Jane Smith',
    role: 'employee',
    department: 'HR',
    position: 'HR Specialist',
    supervisorId: '3',
    isActive: true,
    trainings: ['2'],
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '3',
    personalNumber: '12',
    email: 'jane.smith@company.com',
    name: 'Brian Smith',
    role: 'employee',
    department: 'HR',
    position: 'IT',
    supervisorId: '3',
    isActive: true,
    trainings: ['2'],
    qualifications: ['2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
  {
    id: '4',
    personalNumber: '1',
    email: 'michael.brown@company.com',
    name: 'Michael Brown',
    role: 'supervisor',
    department: 'IT',
    position: 'IT Manager',
    isActive: true,
    trainings: [],
    qualifications: ['1', '2'],
    failedLoginAttempts: 0,
    requiredQualifications: ['1', '2'],
  },
];

export const employee: Employee[] = [
  {
    id: '1',
    email: 'john.doe@company.com',
    name: 'John Doe',
    role: 'mitarbeiter',
    department: 'IT',
    position: 'Software Engineer',
    startDate: '2022-01-15',
    skills: ['React', 'TypeScript', 'Node.js'],
    performance: {
      rating: 4.5,
      lastReview: '2024-12-01',
    },
    documents: [
      {
        id: 'd1',
        name: 'Contract',
        url: '#',
        type: 'pdf',
      },
      {
        id: 'd2',
        name: 'Performance Review 2024',
        url: '#',
        type: 'pdf',
      },
    ],
    isLocked: false,
  },
  // ... other employees
];


export const trainings: Training[] = [
  {
    id: '1',
    title: 'Information Security Basics',
    description: 'Essential training for IT security protocols and best practices.',
    duration: '2 hours',
    validityPeriod: 12, // months
    isMandatory: true,
    trainer: 'Sarah Wilson',
    maxParticipants: 20,
    sessions: [
      {
        id: '1',
        date: '2025-03-15T09:00:00',
        location: 'Room 101',
        availableSpots: 15,
      },
      {
        id: '2',
        date: '2025-03-22T09:00:00',
        location: 'Room 101',
        availableSpots: 20,
      },
    ],
  },
  {
    id: '2',
    title: 'Kranführerschein - Qualifikation',
    description: 'Ein Kranführerschein ist ein Nachweis, der es einer Person ermöglicht, einen Kran sicher zu bedienen. Die Ausbildung umfasst theoretische Inhalte wie rechtliche Vorschriften, technische Grundlagen und Sicherheitsbestimmungen sowie praktische Übungen im Steuern des Krans und Heben von Lasten. Nach Bestehen einer schriftlichen und praktischen Prüfung erhält der Teilnehmer den Führerschein. Dieser ist in der Regel fünf Jahre gültig und muss danach gegebenenfalls erneuert werden. Der Kranführerschein ist erforderlich, um Kranarbeiten auf Baustellen oder in anderen Bereichen durchzuführen.',
    duration: '4 hours',
    validityPeriod: 60, // months
    isMandatory: false,
    trainer: 'Robert Johnson',
    maxParticipants: 10,
    sessions: [
      {
        id: '3',
        date: '2025-03-20T13:00:00',
        location: 'Room 202',
        availableSpots: 6,
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
    validityPeriod: 12, // months
  },
  {
    id: '2',
    name: 'Kranführerschein',
    description: 'Kranführerschein – Berechtigung zum sicheren Führen eines Krans',
    requiredTrainings: ['2'],
    validityPeriod: 60, // months
  },
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

