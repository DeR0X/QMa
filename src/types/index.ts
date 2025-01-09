export type Role = 'employee' | 'supervisor';

export interface User {
  id: string;
  personalNumber: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  position: string;
  supervisorId?: string;
  isActive: boolean;
  trainings: string[];
  qualifications: string[];
  avatar?: string;
  failedLoginAttempts: number;
  requiredQualifications: string[];
}

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: 'mitarbeiter' | 'supervisor';
  department: string;
  position: string;
  startDate: string;
  skills: string[];
  performance: {
    rating: number;
    lastReview: string;
  };
  documents: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface Training {
  id: string;
  title: string;
  description: string;
  duration: string;
  validityPeriod: number; // months
  isMandatory: boolean;
  trainer: string;
  maxParticipants: number;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  id: string;
  date: string;
  location: string;
  availableSpots: number;
}

export interface Qualification {
  id: string;
  name: string;
  description: string;
  requiredTrainings: string[];
  validityPeriod: number; // months
}


export interface QualificationHistory {
  id: string;
  userId: string;
  qualificationId: string;
  type: string;
  date: string; // months
  reason?: string;
  approvedBy: string;
}


export interface TrainingBooking {
  id: string;
  userId: string;
  trainingId: string;
  sessionId: string;
  status: 'ausstehend' | 'genehmigt' | 'abgelehnt' | 'abgeschlossen';
  completedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: number;
  kpis: {
    metric: string;
    value: number;
    target: number;
  }[];
}