import { useQuery } from '@tanstack/react-query';
import { baseApi } from '../services/apiClient';
import type { Employee } from '../types';

interface TrainingParticipant {
  ID: number;
  TrainingID: number;
  EmployeeID: number;
  FirstName: string;
  SurName: string;
  TrainingName: string;
  TrainingDescription: string;
}

export function useTrainingParticipants(trainingId: number) {
  return useQuery<TrainingParticipant[]>({
    queryKey: ['trainingParticipants', trainingId],
    queryFn: async () => {
      if (!trainingId) return [];
      
      // Get all training-employee assignments
      const allAssignments = await baseApi.get<any[]>('/trainings-employee');
      
      // Filter assignments for this specific training and return the format matching the API response
      const trainingParticipants = allAssignments.filter(
        (assignment: any) => assignment.TrainingID === trainingId
      );
      
      return trainingParticipants.map((assignment: any) => ({
        ID: assignment.ID,
        TrainingID: assignment.TrainingID,
        EmployeeID: assignment.EmployeeID,
        StaffNumber: assignment.StaffNumber,
        FirstName: assignment.FirstName,
        SurName: assignment.SurName,
        TrainingName: assignment.TrainingName,
        TrainingDescription: assignment.TrainingDescription
      }));
    },
    enabled: !!trainingId,
  });
}