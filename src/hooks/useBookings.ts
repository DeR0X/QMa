import { useQuery } from '@tanstack/react-query';
import type { TrainingBooking } from '../types';
import apiClient from '../services/apiClient';

interface BookingsParams {
  userId?: string;
  status?: string;
}

async function fetchBookings(params: BookingsParams = {}): Promise<TrainingBooking[]> {
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<TrainingBooking[]>(endpoint, 'v2');
}

export function useBookings(params: BookingsParams = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => fetchBookings(params),
  });
}
