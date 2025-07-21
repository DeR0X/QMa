import { useQuery } from '@tanstack/react-query';
import { baseApi } from '../services/apiClient';
import type { Training, Employee } from '../types';

interface CompletedTraining extends Training {
  employeeId: string;
  employeeName: string;
  completedDate?: string;
  isForEntireDepartment?: boolean;
}

export function useCompletedTrainings(employeeId?: string) {
  return useQuery({
    queryKey: ['completedTrainings', employeeId],
    queryFn: async () => {
      try {
        // Get all trainings first
        const allTrainings = await baseApi.get<any[]>('/trainings');

        // Get all employees to map names and departments
        const employees = await baseApi.get<any[]>('/employees');

        const completedTrainings: CompletedTraining[] = [];

        if (employeeId) {
          // Get completed trainings for specific employee
          const assignments = await baseApi.get<any[]>(`/trainings-employee/${employeeId}`);

          assignments.forEach((assignment: any) => {
            // Check for completed status - handle both boolean and numeric values
            const isCompleted = assignment.completed === true || 
                               assignment.completed === 1 || 
                               assignment.completed === '1' ||
                               assignment.Completed === true ||
                               assignment.Completed === 1 ||
                               assignment.Completed === '1';
            
          
            if (isCompleted) {
              const training = allTrainings.find((t: any) => t.ID === assignment.TrainingID);
              const employee = employees.find((e: any) => e.ID.toString() === employeeId);
              
              if (training && employee) {
                completedTrainings.push({
                  ID: training.ID,
                  Name: training.Name,
                  Description: training.Description,
                  completed: true,
                  qualificationID: training.QualificationID?.toString(),
                  qualification_TrainerID: training.Qualification_TrainerID?.toString(),
                  isForEntireDepartment: training.isForEntireDepartment || false,
                  department: training.department,
                  isMandatory: training.isMandatory || false,
                  trainingDate: training.TrainingDate,
                  qualificationIds: training.qualificationIds || [],
                  isAssigned: true,
                  employeeId: employee.ID.toString(),
                  employeeName: employee.FullName,
                  completedDate: assignment.completedDate || assignment.updatedAt,
                });
              }
            }
          });
        } else {
          // Get all completed trainings for all employees
          const allAssignments = await baseApi.get<any[]>('/trainings-employee');
         

          allAssignments.forEach((assignment: any) => {
            // Check for completed status - handle both boolean and numeric values
            const isCompleted = assignment.completed === true || 
                               assignment.completed === 1 || 
                               assignment.completed === '1' ||
                               assignment.Completed === true ||
                               assignment.Completed === 1 ||
                               assignment.Completed === '1';
            
             
            
            if (isCompleted) {
              const training = allTrainings.find((t: any) => t.ID === assignment.TrainingID);
              const employee = employees.find((e: any) => e.ID === assignment.EmployeeID);
              
              if (training && employee) {
                completedTrainings.push({
                  ID: training.ID,
                  Name: training.Name,
                  Description: training.Description,
                  completed: true,
                  qualificationID: training.QualificationID?.toString(),
                  qualification_TrainerID: training.Qualification_TrainerID?.toString(),
                  isForEntireDepartment: training.isForEntireDepartment || false,
                  department: training.department,
                  isMandatory: training.isMandatory || false,
                  trainingDate: training.TrainingDate,
                  qualificationIds: training.qualificationIds || [],
                  isAssigned: true,
                  employeeId: employee.ID.toString(),
                  employeeName: employee.FullName,
                  completedDate: assignment.completedDate || assignment.updatedAt,
                });
              }
            }
          });
        }

       
        
        // Sort by completion date (newest first)
        return completedTrainings.sort((a, b) => {
          const dateA = new Date(a.completedDate || a.trainingDate || 0);
          const dateB = new Date(b.completedDate || b.trainingDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (error) {
        console.error('Error fetching completed trainings:', error);
        return [];
      }
    }
  });
}

export type { CompletedTraining };