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
import {
  Course,
  CourseStatus,
  CreateCoursePayload,
  coursesApi,
} from '@/api/courses';

type CourseFormValues = {
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  year: string;
  status: CourseStatus | string;
  note: string;
};

const defaultFormValues: CourseFormValues = {
  name: '',
  code: '',
  start_date: '',
  end_date: '',
  year: new Date().getFullYear().toString(),
  status: 'OPEN',
  note: '',
};

const courseStatuses: {
  value: CourseStatus;
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'error';
}[] = [
  {
    value: 'OPEN',
    label: 'Đang mở',
    color: 'primary',
  },
  {
    value: 'STUDYING',
    label: 'Đang học',
    color: 'warning',
  },
  {
    value: 'FINISHED',
    label: 'Hoàn thành',
    color: 'success',
  },
  {
    value: 'CANCELED',
    label: 'Đã hủy',
    color: 'error',
  },
];

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  return value.slice(0, 10);
}

function onlyNumber(value: string) {
  return value.replace(/[^\d]/g, '');
}

function getStatusInfo(status?: string) {
  return (
    courseStatuses.find(item => item.value === status) || {
      value: status || 'OPEN',
      label: status || 'Đang mở',
      color: 'default' as const,
    }
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formValues, setFormValues] =
    useState<CourseFormValues>(defaultFormValues);

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

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);

      const data = await coursesApi.findAll();

      setCourses(data);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Không tải được danh sách khóa học',
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const openCreateDialog = () => {
    setEditingCourse(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((course: Course) => {
    setEditingCourse(course);

    setFormValues({
      name: course.name || '',
      code: course.code || '',
      start_date: toDateInputValue(course.start_date),
      end_date: toDateInputValue(course.end_date),
      year: course.year ? String(course.year) : '',
      status: course.status || 'OPEN',
      note: course.note || '',
    });

    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setEditingCourse(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof CourseFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormValues(prev => ({
        ...prev,
        [field]: field === 'year' ? onlyNumber(value) : value,
      }));

      setFormError(null);
    };

  const buildPayload = (): CreateCoursePayload => {
    const startDate = formValues.start_date || null;

    const year = formValues.year
      ? Number(formValues.year)
      : startDate
        ? new Date(startDate).getFullYear()
        : null;

    return {
      name: formValues.name.trim(),
      code: formValues.code.trim() || null,
      start_date: startDate,
      end_date: formValues.end_date || null,
      year,
      status: formValues.status || 'OPEN',
      note: formValues.note.trim() || null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload.name) {
      setFormError('Vui lòng nhập tên khóa học');
      return;
    }

    if (
      payload.start_date &&
      payload.end_date &&
      new Date(payload.end_date).getTime() <
        new Date(payload.start_date).getTime()
    ) {
      setFormError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingCourse) {
        await coursesApi.update(editingCourse.id, payload);
        showSuccess('Cập nhật khóa học thành công');
      } else {
        await coursesApi.create(payload);
        showSuccess('Thêm khóa học thành công');
      }

      setDialogOpen(false);
      setEditingCourse(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadCourses();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Không lưu được khóa học',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (course: Course) => {
      const confirmed = window.confirm(
        `Anh có chắc muốn xóa khóa học "${course.name}" không?`,
      );

      if (!confirmed) return;

      try {
        setLoading(true);

        await coursesApi.remove(course.id);

        showSuccess('Xóa khóa học thành công');

        await loadCourses();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Không xóa được khóa học',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadCourses, showError, showSuccess],
  );

  const handleCloseFinance = useCallback(
    async (course: Course) => {
      const confirmed = window.confirm(
        `Anh có chắc muốn chốt thu chi khóa "${course.name}" không? Sau khi chốt sẽ không thể thêm thu/chi cho khóa này.`,
      );
  
      if (!confirmed) return;
  
      try {
        setLoading(true);
        await coursesApi.closeFinance(course.id);
        showSuccess('Chốt thu chi khóa học thành công');
        await loadCourses();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Không chốt được thu chi',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadCourses, showError, showSuccess],
  );
  
  const handleFinishCourse = useCallback(
    async (course: Course) => {
      const confirmed = window.confirm(
        `Anh có chắc muốn kết thúc khóa "${course.name}" không? Sau khi kết thúc sẽ không thể thêm học viên, thu học phí hoặc khoản chi.`,
      );
  
      if (!confirmed) return;
  
      try {
        setLoading(true);
        await coursesApi.finishCourse(course.id);
        showSuccess('Kết thúc khóa học thành công');
        await loadCourses();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Không kết thúc được khóa học',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadCourses, showError, showSuccess],
  );

  const columns = useMemo<GridColDef<Course>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Tên khóa học',
        flex: 1,
        minWidth: 260,
      },
      {
        field: 'code',
        headerName: 'Mã khóa',
        width: 150,
        renderCell: params => params.row.code || '-',
      },
      {
        field: 'start_date',
        headerName: 'Ngày bắt đầu',
        width: 140,
        renderCell: params => formatDate(params.row.start_date),
      },
      {
        field: 'end_date',
        headerName: 'Ngày kết thúc',
        width: 140,
        renderCell: params => formatDate(params.row.end_date),
      },
      {
        field: 'year',
        headerName: 'Năm',
        width: 100,
        renderCell: params => params.row.year || '-',
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
        width: 340,
        sortable: false,
        filterable: false,
        renderCell: params => (
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              variant="outlined"
              disabled={params.row.is_finance_closed || params.row.status === 'FINISHED'}
              onClick={() => handleCloseFinance(params.row)}
            >
              Chốt thu chi
            </Button>

            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={!params.row.is_finance_closed || params.row.status === 'FINISHED'}
              onClick={() => handleFinishCourse(params.row)}
            >
              Kết thúc
            </Button>
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
    [
      handleDelete, 
      openEditDialog,
      handleCloseFinance,
      handleFinishCourse,
    ],
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
            Quản lý khóa học
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Tạo khóa học, cập nhật thời gian và trạng thái khóa học. Học phí sẽ
            được nhập riêng khi thêm học viên vào khóa.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCourses}
            disabled={loading}
          >
            Tải lại
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Thêm khóa học
          </Button>
        </Stack>
      </Stack>

      <GenericDataGrid<Course>
        rows={courses}
        columns={columns}
        loading={loading}
        height={620}
      />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingCourse ? 'Cập nhật khóa học' : 'Thêm khóa học'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Tên khóa học"
              value={formValues.name}
              onChange={handleChange('name')}
              fullWidth
              required
              autoFocus
              placeholder="Ví dụ: Khóa lái xe tháng 05/2026"
            />

            <TextField
              label="Mã khóa"
              value={formValues.code}
              onChange={handleChange('code')}
              fullWidth
              placeholder="Ví dụ: KHOA-05-2026"
            />

            <Stack
              direction={{
                xs: 'column',
                sm: 'row',
              }}
              spacing={2}
            >
              <TextField
                label="Ngày bắt đầu"
                type="date"
                value={formValues.start_date}
                onChange={handleChange('start_date')}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Ngày kết thúc"
                type="date"
                value={formValues.end_date}
                onChange={handleChange('end_date')}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Stack>

            <TextField
              label="Năm"
              value={formValues.year}
              onChange={handleChange('year')}
              fullWidth
              placeholder="2026"
            />

            <TextField
              select
              label="Trạng thái"
              value={formValues.status}
              onChange={handleChange('status')}
              fullWidth
            >
              {courseStatuses.map(status => (
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