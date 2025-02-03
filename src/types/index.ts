export type Role = 'employee' | 'supervisor' | 'hr';

export interface User {
  id: string;
  personalNumber: string;
  email?: string;
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
  hasChangedPassword?: boolean;
  isTrainer?: boolean;
  trainerFor?: string[]; 
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

export interface TrainingDocument {
  id: string;
  trainingId: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl: string;
  description?: string;
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


export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'pending';
}

export interface DocumentMetadata {
  id: string;
  title: string;
  type: string;
  category: string;
  department: string;
  classification: 'employee' | 'training' | 'policy' | 'procedure';
  expirationDate?: string;
  version: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  description: string;
  relatedDocuments: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  retentionPeriod: number; // in months
  language: string;
  accessControl: {
    visibility: 'public' | 'department' | 'role' | 'private';
    allowedDepartments: string[];
    allowedRoles: string[];
    allowedUsers: string[];
    permissions: {
      read: string[];
      write: string[];
      delete: string[];
    };
  };
  auditTrail: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

export interface DocumentUploadFormData {
  file: File | null;
  url: string;
  metadata: Omit<DocumentMetadata, 'id' | 'createdAt' | 'updatedAt' | 'auditTrail'>;
}