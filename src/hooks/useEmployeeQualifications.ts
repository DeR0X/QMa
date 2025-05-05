import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

interface EmployeeQualification {
  id: string;
  employeeID: string;
  qualificationID: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil: string;
}

export const useEmployeeQualifications = (employeeId: string) => {
  return useQuery({
    queryKey: ['employeeQualifications', employeeId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/employee-qualifications/${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee qualifications');
      }
      return response.json() as Promise<EmployeeQualification[]>;
    },
    enabled: !!employeeId,
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
          isQualifiedUntil: data.isQualifiedUntil
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add qualification');
      }

      return response.json();
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications', employeeId] });
      toast.success('Qualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Qualifikation: ${error.message}`);
    },
  });
};