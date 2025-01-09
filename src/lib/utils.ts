import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function calculateExpirationDate(date: string | Date, validityPeriod: number) {
  const expirationDate = new Date(date);
  expirationDate.setMonth(expirationDate.getMonth() + validityPeriod);
  return expirationDate;
}

export function isExpiringSoon(date: Date, monthsThreshold = 2) {
  const warningDate = new Date();
  warningDate.setMonth(warningDate.getMonth() + monthsThreshold);
  return date <= warningDate;
}