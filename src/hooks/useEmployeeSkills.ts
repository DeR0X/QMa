import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEmployees } from './useEmployees';
import { useAdditionalFunctions } from './useAdditionalFunctions';
import apiClient from '../services/apiClient';

export const useGetEmployeeSkills = (employeeId: string) => {
  const { data: additionalSkills } = useAdditionalFunctions();
  
  return useQuery({
    queryKey: ['employeeSkills', employeeId],
    queryFn: async () => {
      try {
        // Fetch employee skill assignments from API
        const employeeSkillAssignments = await apiClient.get(`/employee-skills/${employeeId}?t=${Date.now()}`) as any[];
        
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
      } catch (error) {
        console.error('Error fetching employee skills:', error);
        throw error;
      }
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
      try {
        return await apiClient.get('/employee-skills') as any[];
      } catch (error) {
        console.error('Error fetching all employee skills:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useAddEmployeeSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { employeeId: string; skillId: number }) => {
      return await apiClient.post('/employee-skills', {
        EmployeeID: data.employeeId,
        SkillID: data.skillId
      });
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
      await apiClient.delete(`/employee-skills/${employeeId}/${skillId}`);
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