
import { useQuery } from '@tanstack/react-query';
import type { TrainingBooking } from '../types';

interface BookingsParams {
  userId?: string;
  status?: string;
}

const API_BASE_URL = 'http://0.0.0.0:5000/api/v2';

async function fetchBookings(params: BookingsParams = {}): Promise<TrainingBooking[]> {
  const queryParams = new URLSearchParams();
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.status) queryParams.append('status', params.status);

  const response = await fetch(`${API_BASE_URL}/bookings?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
}

export function useBookings(params: BookingsParams = {}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => fetchBookings(params),
  });
}
