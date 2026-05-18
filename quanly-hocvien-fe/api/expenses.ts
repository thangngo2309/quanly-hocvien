import { http } from './http';
import { Course } from './courses';
import { Enrollment } from './enrollments';

export type ExpensePaymentMethod = 'CASH' | 'BANK_TRANSFER';

export type Expense = {
  id: number;
  category_name: string;
  enrollment: Enrollment | null;
  course: Course | null;
  amount: number;
  expense_date: string | null;
  payment_method: ExpensePaymentMethod | string | null;
  receiver_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateExpensePayload = {
  category_name: string;
  enrollment_id?: number | null;
  course_id?: number | null;
  amount: number;
  expense_date?: string | null;
  payment_method?: ExpensePaymentMethod | string | null;
  receiver_name?: string | null;
  note?: string | null;
};

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export const expensesApi = {
  async findAll() {
    const res = await http.get<Expense[]>('/expenses');
    return res.data;
  },

  async findOne(id: number) {
    const res = await http.get<Expense>(`/expenses/${id}`);
    return res.data;
  },

  async create(payload: CreateExpensePayload) {
    const res = await http.post<Expense>('/expenses', payload);
    return res.data;
  },

  async update(id: number, payload: UpdateExpensePayload) {
    const res = await http.patch<Expense>(`/expenses/${id}`, payload);
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(`/expenses/${id}`);
    return res.data;
  },
};