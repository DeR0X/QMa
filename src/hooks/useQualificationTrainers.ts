import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { QualificationTrainer } from '../types';

const API_URL = 'http://localhost:5000/api/qualification-trainers';

export function useQualificationTrainers(employeeId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['qualificationTrainers', employeeId],
    queryFn: async () => {
      if (!employeeId) {
        console.warn('No employeeId provided to useQualificationTrainers');
        return [];
      }
      
      console.log('Fetching qualification trainers for employee:', employeeId);
      const response = await axios.get(`${API_URL}/employee/${employeeId}`);
      console.log('API Response:', response.data);
      return response.data as QualificationTrainer[];
    },
    enabled: !!employeeId
  });

  const addTrainer = useMutation({
    mutationFn: async ({ employeeId, qualificationId }: { employeeId: string; qualificationId: string }) => {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      const response = await axios.post(API_URL, {
        employeeId,
        qualificationId
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainers', variables.employeeId] });
    }
  });

  const removeTrainer = useMutation({
    mutationFn: async ({ employeeId, qualificationId }: { employeeId: string; qualificationId: string }) => {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }
      await axios.delete(`${API_URL}/remove`, {
        data: {
          employeeId,
          qualificationId
        }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qualificationTrainers', variables.employeeId] });
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
    queryKey: ['qualificationTrainersByIds', qualificationTrainerIds],
    queryFn: async () => {
      if (!qualificationTrainerIds.length) return {};
      
      const trainers: Record<number, QualificationTrainer> = {};
      await Promise.all(
        qualificationTrainerIds.map(async (id) => {
          try {
            const response = await fetch(`http://localhost:5000/api/qualification-trainers/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch qualification trainer for ID ${id}`);
            const data = await response.json();
            trainers[id] = data;
          } catch (error) {
            console.error(`Error fetching qualification trainer for ID ${id}:`, error);
          }
        })
      );
      return trainers;
    },
    enabled: qualificationTrainerIds.length > 0
  });
} 