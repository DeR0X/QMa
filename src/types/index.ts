export type Role = 'employee' | 'supervisor' | 'hr';

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
  failedLoginAttempts: number;
  requiredQualifications: string[];
  startDate: string;
  performanceHistory?: PerformanceReview[];
  certifications?: Certification[];
  hasChangedPassword?: boolean;
}

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
  qualifications: string[];
  failedLoginAttempts: number;
  requiredQualifications: string[];
  startDate: string;
  hasChangedPassword?: boolean;
}


export interface Training {
  id: string;
  title: string;
  description: string;
  duration: string;
  validityPeriod: number;
  isMandatory: boolean;
  trainer: string;
  maxParticipants: number;
  targetPositions: string[];
  isForEntireDepartment: boolean;
  department: string;
  qualificationIds: string[];
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

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
  category: 'user' | 'training' | 'compensation' | 'performance' | 'system';
}

export interface CompensationDetails {
  salary?: number;
  salaryGrade: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  bonuses?: {
    type: string;
    amount: number;
    date: string;
  }[];
}

export interface CareerDevelopment {
  currentPath: string;
  targetPosition?: string;
  developmentGoals?: string[];
  mentors?: string[];
  nextSteps?: string[];
}

export interface PerformanceReview {
  id: string;
  date: string;
  reviewer: string;
  rating: number;
  strengths: string[];
  improvements: string[];
  goals: string[];
  comments: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending';
}

