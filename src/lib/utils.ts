import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('de-DE', {
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

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} Minuten`;
  } else if (remainingMinutes === 0) {
    return `${hours} Stunden`;
  } else {
    return `${hours} Stunden ${remainingMinutes} Minuten`;
  }
}

export function getLatestQualification(qualifications: any[]) {
  if (!Array.isArray(qualifications) || qualifications.length === 0) return null;
  
  return qualifications.reduce((latest, current) => {
    if (!latest?.qualifiedFrom) return current;
    if (!current?.qualifiedFrom) return latest;
    return new Date(current.qualifiedFrom) > new Date(latest.qualifiedFrom) ? current : latest;
  });
}

export function getLatestQualifications(qualifications: any[]) {
  if (!Array.isArray(qualifications)) return [];
  
  const groupedQuals = qualifications.reduce((acc: { [key: string]: any[] }, qual) => {
    if (!qual?.QualificationID) return acc;
    const key = qual.QualificationID.toString();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(qual);
    return acc;
  }, {});

  return Object.values(groupedQuals).map(quals => getLatestQualification(quals)).filter(Boolean);
}