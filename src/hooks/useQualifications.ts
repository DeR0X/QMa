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