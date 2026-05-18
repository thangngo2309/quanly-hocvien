import { http } from './http';

export type StudentEnrollment = {
  id: number;
  tuition_fee: number;
  first_payment_expected: number;
  second_payment_expected: number;
  status: string;
  note: string | null;
  course: {
    id: number;
    name: string;
    code: string | null;
    status: string;
    is_finance_closed?: boolean;
  } | null;
  tuition_payments?: {
    id: number;
    payment_round: number;
    amount: number;
  }[];
};

export type Student = {
  id: number;
  full_name: string;
  date_of_birth: string | null;
  phone: string | null;
  avatar_url: string | null;

  identity_number: string | null;
  identity_issue_date: string | null;
  identity_issue_place: string | null;

  previous_license_number: string | null;
  previous_license_class: string | null;
  previous_license_issue_place: string | null;
  previous_license_issue_date: string | null;

  enrollments?: StudentEnrollment[];

  created_at: string;
  updated_at: string;
};

export type CreateStudentPayload = {
  full_name: string;
  date_of_birth?: string | null;
  phone?: string | null;
  avatar_url?: string | null;

  identity_number?: string | null;
  identity_issue_date?: string | null;
  identity_issue_place?: string | null;

  previous_license_number?: string | null;
  previous_license_class?: string | null;
  previous_license_issue_place?: string | null;
  previous_license_issue_date?: string | null;
};

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export const studentsApi = {
  async findAll() {
    const res = await http.get<Student[]>('/students');
    return res.data;
  },

  async findOne(id: number) {
    const res = await http.get<Student>(`/students/${id}`);
    return res.data;
  },

  async create(payload: CreateStudentPayload) {
    const res = await http.post<Student>('/students', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateStudentPayload) {
    const res = await http.patch<Student>(`/students/${id}`, payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(`/students/${id}`);
    return res.data;
  },
};