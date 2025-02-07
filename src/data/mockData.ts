// Mock data for Q-Matrix system

import { Department, JobTitle, Employee, Qualification, Training, EmployeeQualification, QualificationTrainer, AdditionalSkill, TrainingBooking, TrainingDocument } from '../types';

export const departments: Department[] = [
  {
    id: "1",
    departmentID_Atoss: "D001",
    department: "IT",
    positions: ["1", "2"],
  },
  {
    id: "2",
    departmentID_Atoss: "D002",
    department: "Personalwesen",
    positions: ["3"],
  },
  {
    id: "3",
    departmentID_Atoss: "D003",
    department: "Produktion",
    positions: ["4", "5", "6"],
  },
];

export const jobTitles: JobTitle[] = [
  {
    id: "1",
    jobTitle: "Softwareentwickler",
    description: "Entwickelt und wartet Softwaresysteme.",
    qualificationIDs: ["1", "2"],
  },
  {
    id: "2",
    jobTitle: "Systemadministrator",
    description: "Verwaltet IT-Infrastruktur und Netzwerke.",
    qualificationIDs: ["3"],
  },
  {
    id: "3",
    jobTitle: "Personalmanager",
    description: "Leitet Personalaktivitäten.",
    qualificationIDs: ["4"],
  },
  {
    id: "4",
    jobTitle: "Maschinenführer",
    description: "Bedient und wartet Produktionsmaschinen.",
    qualificationIDs: ["5", "6"],
  },
  {
    id: "5",
    jobTitle: "Qualitätsprüfer",
    description: "Überwacht die Produktqualität und führt Tests durch.",
    qualificationIDs: ["7"],
  },
];

export const employees: Employee[] = [
  {
    id: "E001",
    staffNumber: "1001",
    surName: "Meyer",
    firstName: "Thomas",
    fullName: "Thomas Meyer",
    role: "employee",
    eMail: "thomas.meyer@example.com",
    departmentID: "1",
    jobTitleID: "1",
    supervisorID: "E003",
    additionalSkillIDs: ["1"],
    isActive: true,
    isTrainer: true,
    trainerFor: ["1", "5"],
    passwordHash: "hashed_password_123",
  },
  {
    id: "E002",
    staffNumber: "1002",
    surName: "Fischer",
    firstName: "Julia",
    fullName: "Julia Fischer",
    role: "employee",
    eMail: "julia.fischer@example.com",
    departmentID: "2",
    jobTitleID: "3",
    supervisorID: "E003",
    additionalSkillIDs: ["2"],
    isActive: true,
    passwordHash: "hashed_password_456",
  },
  {
    id: "E003",
    staffNumber: "1003",
    surName: "Schneider",
    firstName: "Michael",
    fullName: "Michael Schneider",
    role: "employee",
    eMail: "michael.schneider@example.com",
    departmentID: "1",
    jobTitleID: "2",
    isActive: true,
    isTrainer: false,
    passwordHash: "hashed_password_789",
  },
  {
    id: "789",
    staffNumber: "1004",
    surName: "Weber",
    firstName: "Sabine",
    fullName: "Sabine Weber",
    role: "hr",
    eMail: "sabine.weber@example.com",
    departmentID: "3",
    jobTitleID: "4",
    supervisorID: "E005",
    additionalSkillIDs: ["3"],
    isActive: true,
    passwordHash: "123",
  },
  {
    id: "E005",
    staffNumber: "1005",
    surName: "Koch",
    firstName: "Andreas",
    fullName: "Andreas Koch",
    role: "supervisor",
    eMail: "andreas.koch@example.com",
    departmentID: "3",
    jobTitleID: "5",
    isActive: true,
    passwordHash: "hashed_password_102",
  },
];

export const qualifications: Qualification[] = [
  {
    id: "1",
    name: "Java-Zertifizierung",
    description: "Zertifizierung für Java-Programmierkenntnisse.",
    requiredTrainings: ["1"],
    validityInMonth: 24,
    isMandatory: true,
  },
  {
    id: "2",
    name: "Datenbankverwaltung",
    description: "Kenntnisse in SQL und Datenbankadministration.",
    requiredTrainings: ["2"],
    validityInMonth: 36,
    isMandatory: false,
  },
  {
    id: "3",
    name: "Netzwerksicherheit",
    description: "Sicherheitsmaßnahmen für IT-Infrastrukturen.",
    requiredTrainings: ["3"],
    validityInMonth: 12,
    isMandatory: true,
  },
  {
    id: "5",
    name: "Maschinensicherheit",
    description: "Sicherer Umgang mit Produktionsmaschinen.",
    requiredTrainings: ["5"],
    validityInMonth: 12,
    isMandatory: true,
  },
  {
    id: "6",
    name: "Arbeitsschutz in der Produktion",
    description: "Grundlagen des Arbeitsschutzes und Sicherheitsrichtlinien.",
    requiredTrainings: ["6"],
    validityInMonth: 24,
    isMandatory: true,
  },
  {
    id: "7",
    name: "Qualitätskontrolle",
    description: "Methoden zur Qualitätsprüfung und Fehleranalyse.",
    requiredTrainings: ["7"],
    validityInMonth: 18,
    isMandatory: false,
  },
];

export const trainings: Training[] = [
  {
    id: "1",
    title: "Java-Training",
    description: "Fortgeschrittener Java-Programmierkurs.",
    qualificationID: "1",
    qualification_TrainerID: "789",
    isForEntireDepartment: false,
    isMandatory: false,
    department: "2",
    duration: "",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  },
  {
    id: "5",
    title: "Sicherheitsschulung für Maschinen",
    description: "Einweisung in Sicherheitsrichtlinien für Maschinenbedienung.",
    qualificationID: "5",
    qualification_TrainerID: "E005",
    isForEntireDepartment: false,
    isMandatory: false,
    department: "2",
    duration: "",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  },
  {
    id: '2',
    title: 'IT-Sicherheitsschulung',
    description: 'Grundlegende Schulung zur IT-Sicherheit',
    qualificationID: "5",
    qualification_TrainerID: "E004",
    isForEntireDepartment: false,
    isMandatory: false,
    department: "2",
    duration: "",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  },
  {
    id: '3',
    title: 'Arbeitssicherheit',
    description: 'Schulung zu Arbeitssicherheit und Unfallverhütung',
    qualificationID: "5",
    qualification_TrainerID: "E004",
    isForEntireDepartment: false,
    isMandatory: false,
    department: "2",
    duration: "",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  },
  {
    id: '4',
    title: 'Datenschutz-Grundlagen',
    description: 'DSGVO und betrieblicher Datenschutz',
    qualificationID: "5",
    qualification_TrainerID: "E004",
    isForEntireDepartment: false,
    isMandatory: false,
    department: "2",
    duration: "",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  }
];

export const bookings: TrainingBooking[] = [
  {
    id: '1',
    userId: '1',
    trainingId: '1',
    sessionId: '1',
    status: 'ausstehend',
    createdAt: '2024-03-15T10:00:00',
  },
  {
    id: '2',
    userId: '1',
    trainingId: '2',
    sessionId: '2',
    status: 'genehmigt',
    approvedBy: '5',
    createdAt: '2024-03-10T14:30:00',
  },
  {
    id: '3',
    userId: '2',
    trainingId: '1',
    sessionId: '1',
    status: 'abgelehnt',
    approvedBy: '5',
    createdAt: '2024-03-05T09:15:00',
  },
  {
    id: '4',
    userId: '3',
    trainingId: '3',
    sessionId: '3',
    status: 'abgeschlossen',
    completedAt: '2024-03-01T16:45:00',
    approvedBy: '5',
    createdAt: '2024-02-15T11:30:00',
  },
  {
    id: '5',
    userId: '4',
    trainingId: '2',
    sessionId: '2',
    status: 'ausstehend',
    createdAt: '2024-03-14T13:20:00',
  },
  {
    id: '6',
    userId: '5',
    trainingId: '1',
    sessionId: '1',
    status: 'genehmigt',
    approvedBy: '1',
    createdAt: '2024-03-12T15:45:00',
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
    description: 'Grundlegende Erste-Hilfe-Kenntnisse',
    qualificationIDs: [""],
  },
  {
    id: '2',
    name: 'Brandschutzhelfer',
    description: 'Ausbildung zum Brandschutzhelfer',
    qualificationIDs: [""],
  },
  {
    id: '3',
    name: 'Gabelstaplerführerschein',
    description: 'Berechtigung zum Führen von Gabelstaplern',
    qualificationIDs: [""],
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