import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

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
      // If employeeId is provided, fetch qualifications for that employee
      if (employeeId) {
        const response = await fetch(`${API_URL}/employee-qualifications/${employeeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch employee qualifications');
        }
        return response.json() as Promise<EmployeeQualification[]>;
      }
      
      // If no employeeId is provided, fetch all employee qualifications
      const response = await fetch(`${API_URL}/employee-qualifications`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee qualifications');
      }

      const data = await response.json();
      if(!employeeId){
        return data;
      }
      // Transform the data into a map of employeeId -> qualifications[]
      return data.reduce((acc: Record<string, EmployeeQualification[]>, qual: EmployeeQualification) => {
        if (!acc[qual.EmployeeID]) {
          acc[qual.EmployeeID] = [];
        }
        acc[qual.EmployeeID].push(qual);
        return acc;
      }, {});
    },
    enabled: employeeId === undefined || !!employeeId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
      queryClient.invalidateQueries({ queryKey: ['employeeQualifications'] });
      toast.success('Qualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Qualifikation: ${error.message}`);
    },
  });
};