import { useQuery } from '@tanstack/react-query';

interface Department {
  ID: number;
  DepartmentID_Atoss: string;
  Department: string;
  positions?: string[]; // Optional since it's not in the DB response
}

const DEBUG = true;

async function fetchDepartments(): Promise<Department[]> {
  if (DEBUG) console.log('Fetching departments...');
  
  try {
    const response = await fetch('/api/departments', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (DEBUG) {
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }

    // Ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data = await response.json();
    if (DEBUG) {
      console.log('Raw department data:', data);
    }

    // Transform the data to include empty positions array if needed
    const transformedData = Array.isArray(data) ? data.map(dept => ({
      ...dept,
      positions: dept.positions || [] // Initialize empty positions array if not present
    })) : [data].map(dept => ({
      ...dept,
      positions: dept.positions || [] // Initialize empty positions array if not present
    }));

    if (DEBUG) {
      console.log('Transformed department data:', transformedData);
    }

    return transformedData;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    retry: 1,
    onError: (error) => {
      console.error('Department query error:', error);
    }
  });
}