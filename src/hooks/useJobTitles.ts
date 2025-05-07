import { useQuery } from '@tanstack/react-query';
import { useEmployees } from './useEmployees';
import type { JobTitle } from '../types';

interface JobTitlesParams {
  sortBy?: 'id' | 'jobTitle' | 'description';
  sortOrder?: 'asc' | 'desc';
}

const API_BASE_URL = 'http://localhost:5000/api';

async function fetchJobTitles(params: JobTitlesParams = {}): Promise<JobTitle[]> {
  const queryParams = new URLSearchParams();
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/job-titles`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job titles: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching job titles:', error);
    throw error;
  }
}

export function useJobTitles(params: JobTitlesParams = {}) {
  const { data: employeesData } = useEmployees();

  return useQuery({
    queryKey: ['jobTitles', params],
    queryFn: async () => {
      // First try to extract from employee data
      if (employeesData?.data) {
        const uniqueJobTitles = Array.from(
          new Set(
            employeesData.data
              .filter(emp => emp.JobTitleID && emp.JobTitle)
              .map(emp => ({
                id: emp.JobTitleID.toString(),
                jobTitle: emp.JobTitle,
                description: emp.JobTitle
              }))
          )
        );

        // If we found job titles in employee data, use them
        if (uniqueJobTitles.length > 0) {
          return uniqueJobTitles;
        }
      }

      // If no job titles found in employee data, fetch from API
      return fetchJobTitles(params);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });
}