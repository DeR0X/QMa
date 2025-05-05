import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../services/api';
import type { Employee } from '../types';

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  department?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  fields?: string[];
  ids?: string[];
  startDate?: string;
  endDate?: string;
}

export interface EmployeeResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery<EmployeeResponse>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      try {
        const response = await employeeApi.getEmployees(filters);
        
        // Client-side filtering for search
        if (filters.search) {
          const searchTerms = filters.search.toLowerCase().split(' ');
          
          const filteredData = response.data.filter((employee: Employee) => {
            const fullName = employee.fullName?.toLowerCase() || '';
            const staffNumber = employee.staffNumber?.toString().toLowerCase() || '';
            
            // Check if ALL search terms match either the full name or staff number
            return searchTerms.every(term => 
              fullName.includes(term) || staffNumber.includes(term)
            );
          });

          return {
            ...response,
            data: filteredData,
            pagination: {
              ...response.pagination,
              total: filteredData.length,
              totalPages: Math.ceil(filteredData.length / (filters.limit || 10))
            }
          };
        }

        return response;
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getEmployeeById(id),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Employee, 'id'>) => employeeApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
