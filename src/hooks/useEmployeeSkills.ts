import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEmployees } from './useEmployees';
import { useAdditionalFunctions } from './useAdditionalFunctions';
import {API_BASE_URL} from '../config/api';

export const useGetEmployeeSkills = (employeeId: string) => {
  const { data: additionalSkills } = useAdditionalFunctions();
  
  return useQuery({
    queryKey: ['employeeSkills', employeeId],
    queryFn: async () => {
      // Fetch employee skill assignments from API
      const response = await fetch(`${API_BASE_URL}/employee-skills/${employeeId}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee skills');
      }
      const employeeSkillAssignments = await response.json();
      
      // Combine with additional skills data to get full information
      const skillsWithDetails = employeeSkillAssignments.map((assignment: any) => {
        const skillDetails = additionalSkills?.find(skill => skill.ID === assignment.AdditionalSkillID);
        return {
          ...assignment,
          ...skillDetails, // This will add Name, Description, etc.
        };
      }).filter((skill: any) => skill.Name); // Filter out skills where details weren't found
      
      return {
        skills: skillsWithDetails
      };
    },
    enabled: !!employeeId && !!additionalSkills,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data to ensure immediate updates
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
};

// New hook to get all employee skills for filtering purposes
export const useGetAllEmployeeSkills = () => {
  return useQuery({
    queryKey: ['allEmployeeSkills'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/employee-skills`);
      if (!response.ok) {
        throw new Error('Failed to fetch all employee skills');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useAddEmployeeSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { employeeId: string; skillId: number }) => {
      const response = await fetch(`${API_BASE_URL}/employee-skills`, {
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
    onSuccess: async (_, { employeeId }) => {
      // Invalidate and refetch employee skills immediately
      await queryClient.invalidateQueries({ 
        queryKey: ['employeeSkills', employeeId]
      });
      
      // Invalidate employee qualifications to refresh the qualifications tab
      await queryClient.invalidateQueries({ 
        queryKey: ['employeeQualifications', employeeId]
      });
      
      // Invalidate other related queries
      await queryClient.invalidateQueries({ queryKey: ['allEmployeeSkills'] });
      await queryClient.invalidateQueries({ queryKey: ['additionalFunctions'] });
      
      // Force immediate refetch to ensure UI updates
      await queryClient.refetchQueries({ 
        queryKey: ['employeeSkills', employeeId]
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['employeeQualifications', employeeId]
      });
      
      toast.success('Zusatzfunktion erfolgreich hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Hinzufügen der Zusatzfunktion: ${error.message}`);
    },
  });
};

export const useDeleteEmployeeSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, skillId }: { employeeId: string; skillId: number }) => {
      const response = await fetch(`${API_BASE_URL}/employee-skills/${employeeId}/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }
    },
    onSuccess: async (_, { employeeId }) => {
      // Invalidate and refetch employee skills immediately
      await queryClient.invalidateQueries({ 
        queryKey: ['employeeSkills', employeeId]
      });
      
      // Invalidate employee qualifications to refresh the qualifications tab
      await queryClient.invalidateQueries({ 
        queryKey: ['employeeQualifications', employeeId]
      });
      
      // Invalidate other related queries
      await queryClient.invalidateQueries({ queryKey: ['allEmployeeSkills'] });
      await queryClient.invalidateQueries({ queryKey: ['additionalFunctions'] });
      
      // Force immediate refetch to ensure UI updates
      await queryClient.refetchQueries({ 
        queryKey: ['employeeSkills', employeeId]
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['employeeQualifications', employeeId]
      });
      
      toast.success('Zusatzfunktion erfolgreich entfernt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Entfernen der Zusatzfunktion: ${error.message}`);
    },
  });
};