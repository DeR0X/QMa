import { useQuery, UseQueryOptions } from '@tanstack/react-query';
//import { jobTitles as mockJobTitles } from '../data/mockData'; // Removed mock data import

interface JobTitle {
  id: string;
  jobTitle: string;
  description: string;
}

const API_URL = 'http://localhost:5000/api/v2';
const DEBUG = true;

async function fetchJobTitles(): Promise<JobTitle[]> {
  if (DEBUG) console.log('Fetching job titles...');

  try {
    const response = await fetch('http://localhost:5000/api/job-titles'); //Simplified URL

    if (!response.ok) {
      throw new Error(`Failed to fetch job titles: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match our interface
    return data.map((job: any) => ({
      id: job.ID?.toString() || job.id?.toString(),
      jobTitle: job.JobTitle || job.jobTitle,
      description: job.Description || job.description
    }));
  } catch (error) {
    console.error('Error fetching job titles:', error);
    throw error; // Re-throwing the error for better error handling in useQuery
  }
}

export function useJobTitles() {
  const options: UseQueryOptions<JobTitle[], Error> = {
    queryKey: ['jobTitles'],
    queryFn: fetchJobTitles,
    retry: 1 // Preserving the retry mechanism
  };

  return useQuery(options);
}