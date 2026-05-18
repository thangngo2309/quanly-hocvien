import { http } from './http';
import { Student } from './students';

export type ExamType = 'GRADUATION' | 'NATIONAL';

export type ExamResult = 'PASSED' | 'FAILED' | 'ABSENT';

export type ExamHistory = {
  id: number;
  student: Student | null;
  exam_type: ExamType | string;
  exam_date: string | null;
  result: ExamResult | string;
  retake_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateExamHistoryPayload = {
  student_id: number;
  exam_type: ExamType;
  exam_date?: string | null;
  result: ExamResult;
  retake_date?: string | null;
  note?: string | null;
};

export type UpdateExamHistoryPayload = Partial<CreateExamHistoryPayload>;

export const examHistoriesApi = {
  async findAll(studentId?: number) {
    const res = await http.get<ExamHistory[]>('/exam-histories', {
      params: studentId ? { student_id: studentId } : undefined,
    });

    return res.data;
  },

  async create(payload: CreateExamHistoryPayload) {
    const res = await http.post<ExamHistory>('/exam-histories', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateExamHistoryPayload) {
    const res = await http.patch<ExamHistory>(`/exam-histories/${id}`, payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(
      `/exam-histories/${id}`,
    );

    return res.data;
  },
};