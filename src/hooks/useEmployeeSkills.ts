import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEmployees } from './useEmployees';

const API_URL = 'http://localhost:5000/api';

export const useGetEmployeeSkills = (employeeId: string) => {
  const { data: employeesData } = useEmployees();
  
  return useQuery({
    queryKey: ['employeeSkills', employeeId],
    queryFn: async () => {
      // First try to get skills from employee view data
      const employee = employeesData?.data.find(emp => emp.ID.toString() === employeeId);
      
      if (employee?.JobTitle && employee?.JobTitleID) {
        // Return skills from employee view
        return {
          jobTitle: employee.JobTitle,
          jobTitleId: employee.JobTitleID,
          skills: [] // Additional skills will be fetched only if needed
        };
      }

      // If not found in view, fetch from API
      const response = await fetch(`${API_URL}/employee-skills/${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee skills');
      }
      return response.json();
    },
    enabled: !!employeeId && !!employeesData,
  });
};

export const useAddEmployeeSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { employeeId: string; skillId: number }) => {
      const response = await fetch(`${API_URL}/employee-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          EmployeeID: data.employeeId,
          SkillID: data.skillId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add skill');
      }

      return response.json();
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeSkills', employeeId] });
      toast.success('Zusatzqualifikation erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Zusatzqualifikation: ${error.message}`);
    },
  });
};

export const useDeleteEmployeeSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, skillId }: { employeeId: string; skillId: number }) => {
      const response = await fetch(`${API_URL}/employee-skills/${employeeId}/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employeeSkills', employeeId] });
      toast.success('Zusatzqualifikation erfolgreich entfernt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Entfernen der Zusatzqualifikation: ${error.message}`);
    },
  });
};