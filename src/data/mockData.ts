// Mock data for Q-Matrix system

import { Department, JobTitle, Employee, Qualification, Training, EmployeeQualification, QualificationTrainer, AdditionalSkill, TrainingBooking, TrainingDocument } from '../types';

export const departments: Department[] = [
  {
    id: "1",
    departmentID_Atoss: "D001",
    department: "IT",
    positions: ["Softwareentwickler", "Database Administrator", "3"],
  },
  {
    id: "2",
    departmentID_Atoss: "D002",
    department: "Personalwesen",
    positions: ["HR Manager", "Personalreferent"],
  },
  {
    id: "3",
    departmentID_Atoss: "D003",
    department: "Produktion",
    positions: ["Produktionsleiter", "Schichtführer", "Maschinenbediener"],
  },
  {
    id: "4",
    departmentID_Atoss: "D004",
    department: "Qualitätsmanagement",
    positions: ["Qualitätsmanager", "Prüftechniker"],
  },
  {
    id: "5",
    departmentID_Atoss: "D005",
    department: "Forschung & Entwicklung",
    positions: ["11", "12"],
  },
];

export const jobTitles: JobTitle[] = [
  {
    id: "1",
    jobTitle: "Software Engineer",
    description: "Entwickelt und wartet Softwaresysteme",
    qualificationIDs: ["1", "2"],
  },
  {
    id: "2",
    jobTitle: "System Administrator",
    description: "Verwaltet IT-Infrastruktur und Netzwerke",
    qualificationIDs: ["3"],
  },
  {
    id: "3",
    jobTitle: "DevOps Engineer",
    description: "Automatisiert Entwicklungs- und Bereitstellungsprozesse",
    qualificationIDs: ["1", "3"],
  },
  {
    id: "4",
    jobTitle: "HR Manager",
    description: "Leitet Personalaktivitäten",
    qualificationIDs: ["4"],
  },
  {
    id: "5",
    jobTitle: "Recruiting Specialist",
    description: "Verantwortlich für Personalrekrutierung",
    qualificationIDs: ["4"],
  },
  {
    id: "6",
    jobTitle: "Produktionsleiter",
    description: "Leitet die Produktionsabteilung",
    qualificationIDs: ["5", "6"],
  },
  {
    id: "7",
    jobTitle: "Maschinenbediener",
    description: "Bedient und wartet Produktionsmaschinen",
    qualificationIDs: ["5", "6"],
  },
  {
    id: "8",
    jobTitle: "Schichtführer",
    description: "Leitet und koordiniert Produktionsschichten",
    qualificationIDs: ["5", "6", "7"],
  },
  {
    id: "9",
    jobTitle: "Qualitätsmanager",
    description: "Leitet das Qualitätsmanagement",
    qualificationIDs: ["7", "8"],
  },
  {
    id: "10",
    jobTitle: "QS-Techniker",
    description: "Führt Qualitätsprüfungen durch",
    qualificationIDs: ["7"],
  },
  {
    id: "11",
    jobTitle: "Entwicklungsingenieur",
    description: "Entwickelt neue Produkte und Technologien",
    qualificationIDs: ["8", "9"],
  },
  {
    id: "12",
    jobTitle: "Forschungsleiter",
    description: "Leitet Forschungsprojekte",
    qualificationIDs: ["8", "9"],
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
    jobTitleID: "4",
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
    role: "supervisor",
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
    departmentID: "2",
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
    jobTitleID: "6",
    isActive: true,
    passwordHash: "102",
  },
  {
    id: "E006",
    staffNumber: "1006",
    surName: "Wagner",
    firstName: "Lisa",
    fullName: "Lisa Wagner",
    role: "employee",
    eMail: "lisa.wagner@example.com",
    departmentID: "3",
    jobTitleID: "7",
    supervisorID: "E005",
    isActive: true,
    passwordHash: "103",
  },
  {
    id: "E007",
    staffNumber: "1007",
    surName: "Becker",
    firstName: "Martin",
    fullName: "Martin Becker",
    role: "employee",
    eMail: "martin.becker@example.com",
    departmentID: "4",
    jobTitleID: "9",
    supervisorID: "E008",
    isActive: true,
    isTrainer: true,
    trainerFor: ["7"],
    passwordHash: "104",
  },
  {
    id: "E008",
    staffNumber: "1008",
    surName: "Hoffmann",
    firstName: "Sandra",
    fullName: "Sandra Hoffmann",
    role: "supervisor",
    eMail: "sandra.hoffmann@example.com",
    departmentID: "4",
    jobTitleID: "9",
    isActive: true,
    passwordHash: "105",
  },
  {
    id: "E009",
    staffNumber: "1009",
    surName: "Schmidt",
    firstName: "Daniel",
    fullName: "Daniel Schmidt",
    role: "employee",
    eMail: "daniel.schmidt@example.com",
    departmentID: "5",
    jobTitleID: "11",
    supervisorID: "E010",
    isActive: true,
    passwordHash: "106",
  },
  {
    id: "E010",
    staffNumber: "1010",
    surName: "Müller",
    firstName: "Christine",
    fullName: "Christine Müller",
    role: "supervisor",
    eMail: "christine.mueller@example.com",
    departmentID: "5",
    jobTitleID: "12",
    isActive: true,
    isTrainer: true,
    trainerFor: ["8", "9"],
    passwordHash: "107",
  },
];

export const qualifications: Qualification[] = [
  {
    id: "1",
    name: "Java-Zertifizierung",
    description: "Zertifizierung für Java-Programmierkenntnisse.",
    requiredQualifications: ["1"],
    validityInMonth: 24,
    isMandatory: true,
  },
  {
    id: "2",
    name: "Datenbankverwaltung",
    description: "Kenntnisse in SQL und Datenbankadministration.",
    requiredQualifications: ["2"],
    validityInMonth: 36,
    isMandatory: false,
  },
  {
    id: "3",
    name: "Netzwerksicherheit",
    description: "Sicherheitsmaßnahmen für IT-Infrastrukturen.",
    requiredQualifications: ["3"],
    validityInMonth: 12,
    isMandatory: true,
  },
  {
    id: "4",
    name: "HR",
    description: "Sicherheitsmaßnahmen für IT-Infrastrukturen.",
    requiredQualifications: ["3"],
    validityInMonth: 12,
    isMandatory: true,
  },
  {
    id: "5",
    name: "Maschinensicherheit",
    description: "Sicherer Umgang mit Produktionsmaschinen.",
    requiredQualifications: ["5"],
    validityInMonth: 12,
    isMandatory: true,
  },
  {
    id: "6",
    name: "Arbeitsschutz in der Produktion",
    description: "Grundlagen des Arbeitsschutzes und Sicherheitsrichtlinien.",
    requiredQualifications: ["6"],
    validityInMonth: 24,
    isMandatory: true,
  },
  {
    id: "7",
    name: "Qualitätskontrolle",
    description: "Methoden zur Qualitätsprüfung und Fehleranalyse.",
    requiredQualifications: ["7"],
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
    duration: "2 Stunden",
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
    duration: "2 Stunden",
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
    duration: "2 Stunden",
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
    duration: "2 Stunden",
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
    duration: "2 Stunden",
    qualificationIds: [""],
    trainingDate: "2024-03-15",
    completed: false,
  }
];

export const bookings: TrainingBooking[] = [
  // Abgeschlossene Schulungen
  {
    id: '1',
    userId: 'E001',
    trainingId: '1',
    sessionId: '1',
    status: 'abgeschlossen',
    completedAt: '2024-02-15',
    approvedBy: 'E003',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    userId: 'E002',
    trainingId: '2',
    sessionId: '2',
    status: 'abgeschlossen',
    completedAt: '2024-02-20',
    approvedBy: 'E003',
    createdAt: '2024-01-20',
  },
  
  // Ausstehende Schulungen (noch nicht genehmigt)
  {
    id: '3',
    userId: 'E001',
    trainingId: '3',
    sessionId: '3',
    status: 'ausstehend',
    createdAt: '2024-03-01',
  },
  {
    id: '4',
    userId: 'E002',
    trainingId: '4',
    sessionId: '4',
    status: 'ausstehend',
    createdAt: '2024-03-05',
  },
  
  // Genehmigte, aber noch nicht abgeschlossene Schulungen
  {
    id: '5',
    userId: 'E006',
    trainingId: '5',
    sessionId: '5',
    status: 'genehmigt',
    approvedBy: 'E005',
    createdAt: '2024-03-10',
  },
  
  // Ablaufende Schulungen (basierend auf Qualifikationen)
  {
    id: '6',
    userId: 'E007',
    trainingId: '2',
    sessionId: '6',
    status: 'abgeschlossen',
    completedAt: '2023-04-15', // Vor fast einem Jahr abgeschlossen
    approvedBy: 'E008',
    createdAt: '2023-04-01',
  },
  {
    id: '7',
    userId: 'E009',
    trainingId: '3',
    sessionId: '7',
    status: 'abgeschlossen',
    completedAt: '2023-05-01', // Vor fast einem Jahr abgeschlossen
    approvedBy: 'E010',
    createdAt: '2023-04-15',
  }
];

export const employeeQualifications: EmployeeQualification[] = [
  // Aktive Qualifikationen
  {
    id: '1',
    employeeID: 'E001',
    qualificationID: '1',
    qualifiedFrom: '2024-02-15',
    toQualifyUntil: '2026-02-15', // 24 Monate Gültigkeit
    isQualifiedUntil: '2026-02-15'
  },
  {
    id: '2',
    employeeID: 'E002',
    qualificationID: '2',
    qualifiedFrom: '2024-02-20',
    toQualifyUntil: '2027-02-20', // 36 Monate Gültigkeit
    isQualifiedUntil: '2027-02-20'
  },
  
  // Bald ablaufende Qualifikationen
  {
    id: '3',
    employeeID: 'E007',
    qualificationID: '3',
    qualifiedFrom: '2023-04-15',
    toQualifyUntil: '2024-04-15', // 12 Monate Gültigkeit, läuft bald ab
    isQualifiedUntil: '2024-04-15'
  },
  {
    id: '4',
    employeeID: 'E009',
    qualificationID: '4',
    qualifiedFrom: '2023-05-01',
    toQualifyUntil: '2024-05-01', // 12 Monate Gültigkeit, läuft bald ab
    isQualifiedUntil: '2024-05-01'
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
    uploadedBy: '6',
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