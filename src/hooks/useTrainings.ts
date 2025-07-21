import { useQuery } from '@tanstack/react-query';
import type { Training } from '../types';
import { baseApi } from '../services/apiClient';

export function useTrainings(employeeId?: string) {
  return useQuery({
    queryKey: ['trainings', employeeId],
    queryFn: async () => {
      // First get all available trainings
      const allTrainings = await baseApi.get<any[]>('/trainings');
      // If employeeId is provided, get their assigned trainings
      if (employeeId) {
        const assignments = await baseApi.get<any[]>(`/trainings-employee/${employeeId}`);

        // Map the assignments to trainings and set completion status
        return allTrainings.map((training: any) => {
          const assignment = assignments.find((a: any) => a.TrainingID === training.ID);
          return {
            ID: training.ID,
            Name: training.Name,
            Description: training.Description,
            completed: training.completed ? true : false,
            qualificationID: training.QualificationID?.toString(),
            qualification_TrainerID: training.Qualification_TrainerID?.toString(),
            isForEntireDepartment: training.isForEntireDepartment || false,
            isMandatory: training.isMandatory || false,
            trainingDate: training.TrainingDate,
            qualificationIds: training.qualificationIds || [],
            isAssigned: !!assignment
          };
        }).filter((training: any) => training.isAssigned) as Training[];
      }

      // If no employeeId, return all trainings without assignment info

      return allTrainings.map((training: any) => ({
        ID: training.ID,
        Name: training.Name,
        Description: training.Description,
        completed: training.completed ? true : false, // Default to false for available trainings
        qualificationID: training.QualificationID?.toString(),
        qualification_TrainerID: training.Qualification_TrainerID?.toString(),
        isForEntireDepartment: training.isForEntireDepartment || false,
        isMandatory: training.isMandatory || false,
        trainingDate: training.TrainingDate,
        qualificationIds: training.qualificationIds || []
      })) as Training[];
    }
  });
}