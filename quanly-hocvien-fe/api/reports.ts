import { http } from './http';

export type ReportSummary = {
  course_id: number | null;
  total_students: number;
  total_tuition: number;
  total_paid: number;
  total_remaining: number;
  total_expense: number;
  profit: number;
};

export type PaymentStatusText = 'UNPAID' | 'PARTIAL' | 'PAID';

export type ReportPaymentStatusItem = {
  enrollment_id: number;
  student: {
    id: number;
    full_name: string;
    phone: string | null;
    date_of_birth: string | null;
    avatar_url: string | null;
  } | null;
  course: {
    id: number;
    name: string;
    code: string | null;
  } | null;
  tuition_fee: number;
  first_payment_expected: number;
  first_payment_paid: number;
  first_payment_status: PaymentStatusText | string;
  second_payment_expected: number;
  second_payment_paid: number;
  second_payment_status: PaymentStatusText | string;
  total_paid: number;
  remaining_amount: number;
  status: string;
};

export type ReportExpenseDetailItem = {
  id: number;
  category_name: string;
  amount: number;
  expense_date: string | null;
  payment_method: string | null;
  receiver_name: string | null;
  note: string | null;
  target_type: 'ENROLLMENT' | 'COURSE' | string;
  course: {
    id: number;
    name: string;
    code: string | null;
  } | null;
  student: {
    id: number;
    full_name: string;
    phone: string | null;
  } | null;
};

export const reportsApi = {
  async getSummary(courseId?: number) {
    const res = await http.get<ReportSummary>('/reports/summary', {
      params: courseId ? { course_id: courseId } : undefined,
    });

    return res.data;
  },

  async getPaymentStatus(courseId?: number) {
    const res = await http.get<ReportPaymentStatusItem[]>(
      '/reports/payment-status',
      {
        params: courseId ? { course_id: courseId } : undefined,
      },
    );

    return res.data;
  },

  async getExpenseDetails(courseId?: number) {
    const res = await http.get<ReportExpenseDetailItem[]>(
      '/reports/expense-details',
      {
        params: courseId ? { course_id: courseId } : undefined,
      },
    );
  
    return res.data;
  },
};
