// Mock data for Q-Matrix system

import { Department, JobTitle, Employee, Qualification, Training, EmployeeQualification, QualificationTrainer, AdditionalSkill, TrainingBooking, TrainingDocument } from '../types';

export const departments: Department[] = [
  { id: '1', departmentID_Atoss: 'IT001', department: 'IT-Abteilung' },
  { id: '2', departmentID_Atoss: 'PR001', department: 'Produktion' },
  { id: '3', departmentID_Atoss: 'QS001', department: 'Qualitätssicherung' },
  { id: '4', departmentID_Atoss: 'HR001', department: 'Personalabteilung' },
  { id: '5', departmentID_Atoss: 'LG001', department: 'Logistik' }
];

export const jobTitles: JobTitle[] = [
  { id: '1', jobTitle: 'Softwareentwickler', description: 'Entwicklung und Wartung von Softwareanwendungen' },
  { id: '2', jobTitle: 'Produktionsmitarbeiter', description: 'Bedienung und Überwachung von Produktionsanlagen' },
  { id: '3', jobTitle: 'Qualitätsprüfer', description: 'Durchführung von Qualitätskontrollen' },
  { id: '4', jobTitle: 'HR-Manager', description: 'Verwaltung von Personalangelegenheiten' },
  { id: '5', jobTitle: 'Logistiker', description: 'Planung und Überwachung logistischer Prozesse' }
];

export const employees: Employee[] = [
  {
    id: '1',
    staffNumber: '1001',
    surName: 'Müller',
    firstName: 'Thomas',
    fullName: 'Thomas Müller',
    role: 'supervisor',
    eMail: 't.mueller@firma.de',
    departmentID: '1',
    jobTitleID: '1',
    supervisorID: '',
    qualificationIDs: ['1', '2'],
    isActive: true,
    passwordHash: 'hash123'
  },
  {
    id: '2',
    staffNumber: '789',
    surName: 'Schmidt',
    firstName: 'Anna',
    fullName: 'Anna Schmidt',
    role: 'hr',
    eMail: 'a.schmidt@firma.de',
    departmentID: '4',
    jobTitleID: '4',
    supervisorID: '1',
    qualificationIDs: ['3'],
    isActive: true,
    passwordHash: '123'
  },
  {
    id: '3',
    staffNumber: '1003',
    surName: 'Weber',
    firstName: 'Michael',
    fullName: 'Michael Weber',
    role: 'employee',
    eMail: 'm.weber@firma.de',
    departmentID: '2',
    jobTitleID: '2',
    supervisorID: '1',
    qualificationIDs: ['2'],
    isActive: true,
    isTrainer: true,
    trainerFor: ['1'],
    passwordHash: 'hash125'
  },
  {
    id: '4',
    staffNumber: '1004',
    surName: 'Fischer',
    firstName: 'Sarah',
    fullName: 'Sarah Fischer',
    role: 'employee',
    eMail: 's.fischer@firma.de',
    departmentID: '3',
    jobTitleID: '3',
    supervisorID: '1',
    qualificationIDs: ['1'],
    isActive: true,
    passwordHash: 'hash126'
  },
  {
    id: '5',
    staffNumber: '1005',
    surName: 'Koch',
    firstName: 'Andreas',
    fullName: 'Andreas Koch',
    role: 'supervisor',
    eMail: 'a.koch@firma.de',
    departmentID: '5',
    jobTitleID: '5',
    supervisorID: '1',
    qualificationIDs: ['2', '3'],
    isActive: true,
    passwordHash: 'hash127'
  },
  {
    id: '6',
    staffNumber: '1006',
    surName: 'Wagner',
    firstName: 'Julia',
    fullName: 'Julia Wagner',
    role: 'employee',
    eMail: 'j.wagner@firma.de',
    departmentID: '1',
    jobTitleID: '1',
    supervisorID: '1',
    qualificationIDs: ['1'],
    isActive: true,
    passwordHash: 'hash128'
  },
  {
    id: '7',
    staffNumber: '1007',
    surName: 'Becker',
    firstName: 'Martin',
    fullName: 'Martin Becker',
    role: 'employee',
    eMail: 'm.becker@firma.de',
    departmentID: '2',
    jobTitleID: '2',
    supervisorID: '1',
    qualificationIDs: ['2'],
    isActive: true,
    passwordHash: 'hash129'
  },
  {
    id: '8',
    staffNumber: '1008',
    surName: 'Hoffmann',
    firstName: 'Lisa',
    fullName: 'Lisa Hoffmann',
    role: 'employee',
    eMail: 'l.hoffmann@firma.de',
    departmentID: '3',
    jobTitleID: '3',
    supervisorID: '1',
    qualificationIDs: ['3'],
    isActive: true,
    passwordHash: 'hash130'
  },
  {
    id: '9',
    staffNumber: '1009',
    surName: 'Schäfer',
    firstName: 'Peter',
    fullName: 'Peter Schäfer',
    role: 'employee',
    eMail: 'p.schaefer@firma.de',
    departmentID: '4',
    jobTitleID: '4',
    supervisorID: '2',
    qualificationIDs: ['1', '3'],
    isActive: true,
    passwordHash: 'hash131'
  },
  {
    id: '10',
    staffNumber: '1010',
    surName: 'Klein',
    firstName: 'Sandra',
    fullName: 'Sandra Klein',
    role: 'employee',
    eMail: 's.klein@firma.de',
    departmentID: '5',
    jobTitleID: '5',
    supervisorID: '5',
    qualificationIDs: ['2'],
    isActive: true,
    passwordHash: 'hash132'
  }
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


export const qualifications: Qualification[] = [
  {
    id: '1',
    name: 'IT-Sicherheitsschulung',
    description: 'Grundlegende Schulung zur IT-Sicherheit',
    requiredTrainings: ['1'],
    validityInMonth: 12,
    isMandatory: true
  },
  {
    id: '2',
    name: 'Arbeitssicherheit',
    description: 'Schulung zu Arbeitssicherheit und Unfallverhütung',
    requiredTrainings: ['2'],
    validityInMonth: 24,
    isMandatory: true
  },
  {
    id: '3',
    name: 'Datenschutz-Grundlagen',
    description: 'DSGVO und betrieblicher Datenschutz',
    requiredTrainings: ['3'],
    validityInMonth: 12,
    isMandatory: true
  }
];

export const trainings: Training[] = [
  {
    id: '1',
    title: 'IT-Sicherheit Basis',
    description: 'Grundlegende IT-Sicherheitsschulung für alle Mitarbeiter',
    qualificationID: '1',
    qualification_TrainerID: '1',
    isForEntireDepartment: true,
    department: '1',
    duration: '2 Stunden',
    isMandatory: true,
    trainingDate: '2024-04-15',
    qualificationIds: ['1'],
    completed: false
  },
  {
    id: '2',
    title: 'Arbeitssicherheit 2024',
    description: 'Jährliche Arbeitssicherheitsunterweisung',
    qualificationID: '2',
    qualification_TrainerID: '2',
    isForEntireDepartment: true,
    department: '2',
    duration: '2 Stunden',
    isMandatory: true,
    trainingDate: '2024-04-20',
    qualificationIds: ['2'],
    completed: false
  },
  {
    id: '3',
    title: 'DSGVO Update',
    description: 'Aktualisierung zum Datenschutz',
    qualificationID: '3',
    qualification_TrainerID: '3',
    isForEntireDepartment: true,
    department: '4',
    duration: '2 Stunden',
    isMandatory: true,
    trainingDate: '2024-05-10',
    qualificationIds: ['3'],
    completed: false
  }
];

export const employeeQualifications: EmployeeQualification[] = [
  {
    id: '1',
    employeeID: '1',
    qualificationID: '1',
    qualifiedFrom: '2024-01-01',
    toQualifyUntil: '2024-12-31',
    isQualifiedUntil: '2024-12-31'
  },
  {
    id: '2',
    employeeID: '2',
    qualificationID: '3',
    qualifiedFrom: '2024-01-01',
    toQualifyUntil: '2024-12-31',
    isQualifiedUntil: '2024-12-31'
  },
  {
    id: '3',
    employeeID: '3',
    qualificationID: '2',
    qualifiedFrom: '2024-01-01',
    toQualifyUntil: '2025-12-31',
    isQualifiedUntil: '2025-12-31'
  }
];

export const qualificationTrainers: QualificationTrainer[] = [
  {
    id: '1',
    qualificationID: '1',
    employeeID: '1'
  },
  {
    id: '2',
    qualificationID: '2',
    employeeID: '3'
  },
  {
    id: '3',
    qualificationID: '3',
    employeeID: '2'
  }
];

export const additionalSkills: AdditionalSkill[] = [
  {
    id: '1',
    name: 'Erste Hilfe',
    description: 'Grundlegende Erste-Hilfe-Kenntnisse'
  },
  {
    id: '2',
    name: 'Brandschutzhelfer',
    description: 'Ausbildung zum Brandschutzhelfer'
  },
  {
    id: '3',
    name: 'Gabelstaplerführerschein',
    description: 'Berechtigung zum Führen von Gabelstaplern'
  }
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