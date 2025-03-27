import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { jobTitles as mockJobTitles } from '../data/mockData';

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
    const response = await fetch(`${API_URL}api/jobtitles`, {
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
      throw new Error(`Failed to fetch job titles: ${response.status} ${response.statusText}`);
    }

    // Ensure we're getting JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    const data = await response.json();
    if (DEBUG) {
      console.log('Raw job titles data:', data);
    }

    // If no data is returned, use mock data
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No job titles found in database, using mock data');
      return mockJobTitles;
    }

    // Transform the data to match our interface
    const transformedData = data.map(job => ({
      id: job.id.toString(),
      jobTitle: job.jobTitle || job.JobTitle || 'Unknown Title',
      description: job.description || job.Description || '',
      qualificationIDs: job.qualificationIDs || job.QualificationIDs || []
    }));

    if (DEBUG) {
      console.log('Transformed job titles data:', transformedData);
    }

    return transformedData;
  } catch (error) {
    console.error('Error fetching job titles:', error);
    console.log('Falling back to mock data');
    return mockJobTitles;
  }
}

export function useJobTitles() {
  const options: UseQueryOptions<JobTitle[], Error> = {
    queryKey: ['jobTitles'],
    queryFn: fetchJobTitles,
    retry: 1
  };

  return useQuery(options);
}