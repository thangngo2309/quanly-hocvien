import { Student } from '@/api/students';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function formatDate(value?: string | null) {
  if (!value) return '...../...../..........';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

}

export function formatFullName(value?: string | null) {
  return value ? value.toUpperCase() : '................................';
}

export function getImageSrc(value?: string | null) {
  if (!value) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }

  return value;
}

export function getStudentAgeText(student: Student) {
  return formatDate(student.date_of_birth);
}

export function printPage() {
  window.print();
}