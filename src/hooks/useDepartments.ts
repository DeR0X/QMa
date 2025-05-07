import { useQuery } from '@tanstack/react-query';

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

const API_BASE_URL = 'http://localhost:5000/api/v2';

async function fetchDepartments(params: DepartmentsParams = {}): Promise<Department[]> {
  const queryParams = new URLSearchParams();
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/departments${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }

    // Ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data = await response.json();
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