import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi, EmployeeQualificationData } from '../services/api';
import { toast } from 'sonner';

export function useEmployeeQualifications(employeeId: string) {
  return useQuery({
    queryKey: ['employeeQualifications', employeeId],
    queryFn: () => employeeApi.getEmployeeQualifications(employeeId),
    enabled: !!employeeId,
  });
}

export function useAddEmployeeQualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: EmployeeQualificationData }) =>
      employeeApi.addEmployeeQualification(employeeId, data),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications', employeeId] });
      toast.success('Qualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Qualifikation: ${error.message}`);
    },
  });
}