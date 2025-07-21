import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { additionalFunctionsApi, AdditionalSkill } from '../services/additionalFunctionsApi';
import { toast } from 'sonner';
import { API_BASE_URL_V2 } from '../config/api';

const API_URL = API_BASE_URL_V2;


export function useAdditionalFunctions() {
  return useQuery({
    queryKey: ['additionalFunctions'],
    queryFn: additionalFunctionsApi.getAll,
  });
}

export function useCreateAdditionalFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AdditionalSkill, 'ID'>) => additionalFunctionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFunctions'] });
      toast.success('Zusatzfunktion erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Erstellen der Zusatzfunktion: ${error.message}`);
    },
  });
}

export function useUpdateAdditionalFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdditionalSkill> }) =>
      additionalFunctionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFunctions'] });
      toast.success('Zusatzfunktion erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren der Zusatzfunktion: ${error.message}`);
    },
  });
}

export function useDeleteAdditionalFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => additionalFunctionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFunctions'] });
      toast.success('Zusatzfunktion erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen der Zusatzfunktion: ${error.message}`);
    },
  });
}