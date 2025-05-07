import { useQuery } from '@tanstack/react-query';
import { useEmployees } from './useEmployees';
import type { JobTitle } from '../types';

interface JobTitlesParams {
  sortBy?: 'id' | 'jobTitle' | 'description';
  sortOrder?: 'asc' | 'desc';
}

const API_BASE_URL = 'http://localhost:5000/api';

// Central store for job titles data
let jobTitlesStore: {
  data: JobTitle[];
  lastFetched: number;
  isInitialized: boolean;
} = {
  data: [],
  lastFetched: 0,
  isInitialized: false,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if cache is valid
const isCacheValid = () => {
  return jobTitlesStore.isInitialized && 
    (Date.now() - jobTitlesStore.lastFetched) < CACHE_DURATION;
};

async function fetchJobTitles(params: JobTitlesParams = {}): Promise<JobTitle[]> {
  const queryParams = new URLSearchParams();
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/job-titles${queryString ? `?${queryString}` : ''}`;
  
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
      // First check if we have valid cached data
      if (isCacheValid()) {
        return jobTitlesStore.data;
      }

      // Try to extract from employee data first
      if (employeesData?.data) {
        const uniqueJobTitles = Array.from(
          new Set(
            employeesData.data
              .filter(emp => emp.JobTitleID && emp.JobTitle)
              .map(emp => ({
                id: emp.JobTitleID.toString(),
                jobTitle: emp.JobTitle,
                description: emp.JobTitle,
                qualificationIDs: [] // Initialize with empty array since we don't have this data from employees
              }))
          )
        );

        // If we found job titles in employee data, cache and use them
        if (uniqueJobTitles.length > 0) {
          jobTitlesStore = {
            data: uniqueJobTitles,
            lastFetched: Date.now(),
            isInitialized: true
          };
          return uniqueJobTitles;
        }
      }

      // If no job titles found in employee data or cache, fetch from API
      const jobTitles = await fetchJobTitles(params);
      
      // Update the store
      jobTitlesStore = {
        data: jobTitles,
        lastFetched: Date.now(),
        isInitialized: true
      };

      return jobTitles;
    },
    staleTime: CACHE_DURATION,
    retry: 1
  });
}