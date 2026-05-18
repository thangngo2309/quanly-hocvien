import { http } from './http';
import { Course } from './courses';
import { Student } from './students';

export type EnrollmentStatus = 'STUDYING' | 'COMPLETED' | 'DROPPED';

export type TuitionPayment = {
  id: number;
  payment_round: number;
  amount: number;
  payment_date: string | null;
  payment_method: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Enrollment = {
  id: number;
  student: Student | null;
  course: Course | null;
  tuition_fee: number;
  first_payment_expected: number;
  second_payment_expected: number;
  status: EnrollmentStatus | string;
  note: string | null;
  tuition_payments?: TuitionPayment[];
  created_at: string;
  updated_at: string;
};

export type CreateEnrollmentPayload = {
  student_id: number;
  course_id: number;
  tuition_fee: number;
  first_payment_expected?: number;
  second_payment_expected?: number;
  status?: EnrollmentStatus | string;
  note?: string | null;
};

export type UpdateEnrollmentPayload = Partial<CreateEnrollmentPayload>;

export const enrollmentsApi = {
  async findAll() {
    const res = await http.get<Enrollment[]>('/enrollments');
    return res.data;
  },

  async findOne(id: number) {
    const res = await http.get<Enrollment>(`/enrollments/${id}`);
    return res.data;
  },

  async create(payload: CreateEnrollmentPayload) {
    const res = await http.post<Enrollment>('/enrollments', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateEnrollmentPayload) {
    const res = await http.patch<Enrollment>(`/enrollments/${id}`, payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(`/enrollments/${id}`);
    return res.data;
  },
};