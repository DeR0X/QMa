import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationsApi, Qualification } from '../services/qualificationsApi';
import { toast } from 'sonner';

export function useQualifications() {
  return useQuery({
    queryKey: ['qualifications'],
    queryFn: qualificationsApi.getAll,
  });
}

export function useCreateQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Qualification, 'ID'>) => qualificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      toast.success('Qualifikation erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Erstellen der Qualifikation: ${error.message}`);
    },
  });
}

const API_URL = 'http://localhost:5000/api';

export function useAddEmployeeQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      employeeId: string; 
      qualificationId: string;
      qualifiedFrom: string;
      toQualifyUntil: string;
    }) => {
      const response = await fetch(`${API_URL}/employee-qualifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeID: data.employeeId,
          qualificationID: data.qualificationId,
          qualifiedFrom: data.qualifiedFrom,
          toQualifyUntil: data.toQualifyUntil,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add qualification');
      }

      return response.json();
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