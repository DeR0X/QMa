import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

interface Department {
  ID: number;
  DepartmentID_Atoss: string;
  Department: string;
  positions?: string[];
}

interface DepartmentsParams {
  sortBy?: 'ID' | 'DepartmentID_Atoss' | 'Department';
  sortOrder?: 'asc' | 'desc';
}

async function fetchDepartments(params: DepartmentsParams = {}): Promise<Department[]> {
  const queryParams = new URLSearchParams();
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/viewDepartments${queryString ? `?${queryString}` : ''}`;

  try {
    const data = await apiClient.get<Department[]>(endpoint);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

export function useDepartments(params: DepartmentsParams = {}) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => fetchDepartments(params),
    retry: 1
  });
}