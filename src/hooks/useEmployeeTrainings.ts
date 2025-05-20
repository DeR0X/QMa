import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Training } from '../types';

const API_URL = 'http://localhost:5000/api';

export function useEmployeeTrainings(employeeId?: string) {
  return useQuery({
    queryKey: ['employeeTrainings', employeeId],
    queryFn: async () => {
      if (!employeeId) {
        console.warn('No employeeId provided to useEmployeeTrainings');
        return [];
      }
      
      const response = await axios.get(`${API_URL}/employee-trainings/${employeeId}`);
      return response.data as Training[];
    },
    enabled: !!employeeId
  });
} 