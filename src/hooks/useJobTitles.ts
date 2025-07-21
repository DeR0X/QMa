import { useQuery } from '@tanstack/react-query';
import { useEmployees } from './useEmployees';
import type { JobTitle } from '../types';
import apiClient from '../services/apiClient';

interface JobTitlesParams {
  sortBy?: 'id' | 'jobTitle' | 'description';
  sortOrder?: 'asc' | 'desc';
}

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
  const endpoint = `/job-titles${queryString ? `?${queryString}` : ''}`;
  
  try {
    const data = await apiClient.get<JobTitle[]>(endpoint);
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
        const jobTitlesMap = new Map();
        employeesData.data
          .filter(emp => emp.JobTitleID && emp.JobTitle)
          .forEach(emp => {
            const id = emp.JobTitleID.toString();
            console.log(`Creating job title: ID=${id}, JobTitle="${emp.JobTitle}"`);
            if (!jobTitlesMap.has(id)) {
              jobTitlesMap.set(id, {
                ID: id,
                JobTitle: emp.JobTitle,
                Description: emp.JobTitle,
                qualificationIDs: [] // Initialize with empty array since we don't have this data from employees
              });
            }
          });
        
        const uniqueJobTitles = Array.from(jobTitlesMap.values());

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