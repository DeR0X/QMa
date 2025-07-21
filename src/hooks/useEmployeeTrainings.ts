import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseApi } from '../services/apiClient';
import type { Training } from '../types';
import { toast } from 'sonner';

export function useEmployeeTrainings(employeeId?: string) {
  return useQuery({
    queryKey: ['employeeTrainings', employeeId],
    queryFn: async () => {
      if (!employeeId) {
        console.warn('No employeeId provided to useEmployeeTrainings');
        return [];
      }
      
      return await baseApi.get<any[]>(`/employee-trainings/${employeeId}`);
    },
    enabled: !!employeeId
  });
}

interface AssignTrainingParams {
  employeeId: string;
  trainingId: string;
}

interface DeleteTrainingParams {
  employeeId: string;
  trainingId: string;
}

export function useAssignEmployeeTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, trainingId }: AssignTrainingParams) => {
      if (!trainingId) {
        throw new Error('TrainingID ist erforderlich');
      }
      
      return await baseApi.post<any>('/trainings-employee', {
        employeeId,
        trainingId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Schulung erfolgreich zugewiesen');
    },
    onError: () => {
      toast.error('Fehler beim Zuweisen der Schulung');
    }
  });
}

export function useDeleteEmployeeTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, trainingId }: DeleteTrainingParams) => {
      return await baseApi.delete<any>(`/trainings-employee/${employeeId}/${trainingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      toast.success('Schulung erfolgreich entfernt');
    },
    onError: () => {
      toast.error('Fehler beim Entfernen der Schulung');
    }
  });
}

export function useTrainingParticipants(trainingId?: string) {
  return useQuery({
    queryKey: ['trainingParticipants', trainingId],
    queryFn: async () => {
      if (!trainingId) return [];
      
      // Get all training-employee assignments for this training
      const allAssignments = await baseApi.get<any[]>('/trainings-employee');
      
      // Filter assignments for this specific training
      const trainingAssignments = allAssignments.filter(
        (assignment: any) => assignment.TrainingID?.toString() === trainingId.toString()
      );
      
      return trainingAssignments.map((assignment: any) => ({
        employeeId: assignment.EmployeeID,
        trainingId: assignment.TrainingID,
        assignmentId: assignment.ID,
        completed: assignment.completed || false
      }));
    },
    enabled: !!trainingId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}