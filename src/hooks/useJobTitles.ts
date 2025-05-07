import { useQuery } from '@tanstack/react-query';
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
  //const url = `${API_BASE_URL}/job-titles${queryString ? `?${queryString}` : ''}`;
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
  return useQuery({
    queryKey: ['jobTitles', params],
    queryFn: () => fetchJobTitles(params),
    retry: 1
  });
}
