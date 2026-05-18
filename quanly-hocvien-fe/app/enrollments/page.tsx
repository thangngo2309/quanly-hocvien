'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

import GenericDataGrid from '@/components/common/GenericDataGrid';
import { studentsApi, Student } from '@/api/students';
import { coursesApi, Course } from '@/api/courses';
import {
  CreateEnrollmentPayload,
  Enrollment,
  EnrollmentStatus,
  enrollmentsApi,
} from '@/api/enrollments';

type EnrollmentFormValues = {
  student_id: string;
  course_id: string;
  tuition_fee: string;
  first_payment_expected: string;
  second_payment_expected: string;
  status: EnrollmentStatus | string;
  note: string;
};

const defaultFormValues: EnrollmentFormValues = {
  student_id: '',
  course_id: '',
  tuition_fee: '',
  first_payment_expected: '',
  second_payment_expected: '',
  status: 'STUDYING',
  note: '',
};

const enrollmentStatuses: {
  value: EnrollmentStatus;
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'error';
}[] = [
  {
    value: 'STUDYING',
    label: 'Đang học',
    color: 'primary',
  },
  {
    value: 'COMPLETED',
    label: 'Hoàn thành',
    color: 'success',
  },
  {
    value: 'DROPPED',
    label: 'Đã nghỉ',
    color: 'error',
  },
];

function onlyNumber(value: string) {
  return value.replace(/[^\d]/g, '');
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function getStatusInfo(status?: string) {
  return (
    enrollmentStatuses.find(item => item.value === status) || {
      value: status || 'STUDYING',
      label: status || 'Đang học',
      color: 'default' as const,
    }
  );
}

function getTotalPaid(enrollment: Enrollment) {
  return (enrollment.tuition_payments || []).reduce((sum, payment) => {
    return sum + Number(payment.amount || 0);
  }, 0);
}

function getRemainingAmount(enrollment: Enrollment) {
  return Number(enrollment.tuition_fee || 0) - getTotalPaid(enrollment);
}

function getPaymentChipColor(remainingAmount: number) {
  if (remainingAmount <= 0) return 'success';
  return 'warning';
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] =
    useState<Enrollment | null>(null);

  const [formValues, setFormValues] =
    useState<EnrollmentFormValues>(defaultFormValues);

  const [formError, setFormError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSuccess = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [enrollmentData, studentData, courseData] = await Promise.all([
        enrollmentsApi.findAll(),
        studentsApi.findAll(),
        coursesApi.findAll(),
      ]);

      setEnrollments(enrollmentData);
      setStudents(studentData);
      setCourses(courseData);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Không tải được dữ liệu học viên trong khóa',
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingEnrollment(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);

    setFormValues({
      student_id: enrollment.student?.id ? String(enrollment.student.id) : '',
      course_id: enrollment.course?.id ? String(enrollment.course.id) : '',
      tuition_fee: enrollment.tuition_fee
        ? String(enrollment.tuition_fee)
        : '',
      first_payment_expected: enrollment.first_payment_expected
        ? String(enrollment.first_payment_expected)
        : '',
      second_payment_expected: enrollment.second_payment_expected
        ? String(enrollment.second_payment_expected)
        : '',
      status: enrollment.status || 'STUDYING',
      note: enrollment.note || '',
    });

    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setEditingEnrollment(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof EnrollmentFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormValues(prev => ({
        ...prev,
        [field]:
          field === 'tuition_fee' ||
          field === 'first_payment_expected' ||
          field === 'second_payment_expected'
            ? onlyNumber(value)
            : value,
      }));

      setFormError(null);
    };

  const handleAutoSplitPayment = () => {
    const tuitionFee = Number(formValues.tuition_fee || 0);

    if (tuitionFee <= 0) {
      setFormError('Vui lòng nhập học phí trước khi tự chia');
      return;
    }

    const firstPayment = Math.floor(tuitionFee / 2);
    const secondPayment = tuitionFee - firstPayment;

    setFormValues(prev => ({
      ...prev,
      first_payment_expected: String(firstPayment),
      second_payment_expected: String(secondPayment),
    }));

    setFormError(null);
  };

  const buildPayload = (): CreateEnrollmentPayload => {
    const tuitionFee = Number(formValues.tuition_fee || 0);

    const firstExpected = formValues.first_payment_expected
      ? Number(formValues.first_payment_expected)
      : Math.floor(tuitionFee / 2);

    const secondExpected = formValues.second_payment_expected
      ? Number(formValues.second_payment_expected)
      : tuitionFee - firstExpected;

    return {
      student_id: Number(formValues.student_id),
      course_id: Number(formValues.course_id),
      tuition_fee: tuitionFee,
      first_payment_expected: firstExpected,
      second_payment_expected: secondExpected,
      status: formValues.status || 'STUDYING',
      note: formValues.note.trim() || null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload.student_id) {
      setFormError('Vui lòng chọn học viên');
      return;
    }

    if (!payload.course_id) {
      setFormError('Vui lòng chọn khóa học');
      return;
    }

    if (!payload.tuition_fee || payload.tuition_fee <= 0) {
      setFormError('Vui lòng nhập học phí');
      return;
    }

    const totalExpected =
      Number(payload.first_payment_expected || 0) +
      Number(payload.second_payment_expected || 0);

    if (totalExpected !== payload.tuition_fee) {
      setFormError(
        'Tổng dự kiến đóng lần 1 và lần 2 phải bằng tổng học phí',
      );
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingEnrollment) {
        await enrollmentsApi.update(editingEnrollment.id, payload);
        showSuccess('Cập nhật học viên trong khóa thành công');
      } else {
        await enrollmentsApi.create(payload);
        showSuccess('Thêm học viên vào khóa thành công');
      }

      setDialogOpen(false);
      setEditingEnrollment(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Không lưu được học viên trong khóa',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (enrollment: Enrollment) => {
      const studentName = enrollment.student?.full_name || 'học viên này';
      const courseName = enrollment.course?.name || 'khóa học';

      const confirmed = window.confirm(
        `Anh có chắc muốn xóa "${studentName}" khỏi "${courseName}" không?`,
      );

      if (!confirmed) return;

      try {
        setLoading(true);

        await enrollmentsApi.remove(enrollment.id);

        showSuccess('Xóa học viên khỏi khóa thành công');

        await loadData();
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : 'Không xóa được học viên khỏi khóa',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData, showError, showSuccess],
  );

  const columns = useMemo<GridColDef<Enrollment>[]>(
    () => [
      {
        field: 'student',
        headerName: 'Học viên',
        flex: 1,
        minWidth: 220,
        renderCell: params => params.row.student?.full_name || '-',
      },
      {
        field: 'phone',
        headerName: 'Số điện thoại',
        width: 150,
        renderCell: params => params.row.student?.phone || '-',
      },
      {
        field: 'course',
        headerName: 'Khóa học',
        flex: 1,
        minWidth: 240,
        renderCell: params => params.row.course?.name || '-',
      },
      {
        field: 'tuition_fee',
        headerName: 'Học phí',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: params => formatCurrency(params.row.tuition_fee),
      },
      {
        field: 'first_payment_expected',
        headerName: 'Dự kiến lần 1',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: params =>
          formatCurrency(params.row.first_payment_expected),
      },
      {
        field: 'second_payment_expected',
        headerName: 'Dự kiến lần 2',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: params =>
          formatCurrency(params.row.second_payment_expected),
      },
      {
        field: 'paid_amount',
        headerName: 'Đã đóng',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: params => formatCurrency(getTotalPaid(params.row)),
      },
      {
        field: 'remaining_amount',
        headerName: 'Còn nợ',
        width: 150,
        align: 'right',
        headerAlign: 'right',
        renderCell: params => {
          const remainingAmount = getRemainingAmount(params.row);

          return (
            <Chip
              label={formatCurrency(remainingAmount)}
              color={getPaymentChipColor(remainingAmount)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'status',
        headerName: 'Trạng thái',
        width: 140,
        renderCell: params => {
          const statusInfo = getStatusInfo(params.row.status);

          return (
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'created_at',
        headerName: 'Ngày tạo',
        width: 150,
        renderCell: params => formatDate(params.row.created_at),
      },
      {
        field: 'actions',
        headerName: 'Thao tác',
        width: 140,
        sortable: false,
        filterable: false,
        renderCell: params => (
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

            <Tooltip title="Xóa khỏi khóa">
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
    [handleDelete, openEditDialog],
  );

  return (
    <Box>
      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{
          xs: 'stretch',
          sm: 'center',
        }}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Học viên trong khóa
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Thêm học viên vào khóa học và nhập học phí riêng cho từng học viên.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
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
            Thêm vào khóa
          </Button>
        </Stack>
      </Stack>

      <GenericDataGrid<Enrollment>
        rows={enrollments}
        columns={columns}
        loading={loading}
        height={650}
      />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingEnrollment
            ? 'Cập nhật học viên trong khóa'
            : 'Thêm học viên vào khóa'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              select
              label="Học viên"
              value={formValues.student_id}
              onChange={handleChange('student_id')}
              fullWidth
              required
              disabled={!!editingEnrollment}
            >
              <MenuItem value="">Chọn học viên</MenuItem>

              {students.map(student => (
                <MenuItem key={student.id} value={String(student.id)}>
                  {student.full_name}
                  {student.phone ? ` - ${student.phone}` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Khóa học"
              value={formValues.course_id}
              onChange={handleChange('course_id')}
              fullWidth
              required
              disabled={!!editingEnrollment}
            >
              <MenuItem value="">Chọn khóa học</MenuItem>

              {courses
                .filter(course => !course.is_finance_closed && course.status !== 'FINISHED')
                .map(course => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.name}
                    {course.code ? ` - ${course.code}` : ''}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="Học phí riêng của học viên"
              value={
                formValues.tuition_fee
                  ? Number(formValues.tuition_fee).toLocaleString('vi-VN')
                  : ''
              }
              onChange={event => {
                const rawValue = onlyNumber(event.target.value);

                setFormValues(prev => ({
                  ...prev,
                  tuition_fee: rawValue,
                }));

                setFormError(null);
              }}
              fullWidth
              required
              placeholder="Ví dụ: 16.000.000"
            />

            <Stack
              direction={{
                xs: 'column',
                sm: 'row',
              }}
              spacing={2}
            >
              <TextField
                label="Dự kiến đóng lần 1"
                value={
                  formValues.first_payment_expected
                    ? Number(
                        formValues.first_payment_expected,
                      ).toLocaleString('vi-VN')
                    : ''
                }
                onChange={event => {
                  const rawValue = onlyNumber(event.target.value);

                  setFormValues(prev => ({
                    ...prev,
                    first_payment_expected: rawValue,
                  }));

                  setFormError(null);
                }}
                fullWidth
                placeholder="8.000.000"
              />

              <TextField
                label="Dự kiến đóng lần 2"
                value={
                  formValues.second_payment_expected
                    ? Number(
                        formValues.second_payment_expected,
                      ).toLocaleString('vi-VN')
                    : ''
                }
                onChange={event => {
                  const rawValue = onlyNumber(event.target.value);

                  setFormValues(prev => ({
                    ...prev,
                    second_payment_expected: rawValue,
                  }));

                  setFormError(null);
                }}
                fullWidth
                placeholder="8.000.000"
              />
            </Stack>

            <Button
              variant="outlined"
              onClick={handleAutoSplitPayment}
              disabled={!formValues.tuition_fee}
            >
              Tự chia học phí thành 2 lần
            </Button>

            <TextField
              select
              label="Trạng thái"
              value={formValues.status}
              onChange={handleChange('status')}
              fullWidth
            >
              {enrollmentStatuses.map(status => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Ghi chú"
              value={formValues.note}
              onChange={handleChange('note')}
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
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar(prev => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar(prev => ({
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