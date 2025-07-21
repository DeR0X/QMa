import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationTrainersApi } from '../services/apiClient';
import type { QualificationTrainer } from '../types';

export function useQualificationTrainers(employeeId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['qualificationTrainers', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      console.log('Fetching qualification trainers for employee:', employeeId);
      const data = await qualificationTrainersApi.get<QualificationTrainer[]>(`/employee/${employeeId}`);
      console.log('API Response:', data);
      return data as QualificationTrainer[];
    },
    enabled: !!employeeId
  });

  const addTrainer = useMutation({
    mutationFn: async ({ employeeId, qualificationId }: { employeeId: string; qualificationId: string }) => {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      return await qualificationTrainersApi.post<any>('/', {
        employeeId,
        qualificationId
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all trainer-related queries
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['allQualificationTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainersByQualificationId'] });
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainersByIds'] });
    }
  });

  const removeTrainer = useMutation({
    mutationFn: async ({ employeeId, qualificationId }: { employeeId: string; qualificationId: string }) => {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      await qualificationTrainersApi.delete<any>('/remove', {
        body: {
          employeeId,
          qualificationId
        }
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all trainer-related queries
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['allQualificationTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainersByQualificationId'] });
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainersByIds'] });
    }
  });

  return {
    data,
    isLoading,
    error,
    addTrainer,
    removeTrainer
  };
}

export function useQualificationTrainersByIds(qualificationTrainerIds: number[]) {
  return useQuery<Record<number, QualificationTrainer>>({
    queryKey: ['qualificationTrainersByIds', qualificationTrainerIds.sort().join(',')],
    queryFn: async () => {
      if (!qualificationTrainerIds.length) return {};
      
      try {
        // Fetch ALL qualification trainers in a single API call instead of one per ID
        const allTrainers = await qualificationTrainersApi.get<QualificationTrainer[]>('/');
        
        // Filter and map the data to only include requested IDs
      const trainers: Record<number, QualificationTrainer> = {};
        if (Array.isArray(allTrainers)) {
          allTrainers.forEach(trainer => {
            if (qualificationTrainerIds.includes(trainer.ID)) {
              trainers[trainer.ID] = trainer;
            }
          });
        }
        
        return trainers;
          } catch (error) {
        console.error('Error fetching qualification trainers:', error);
        throw error;
      }
    },
    enabled: qualificationTrainerIds.length > 0,
    staleTime: 0, // Daten sind sofort veraltet und werden bei jedem Aufruf neu geladen
    refetchOnWindowFocus: true, // Daten werden neu geladen wenn das Fenster den Fokus erhält
    refetchOnMount: true, // Daten werden neu geladen wenn die Komponente gemountet wird
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Hook to get all qualification trainers (replaces direct API calls in modals)
export function useAllQualificationTrainers() {
  return useQuery<QualificationTrainer[]>({
    queryKey: ['allQualificationTrainers'],
    queryFn: async () => {
      return await qualificationTrainersApi.get<QualificationTrainer[]>('/');
    },
    staleTime: 0, // Daten sind sofort veraltet und werden bei jedem Aufruf neu geladen
    refetchOnWindowFocus: true, // Daten werden neu geladen wenn das Fenster den Fokus erhält
    refetchOnMount: true, // Daten werden neu geladen wenn die Komponente gemountet wird
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Hook to get trainers for a specific qualification
export function useQualificationTrainersByQualificationId(qualificationId: number | string | undefined) {
  return useQuery<QualificationTrainer[]>({
    queryKey: ['qualificationTrainersByQualificationId', qualificationId],
    queryFn: async () => {
      if (!qualificationId) return [];
      return await qualificationTrainersApi.get<QualificationTrainer[]>(`/qualification/${qualificationId}`);
    },
    enabled: !!qualificationId,
    staleTime: 0, // Daten sind sofort veraltet und werden bei jedem Aufruf neu geladen
    refetchOnWindowFocus: true, // Daten werden neu geladen wenn das Fenster den Fokus erhält
    refetchOnMount: true, // Daten werden neu geladen wenn die Komponente gemountet wird
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}