import { useQuery } from '@tanstack/react-query';
import { baseApi } from '../services/apiClient';
import type { Training } from '../types';

interface TrainingDocument {
  DocumentID: number;
  FileName: string;
  UploadDate: string;
  UploadedByName: string;
  Description?: string;
  EmployeeID?: number;
  TrainingID?: number;
}

export function useTrainingDocuments(trainingId: number) {
  return useQuery<TrainingDocument[]>({
    queryKey: ['trainingDocuments', trainingId],
    queryFn: async () => {
      return await baseApi.get<TrainingDocument[]>(`/training-documents/${trainingId}`);
    },
    enabled: !!trainingId,
  });
}

// Hook to get all training documents for an employee
export function useEmployeeTrainingDocuments(employeeId: number) {
  return useQuery<TrainingDocument[]>({
    queryKey: ['employeeTrainingDocuments', employeeId],
    queryFn: async () => {
      try {
        // First, get all trainings for this employee
        const allTrainings = await baseApi.get<any[]>('/trainings-employee');
        
        // Filter trainings for this specific employee
        const employeeTrainings = allTrainings.filter((training: any) => 
          training.EmployeeID === employeeId
        );
        
        // Get training IDs for this employee
        const trainingIds = employeeTrainings.map((training: any) => training.TrainingID);
        
        if (trainingIds.length === 0) {
          return [];
        }
        
        // Get all training documents
        const allTrainingDocuments = await baseApi.get<TrainingDocument[]>('/training-documents');
        
        // Filter documents for trainings that this employee participated in
        return allTrainingDocuments.filter((doc: TrainingDocument) => 
          trainingIds.includes(doc.TrainingID)
        );
      } catch (error) {
        console.error('Error fetching employee training documents:', error);
        return [];
      }
    },
    enabled: !!employeeId,
  });
}