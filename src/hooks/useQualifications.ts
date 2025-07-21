import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationsApi, Qualification } from '../services/qualificationsApi';
import { baseApi } from '../services/apiClient';
import { toast } from 'sonner';

export function useQualifications() {
  return useQuery({
    queryKey: ['qualifications'],
    queryFn: () => qualificationsApi.getAll(),
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useCreateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Qualification, 'ID'>) => qualificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      queryClient.invalidateQueries({ queryKey: ['qualification-view'] });
      queryClient.invalidateQueries({ queryKey: ['v2/qualification-view'] });
      queryClient.invalidateQueries({ queryKey: ['additional-skills-qualifications'] });
      queryClient.invalidateQueries({ queryKey: ['job-titles-qualifications'] });
      toast.success('Qualifikation erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Erstellen der Qualifikation: ${error.message}`);
    },
  });
}

export function useAddEmployeeQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      employeeId: string; 
      qualificationId: string;
      qualifiedFrom: string;
      toQualifyUntil: string;
    }) => {
      return await baseApi.post('/employee-qualifications', {
        employeeID: data.employeeId,
        qualificationID: data.qualificationId,
        qualifiedFrom: data.qualifiedFrom,
        toQualifyUntil: data.toQualifyUntil,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      toast.success('Qualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Qualifikation: ${error.message}`);
    },
  });
}

export function useUpdateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Qualification> }) =>
      qualificationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      toast.success('Qualifikation erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren der Qualifikation: ${error.message}`);
    },
  });
}

export function useDeleteQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => qualificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      toast.success('Qualifikation erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen der Qualifikation: ${error.message}`);
    },
  });
}