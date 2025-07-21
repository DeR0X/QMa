import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

interface EmployeeQualification {
  ID: string;
  EmployeeID: string;
  QualificationID: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil: string;
}

export const useEmployeeQualifications = (employeeId?: string) => {
  return useQuery({
    queryKey: ['employeeQualifications', employeeId],
    queryFn: async () => {
      try {
        // If employeeId is provided, fetch qualifications for that specific employee
        if (employeeId) {
          return apiClient.get<EmployeeQualification[]>(`/employee-qualifications/${employeeId}`);
        }
        
        // If no employeeId is provided, fetch all employee qualifications
        return apiClient.get<EmployeeQualification[]>('/employee-qualifications');
      } catch (error) {
        console.error('Error fetching qualifications:', error);
        throw error;
      }
    },
    enabled: employeeId === undefined || !!employeeId,
    staleTime: 0, // Reduce stale time to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

export const useAddEmployeeQualification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employeeId: string;
      qualificationId: string;
      qualifiedFrom: string;
      toQualifyUntil: string;
      isQualifiedUntil: boolean;
    }) => {
      return apiClient.post<any>('/employee-qualifications', {
        employeeID: data.employeeId,
        qualificationID: data.qualificationId,
        qualifiedFrom: data.qualifiedFrom,
        toQualifyUntil: data.toQualifyUntil,
        isQualifiedUntil: data.isQualifiedUntil
      });
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      toast.success('Qualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Qualifikation: ${error.message}`);
    },
  });
};

export const useUpdateEmployeeQualification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employeeId: string;
      qualificationId: string;
      qualifiedFrom: string;
      isQualifiedUntil: string;
    }) => {
      return apiClient.put<any>(`/employee-qualifications/${data.employeeId}/${data.qualificationId}`, {
        qualifiedFrom: data.qualifiedFrom,
        isQualifiedUntil: data.isQualifiedUntil
      });
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      toast.success('Qualifikation erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren der Qualifikation: ${error.message}`);
    },
  });
};