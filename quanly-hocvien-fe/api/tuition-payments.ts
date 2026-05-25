import { http } from "./http";
import { Enrollment } from "./enrollments";

export type PaymentMethod = "CASH" | "BANK_TRANSFER";

export type TuitionPayment = {
  id: number;
  enrollment: Enrollment | null;
  payment_round: number;
  amount: number;
  payment_date: string | null;
  payment_method: PaymentMethod | string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTuitionPaymentPayload = {
  enrollment_id: number;
  payment_round: number;
  amount: number;
  payment_date?: string | null;
  payment_method?: PaymentMethod | string | null;
  note?: string | null;
};

export type UpdateTuitionPaymentPayload = Partial<CreateTuitionPaymentPayload>;

export type TuitionPaymentFilter = {
  courseId?: number;
};

export const tuitionPaymentsApi = {
  async findAll(filter?: { courseId?: number }) {
    const res = await http.get<TuitionPayment[]>('/tuition-payments', {
      params: {
        course_id: filter?.courseId,
      },
    });
  
    return res.data;
  },

  async findOne(id: number) {
    const res = await http.get<TuitionPayment>(`/tuition-payments/${id}`);
    return res.data;
  },

  async create(payload: CreateTuitionPaymentPayload) {
    const res = await http.post<TuitionPayment>("/tuition-payments", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateTuitionPaymentPayload) {
    const res = await http.patch<TuitionPayment>(
      `/tuition-payments/${id}`,
      payload
    );
    return res.data;
  },

  async remove(id: number) {
    const res = await http.delete<{ message?: string }>(
      `/tuition-payments/${id}`
    );
    return res.data;
  },
};
