import { useQuery } from '@tanstack/react-query';
import type { Training } from '../types';

const DEBUG = true;

async function fetchTrainings(): Promise<Training[]> {
  if (DEBUG) console.log('Fetching trainings...');
  
  try {
    const response = await fetch('http://localhost:5000/api/trainings', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trainings: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trainings:', error);
    throw error;
  }
}

export const useTrainings = () => {
  return useQuery({
    queryKey: ['trainings'],
    queryFn: fetchTrainings,
  });
}; 