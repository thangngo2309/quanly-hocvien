"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

import GenericDataGrid from "@/components/common/GenericDataGrid";
import { Enrollment, enrollmentsApi } from "@/api/enrollments";
import {
  CreateTuitionPaymentPayload,
  PaymentMethod,
  TuitionPayment,
  tuitionPaymentsApi,
} from "@/api/tuition-payments";
import PageHeader from "@/components/common/PageHeader";

type TuitionPaymentFormValues = {
  enrollment_id: string;
  payment_round: string;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod | string;
  note: string;
};

const today = new Date().toISOString().slice(0, 10);

const defaultFormValues: TuitionPaymentFormValues = {
  enrollment_id: "",
  payment_round: "1",
  amount: "",
  payment_date: today,
  payment_method: "CASH",
  note: "",
};

const paymentMethods: {
  value: PaymentMethod;
  label: string;
}[] = [
  {
    value: "CASH",
    label: "Tiền mặt",
  },
  {
    value: "BANK_TRANSFER",
    label: "Chuyển khoản",
  },
];

function onlyNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return today;

  return value.slice(0, 10);
}

function getPaymentMethodLabel(method?: string | null) {
  return paymentMethods.find((item) => item.value === method)?.label || "-";
}

function getExpectedAmount(enrollment: Enrollment | null, round: number) {
  if (!enrollment) return 0;

  if (round === 1) {
    return Number(enrollment.first_payment_expected || 0);
  }

  if (round === 2) {
    return Number(enrollment.second_payment_expected || 0);
  }

  return 0;
}

function getEnrollmentLabel(enrollment: Enrollment) {
  const studentName = enrollment.student?.full_name || "Chưa có học viên";
  const courseName = enrollment.course?.name || "Chưa có khóa";

  return `${studentName} - ${courseName}`;
}

function getTotalPaid(enrollment: Enrollment | null) {
  if (!enrollment) return 0;

  return (enrollment.tuition_payments || []).reduce((sum, payment) => {
    return sum + Number(payment.amount || 0);
  }, 0);
}

function getRemainingAmount(enrollment: Enrollment | null) {
  if (!enrollment) return 0;

  return Math.max(
    Number(enrollment.tuition_fee || 0) - getTotalPaid(enrollment),
    0
  );
}

export default function TuitionPaymentsPage() {
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TuitionPayment | null>(
    null
  );

  const [formValues, setFormValues] =
    useState<TuitionPaymentFormValues>(defaultFormValues);

  const [formError, setFormError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSuccess = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "success",
    });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "error",
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [paymentData, enrollmentData] = await Promise.all([
        tuitionPaymentsApi.findAll(),
        enrollmentsApi.findAll(),
      ]);

      setPayments(paymentData);
      setEnrollments(enrollmentData);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách đóng học phí"
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEnrollment = useMemo(() => {
    const enrollmentId = Number(formValues.enrollment_id || 0);

    return (
      enrollments.find((enrollment) => enrollment.id === enrollmentId) || null
    );
  }, [enrollments, formValues.enrollment_id]);

  const selectedExpectedAmount = useMemo(() => {
    return getExpectedAmount(
      selectedEnrollment,
      Number(formValues.payment_round || 0)
    );
  }, [selectedEnrollment, formValues.payment_round]);

  const openCreateDialog = () => {
    setEditingPayment(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((payment: TuitionPayment) => {
    setEditingPayment(payment);

    setFormValues({
      enrollment_id: payment.enrollment?.id
        ? String(payment.enrollment.id)
        : "",
      payment_round: payment.payment_round
        ? String(payment.payment_round)
        : "1",
      amount: payment.amount ? String(payment.amount) : "",
      payment_date: toDateInputValue(payment.payment_date),
      payment_method: payment.payment_method || "CASH",
      note: payment.note || "",
    });

    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setEditingPayment(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof TuitionPaymentFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormValues((prev) => ({
        ...prev,
        [field]: field === "amount" ? onlyNumber(value) : value,
      }));

      setFormError(null);
    };

  const handleUseExpectedAmount = () => {
    if (!selectedEnrollment) {
      setFormError("Vui lòng chọn học viên trong khóa trước");
      return;
    }

    const remainingAmount = getRemainingAmount(selectedEnrollment);

    if (remainingAmount <= 0) {
      setFormError("Học viên này đã đóng đủ học phí");
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      amount: String(remainingAmount),
    }));

    setFormError(null);
  };

  const buildPayload = (): CreateTuitionPaymentPayload => {
    return {
      enrollment_id: Number(formValues.enrollment_id),
      payment_round: Number(formValues.payment_round),
      amount: Number(formValues.amount || 0),
      payment_date: formValues.payment_date || null,
      payment_method: formValues.payment_method || null,
      note: formValues.note.trim() || null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload.enrollment_id) {
      setFormError("Vui lòng chọn học viên trong khóa");
      return;
    }

    if (![1, 2].includes(payload.payment_round)) {
      setFormError("Vui lòng chọn lần đóng hợp lệ");
      return;
    }

    if (!payload.amount || payload.amount <= 0) {
      setFormError("Vui lòng nhập số tiền đã đóng");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingPayment) {
        await tuitionPaymentsApi.update(editingPayment.id, {
          amount: payload.amount,
          payment_date: payload.payment_date,
          payment_method: payload.payment_method,
          note: payload.note,
        });

        showSuccess("Cập nhật đóng học phí thành công");
      } else {
        await tuitionPaymentsApi.create(payload);
        showSuccess("Thêm đóng học phí thành công");
      }

      setDialogOpen(false);
      setEditingPayment(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không lưu được thông tin đóng học phí"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (payment: TuitionPayment) => {
      const studentName =
        payment.enrollment?.student?.full_name || "học viên này";

      const confirmed = window.confirm(
        `Anh có chắc muốn xóa bản ghi đóng học phí lần ${payment.payment_round} của "${studentName}" không?`
      );

      if (!confirmed) return;

      try {
        setLoading(true);

        await tuitionPaymentsApi.remove(payment.id);

        showSuccess("Xóa bản ghi đóng học phí thành công");

        await loadData();
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : "Không xóa được bản ghi đóng học phí"
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData, showError, showSuccess]
  );

  const columns = useMemo<GridColDef<TuitionPayment>[]>(
    () => [
      {
        field: "student_name",
        headerName: "Học viên",
        flex: 1,
        minWidth: 220,
        renderCell: (params) =>
          params.row.enrollment?.student?.full_name || "-",
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
        renderCell: (params) => params.row.enrollment?.student?.phone || "-",
      },
      {
        field: "course_name",
        headerName: "Khóa học",
        flex: 1,
        minWidth: 230,
        renderCell: (params) => params.row.enrollment?.course?.name || "-",
      },
      {
        field: "payment_round",
        headerName: "Lần đóng",
        width: 120,
        renderCell: (params) => (
          <Chip
            label={`Lần ${params.row.payment_round}`}
            color={params.row.payment_round === 1 ? "primary" : "secondary"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "expected_amount",
        headerName: "Dự kiến",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) =>
          formatCurrency(
            getExpectedAmount(params.row.enrollment, params.row.payment_round)
          ),
      },
      {
        field: "amount",
        headerName: "Đã đóng",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.amount),
      },
      {
        field: "payment_date",
        headerName: "Ngày đóng",
        width: 140,
        renderCell: (params) => formatDate(params.row.payment_date),
      },
      {
        field: "payment_method",
        headerName: "Phương thức",
        width: 140,
        renderCell: (params) =>
          getPaymentMethodLabel(params.row.payment_method),
      },
      {
        field: "note",
        headerName: "Ghi chú",
        minWidth: 180,
        flex: 1,
        renderCell: (params) => params.row.note || "-",
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Sửa">
              <IconButton
                size="small"
                color="primary"
                onClick={() => openEditDialog(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xóa">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [handleDelete, openEditDialog]
  );

  return (
    <Box>
      <PageHeader
        title="Thu học phí"
        description="Quản lý học phí học viên đóng lần 1 và lần 2."
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Tải lại
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
              Thêm đóng học phí
            </Button>
          </>
        }
      />
      
      <GenericDataGrid<TuitionPayment>
        rows={payments}
        columns={columns}
        loading={loading}
        height={650}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingPayment ? "Cập nhật đóng học phí" : "Thêm đóng học phí"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              select
              label="Học viên trong khóa"
              value={formValues.enrollment_id}
              onChange={handleChange("enrollment_id")}
              fullWidth
              required
              disabled={!!editingPayment}
            >
              <MenuItem value="">Chọn học viên trong khóa</MenuItem>

              {enrollments.map((enrollment) => (
                <MenuItem key={enrollment.id} value={String(enrollment.id)}>
                  {getEnrollmentLabel(enrollment)}
                </MenuItem>
              ))}
            </TextField>

            {selectedEnrollment && (
              <Alert severity="info">
                Tổng học phí:{" "}
                <strong>
                  {formatCurrency(selectedEnrollment.tuition_fee)}
                </strong>
                {" | "}
                Dự kiến lần 1:{" "}
                <strong>
                  {formatCurrency(selectedEnrollment.first_payment_expected)}
                </strong>
                {" | "}
                Dự kiến lần 2:{" "}
                <strong>
                  {formatCurrency(selectedEnrollment.second_payment_expected)}
                </strong>
              </Alert>
            )}

            <TextField
              select
              label="Lần đóng"
              value={formValues.payment_round}
              onChange={handleChange("payment_round")}
              fullWidth
              required
              disabled={!!editingPayment}
            >
              <MenuItem value="1">Lần 1</MenuItem>
              <MenuItem value="2">Lần 2</MenuItem>
            </TextField>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <TextField
                label="Số tiền đã đóng"
                value={
                  formValues.amount
                    ? Number(formValues.amount).toLocaleString("vi-VN")
                    : ""
                }
                onChange={(event) => {
                  const rawValue = onlyNumber(event.target.value);

                  setFormValues((prev) => ({
                    ...prev,
                    amount: rawValue,
                  }));

                  setFormError(null);
                }}
                fullWidth
                required
                placeholder="Ví dụ: 8.000.000"
              />

              <Button
                variant="outlined"
                onClick={handleUseExpectedAmount}
                disabled={!selectedEnrollment}
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 150,
                  },
                }}
              >
                Lấy số còn thiếu
              </Button>
            </Stack>

            {selectedEnrollment && (
              <Typography variant="body2" color="text.secondary">
                Số tiền dự kiến cho lần đóng này:{" "}
                <strong>{formatCurrency(selectedExpectedAmount)}</strong>
              </Typography>
            )}

            <TextField
              label="Ngày đóng"
              type="date"
              value={formValues.payment_date}
              onChange={handleChange("payment_date")}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              select
              label="Phương thức thanh toán"
              value={formValues.payment_method}
              onChange={handleChange("payment_method")}
              fullWidth
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Ghi chú"
              value={formValues.note}
              onChange={handleChange("note")}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={submitting}>
            Hủy
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
