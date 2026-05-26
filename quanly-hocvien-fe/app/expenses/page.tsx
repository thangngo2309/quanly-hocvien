"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { coursesApi, Course } from "@/api/courses";
import { Enrollment, enrollmentsApi } from "@/api/enrollments";
import {
  CreateExpensePayload,
  Expense,
  ExpensePaymentMethod,
  expensesApi,
} from "@/api/expenses";
import PageHeader from "@/components/common/PageHeader";

type ExpenseTargetType = "ENROLLMENT" | "COURSE";

type ExpenseFormValues = {
  category_name: string;
  target_type: ExpenseTargetType;
  enrollment_id: string;
  course_id: string;
  amount: string;
  expense_date: string;
  payment_method: ExpensePaymentMethod | string;
  receiver_name: string;
  note: string;
};

const today = new Date().toISOString().slice(0, 10);

const defaultFormValues: ExpenseFormValues = {
  category_name: "",
  target_type: "ENROLLMENT",
  enrollment_id: "",
  course_id: "",
  amount: "",
  expense_date: today,
  payment_method: "CASH",
  receiver_name: "",
  note: "",
};

const expenseCategories = [
  "Chi phí hồ sơ",
  "Chi hoa hồng",
  "Chi học phí",
  "Chi giáo viên",
  "Chi phí xăng xe",
  "Chi phí khám sức khỏe",
  "Chi phí thi",
  "Chi phí sân tập",
  "Chi phí sửa xe",
  "Chi phí đối tác 1",
  "Chi phí đối tác 2",
  "Chi phí khác",
];

const paymentMethods: {
  value: ExpensePaymentMethod;
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

function getEnrollmentLabel(enrollment: Enrollment) {
  const studentName = enrollment.student?.full_name || "Chưa có học viên";
  const courseName = enrollment.course?.name || "Chưa có khóa";

  return `${studentName} - ${courseName}`;
}

function getExpenseTargetType(expense: Expense): ExpenseTargetType {
  if (expense.enrollment) return "ENROLLMENT";
  return "COURSE";
}

function getExpenseTargetLabel(expense: Expense) {
  if (expense.enrollment) {
    const studentName = expense.enrollment.student?.full_name || "Học viên";
    const courseName = expense.enrollment.course?.name || "Khóa học";

    return `${studentName} - ${courseName}`;
  }

  if (expense.course) {
    return expense.course.name;
  }

  return "Chi phí khác";
}

function getExpenseTargetChip(expense: Expense) {
  const type = getExpenseTargetType(expense);

  if (type === "ENROLLMENT") {
    return {
      label: "Theo học viên",
      color: "primary" as const,
    };
  }

  if (type === "COURSE") {
    return {
      label: "Theo khóa",
      color: "warning" as const,
    };
  }

  return {
    label: "Chi phí khác",
    color: "default" as const,
  };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [formValues, setFormValues] =
    useState<ExpenseFormValues>(defaultFormValues);

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

      const [expenseData, enrollmentData, courseData] = await Promise.all([
        expensesApi.findAll({
          courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
        }),
        enrollmentsApi.findAll(),
        coursesApi.findAll(),
      ]);

      setExpenses(expenseData);
      setEnrollments(enrollmentData);
      setCourses(courseData);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách khoản chi"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingExpense(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((expense: Expense) => {
    const targetType = getExpenseTargetType(expense);

    setEditingExpense(expense);

    setFormValues({
      category_name: expense.category_name || "",
      target_type: targetType,
      enrollment_id: expense.enrollment?.id
        ? String(expense.enrollment.id)
        : "",
      course_id: expense.course?.id ? String(expense.course.id) : "",
      amount: expense.amount ? String(expense.amount) : "",
      expense_date: toDateInputValue(expense.expense_date),
      payment_method: expense.payment_method || "CASH",
      receiver_name: expense.receiver_name || "",
      note: expense.note || "",
    });

    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setEditingExpense(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof ExpenseFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormValues((prev) => {
        if (field === "target_type") {
          return {
            ...prev,
            target_type: value as ExpenseTargetType,
            enrollment_id: "",
            course_id: "",
          };
        }

        return {
          ...prev,
          [field]: field === "amount" ? onlyNumber(value) : value,
        };
      });

      setFormError(null);
    };

  const buildPayload = (): CreateExpensePayload => {
    const targetType = formValues.target_type;

    return {
      category_name: formValues.category_name.trim(),
      enrollment_id:
        targetType === "ENROLLMENT" && formValues.enrollment_id
          ? Number(formValues.enrollment_id)
          : null,
      course_id:
        targetType === "COURSE" && formValues.course_id
          ? Number(formValues.course_id)
          : null,
      amount: Number(formValues.amount || 0),
      expense_date: formValues.expense_date || null,
      payment_method: formValues.payment_method || null,
      receiver_name: formValues.receiver_name.trim() || null,
      note: formValues.note.trim() || null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload.category_name) {
      setFormError("Vui lòng nhập loại chi phí");
      return;
    }

    if (formValues.target_type === "ENROLLMENT" && !payload.enrollment_id) {
      setFormError("Vui lòng chọn học viên trong khóa");
      return;
    }

    if (formValues.target_type === "COURSE" && !payload.course_id) {
      setFormError("Vui lòng chọn khóa học");
      return;
    }

    if (!payload.amount || payload.amount <= 0) {
      setFormError("Vui lòng nhập số tiền chi");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingExpense) {
        await expensesApi.update(editingExpense.id, {
          category_name: payload.category_name,
          amount: payload.amount,
          expense_date: payload.expense_date,
          payment_method: payload.payment_method,
          receiver_name: payload.receiver_name,
          note: payload.note,
        });

        showSuccess("Cập nhật khoản chi thành công");
      } else {
        await expensesApi.create(payload);
        showSuccess("Thêm khoản chi thành công");
      }

      setDialogOpen(false);
      setEditingExpense(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không lưu được khoản chi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (expense: Expense) => {
      const confirmed = window.confirm(
        `Anh có chắc muốn xóa khoản chi "${expense.category_name}" không?`
      );

      if (!confirmed) return;

      try {
        setLoading(true);

        await expensesApi.remove(expense.id);

        showSuccess("Xóa khoản chi thành công");

        await loadData();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "Không xóa được khoản chi"
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData, showError, showSuccess]
  );

  const columns = useMemo<GridColDef<Expense>[]>(
    () => [
      {
        field: "category_name",
        headerName: "Loại chi phí",
        minWidth: 180,
        flex: 1,
      },
      {
        field: "target_type",
        headerName: "Đối tượng",
        width: 140,
        renderCell: (params) => {
          const chip = getExpenseTargetChip(params.row);

          return (
            <Chip
              label={chip.label}
              color={chip.color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "target_name",
        headerName: "Gắn với",
        minWidth: 260,
        flex: 1,
        renderCell: (params) => getExpenseTargetLabel(params.row),
      },
      {
        field: "amount",
        headerName: "Số tiền",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.amount),
      },
      {
        field: "expense_date",
        headerName: "Ngày chi",
        width: 140,
        renderCell: (params) => formatDate(params.row.expense_date),
      },
      {
        field: "payment_method",
        headerName: "Phương thức",
        width: 140,
        renderCell: (params) =>
          getPaymentMethodLabel(params.row.payment_method),
      },
      {
        field: "receiver_name",
        headerName: "Người nhận",
        width: 170,
        renderCell: (params) => params.row.receiver_name || "-",
      },
      {
        field: "note",
        headerName: "Ghi chú",
        minWidth: 180,
        flex: 1,
        renderCell: (params) => params.row.note || "-",
      },
      {
        field: "created_at",
        headerName: "Ngày tạo",
        width: 150,
        renderCell: (params) => formatDate(params.row.created_at),
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
        title="Quản lý khoản chi"
        description="Quản lý chi phí theo học viên, theo khóa học hoặc chi phí khác."
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
              Thêm khoản chi
            </Button>
          </>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
          >
            <TextField
              select
              label="Lọc theo khóa học"
              value={selectedCourseId}
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
              }}
              sx={{
                minWidth: {
                  xs: "100%",
                  md: 360,
                },
              }}
            >
              <MenuItem value="">Tất cả khóa học</MenuItem>

              {courses.map((course) => (
                <MenuItem key={course.id} value={String(course.id)}>
                  {course.name}
                  {course.code ? ` - ${course.code}` : ""}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => setSelectedCourseId("")}
              disabled={!selectedCourseId}
            >
              Xóa lọc
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <GenericDataGrid<Expense>
        rows={expenses}
        columns={columns}
        loading={loading}
        height={650}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingExpense ? "Cập nhật khoản chi" : "Thêm khoản chi"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              select
              label="Loại chi phí"
              value={formValues.category_name}
              onChange={handleChange("category_name")}
              fullWidth
              required
            >
              <MenuItem value="">Chọn loại chi phí</MenuItem>

              {expenseCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Chi phí gắn với"
              value={formValues.target_type}
              onChange={handleChange("target_type")}
              fullWidth
              disabled={!!editingExpense}
            >
              <MenuItem value="ENROLLMENT">Học viên trong khóa</MenuItem>
              <MenuItem value="COURSE">Khóa học</MenuItem>
            </TextField>

            {formValues.target_type === "ENROLLMENT" && (
              <TextField
                select
                label="Học viên trong khóa"
                value={formValues.enrollment_id}
                onChange={handleChange("enrollment_id")}
                fullWidth
                required
                disabled={!!editingExpense}
              >
                <MenuItem value="">Chọn học viên trong khóa</MenuItem>

                {enrollments.map((enrollment) => (
                  <MenuItem key={enrollment.id} value={String(enrollment.id)}>
                    {getEnrollmentLabel(enrollment)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {formValues.target_type === "COURSE" && (
              <TextField
                select
                label="Khóa học"
                value={formValues.course_id}
                onChange={handleChange("course_id")}
                fullWidth
                required
                disabled={!!editingExpense}
              >
                <MenuItem value="">Chọn khóa học</MenuItem>

                {courses.map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.name}
                    {course.code ? ` - ${course.code}` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Số tiền chi"
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
              placeholder="Ví dụ: 500.000"
            />

            <TextField
              label="Ngày chi"
              type="date"
              value={formValues.expense_date}
              onChange={handleChange("expense_date")}
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
              label="Người nhận tiền"
              value={formValues.receiver_name}
              onChange={handleChange("receiver_name")}
              fullWidth
              placeholder="Ví dụ: Giáo viên, sân tập, đối tác..."
            />

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
