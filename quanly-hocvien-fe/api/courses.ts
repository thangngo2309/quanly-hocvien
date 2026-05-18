import { http } from './http';

export type CourseStatus = 'OPEN' | 'STUDYING' | 'FINISHED' | 'CANCELED';

export type Course = {
  id: number;
  name: string;
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  year: number | null;
  status: CourseStatus | string;
  note: string | null;
  is_finance_closed: boolean;
  finance_closed_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCoursePayload = {
  name: string;
  code?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  year?: number | null;
  status?: CourseStatus | string;
  note?: string | null;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export const coursesApi = {
  async findAll() {
    const res = await http.get<Course[]>('/courses');
    return res.data;
  },

  async findOne(id: number) {
    const res = await http.get<Course>(`/courses/${id}`);
    return res.data;
  },

  async create(payload: CreateCoursePayload) {
    const res = await http.post<Course>('/courses', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateCoursePayload) {
    const res = await http.patch<Course>(`/courses/${id}`, payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(`/courses/${id}`);
    return res.data;
  },

  async closeFinance(id: number) {
    const res = await http.post<Course>(`/courses/${id}/close-finance`);
    return res.data;
  },
  
  async finishCourse(id: number) {
    const res = await http.post<Course>(`/courses/${id}/finish`);
    return res.data;
  },
};