export type Role = 'employee' | 'supervisor' | 'hr';

export interface Department {
  id: string;
  departmentID_Atoss: string;
  department: string;
  positions: string[];
}

export interface JobTitle {
  id: string;
  jobTitle: string;
  description: string;
  qualificationIDs: string[];
}

export interface Employee {
  ID: number;
  StaffNumber: number;
  SurName: string;
  FirstName: string;
  FullName: string;
  role: Role;
  eMail: string;
  DepartmentID: number | null;
  Department: string | null;
  JobTitleID: number | null;
  SupervisorID: number | null;
  additionalSkillIDs?: string[];
  additionalPositions?: string[];
  isActive: boolean;
  isTrainer?: boolean;
  trainerFor?: string[];
  PasswordHash: string | null;
}

export interface Qualification {
  id: string;
  name: string;
  description: string;
  requiredQualifications: string[];
  validityInMonth: number;
  isMandatory: boolean;
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


export interface Training {
  id: string;
  title: string;
  description: string;
  qualificationID: string;
  qualification_TrainerID: string;
  isForEntireDepartment: boolean;
  department: string;
  duration: string;
  isMandatory: boolean;
  trainingDate: string;
  qualificationIds: string[];
  completed: boolean;
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

export interface EmployeeQualification {
  id: string;
  employeeID: string;
  qualificationID: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil?: string;
}

export interface QualificationTrainer {
  id: string;
  qualificationID: string;
  employeeID: string;
}

export interface EmployeeQualificationTraining {
  id: string;
  employee_QualificationID: string;
  trainingID: string;
}

export interface AdditionalSkill {
  id: string;
  name: string;
  description: string;
  qualificationIDs: string[];
}

export interface EmployeeAdditionalSkill {
  id: string;
  employeeID: string;
  additionalSkillID: string;
}

export interface JobTitleQualification {
  id: string;
  jobTitleID: string;
  qualificationID: string;
}

export interface AdditionalSkillQualification {
  id: string;
  additionalSkillID: string;
  qualificationID: string;
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

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  department?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  fields?: string[];
  ids?: string[];
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}