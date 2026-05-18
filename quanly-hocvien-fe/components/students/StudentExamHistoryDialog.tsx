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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import GenericDataGrid from '@/components/common/GenericDataGrid';
import { Student } from '@/api/students';
import {
  CreateExamHistoryPayload,
  ExamHistory,
  ExamResult,
  ExamType,
  examHistoriesApi,
} from '@/api/exam-histories';

type Props = {
  open: boolean;
  student: Student | null;
  onClose: () => void;
};

type ExamFormValues = {
  exam_type: ExamType;
  exam_date: string;
  result: ExamResult;
  retake_date: string;
  note: string;
};

const defaultFormValues: ExamFormValues = {
  exam_type: 'GRADUATION',
  exam_date: new Date().toISOString().slice(0, 10),
  result: 'PASSED',
  retake_date: '',
  note: '',
};

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  return value.slice(0, 10);
}

function getExamTypeLabel(type?: string) {
  if (type === 'GRADUATION') return 'Thi tốt nghiệp';
  if (type === 'NATIONAL') return 'Thi sát hạch quốc gia';
  return type || '-';
}

function getResultInfo(result?: string) {
  if (result === 'PASSED') {
    return {
      label: 'Đậu',
      color: 'success' as const,
    };
  }

  if (result === 'FAILED') {
    return {
      label: 'Rớt',
      color: 'error' as const,
    };
  }

  return {
    label: 'Vắng thi',
    color: 'warning' as const,
  };
}

export default function StudentExamHistoryDialog({
  open,
  student,
  onClose,
}: Props) {
  const [rows, setRows] = useState<ExamHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExamHistory | null>(null);
  const [formValues, setFormValues] =
    useState<ExamFormValues>(defaultFormValues);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!student) return;

    try {
      setLoading(true);

      const data = await examHistoriesApi.findAll(student.id);

      setRows(data);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Không tải được lịch sử thi',
      );
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (open && student) {
      loadData();
    }
  }, [open, student, loadData]);

  const openCreateForm = () => {
    setEditingRow(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = useCallback((row: ExamHistory) => {
    setEditingRow(row);

    setFormValues({
      exam_type: row.exam_type as ExamType,
      exam_date: toDateInputValue(row.exam_date),
      result: row.result as ExamResult,
      retake_date: toDateInputValue(row.retake_date),
      note: row.note || '',
    });

    setFormError(null);
    setFormOpen(true);
  }, []);

  const closeForm = () => {
    setFormOpen(false);
    setEditingRow(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof ExamFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setFormValues(prev => {
        if (field === 'result' && value !== 'FAILED') {
          return {
            ...prev,
            result: value as ExamResult,
            retake_date: '',
          };
        }

        return {
          ...prev,
          [field]: value,
        };
      });

      setFormError(null);
    };

  const handleSubmit = async () => {
    if (!student) return;

    if (!formValues.exam_date) {
      setFormError('Vui lòng nhập ngày thi');
      return;
    }

    if (formValues.result === 'FAILED' && !formValues.retake_date) {
      setFormError('Nếu thi rớt, vui lòng nhập ngày thi lại');
      return;
    }

    const payload: CreateExamHistoryPayload = {
      student_id: student.id,
      exam_type: formValues.exam_type,
      exam_date: formValues.exam_date,
      result: formValues.result,
      retake_date:
        formValues.result === 'FAILED'
          ? formValues.retake_date || null
          : null,
      note: formValues.note.trim() || null,
    };

    try {
      setLoading(true);

      if (editingRow) {
        await examHistoriesApi.update(editingRow.id, payload);
      } else {
        await examHistoriesApi.create(payload);
      }

      closeForm();
      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Không lưu được lịch sử thi',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(
    async (row: ExamHistory) => {
      const confirmed = window.confirm('Anh có chắc muốn xóa lịch sử thi này không?');

      if (!confirmed) return;

      try {
        setLoading(true);

        await examHistoriesApi.remove(row.id);

        await loadData();
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : 'Không xóa được lịch sử thi',
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData],
  );

  const columns = useMemo<GridColDef<ExamHistory>[]>(
    () => [
      {
        field: 'exam_type',
        headerName: 'Loại thi',
        flex: 1,
        minWidth: 190,
        renderCell: params => getExamTypeLabel(params.row.exam_type),
      },
      {
        field: 'exam_date',
        headerName: 'Ngày thi',
        width: 130,
        renderCell: params => formatDate(params.row.exam_date),
      },
      {
        field: 'result',
        headerName: 'Kết quả',
        width: 120,
        renderCell: params => {
          const resultInfo = getResultInfo(params.row.result);

          return (
            <Chip
              label={resultInfo.label}
              color={resultInfo.color}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'retake_date',
        headerName: 'Ngày thi lại',
        width: 140,
        renderCell: params => formatDate(params.row.retake_date),
      },
      {
        field: 'note',
        headerName: 'Ghi chú',
        flex: 1,
        minWidth: 180,
        renderCell: params => params.row.note || '-',
      },
      {
        field: 'actions',
        headerName: 'Thao tác',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: params => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Sửa">
              <IconButton
                size="small"
                color="primary"
                onClick={() => openEditForm(params.row)}
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
    [handleDelete, openEditForm],
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          Lịch sử thi của học viên: {student?.full_name}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Lưu lịch sử thi tốt nghiệp tại trung tâm và thi sát hạch quốc gia.
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateForm}
              >
                Thêm lịch sử thi
              </Button>
            </Box>

            <GenericDataGrid<ExamHistory>
              rows={rows}
              columns={columns}
              loading={loading}
              height={420}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingRow ? 'Cập nhật lịch sử thi' : 'Thêm lịch sử thi'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              select
              label="Loại thi"
              value={formValues.exam_type}
              onChange={handleChange('exam_type')}
              fullWidth
            >
              <MenuItem value="GRADUATION">Thi tốt nghiệp tại trung tâm</MenuItem>
              <MenuItem value="NATIONAL">Thi sát hạch quốc gia</MenuItem>
            </TextField>

            <TextField
              label="Ngày thi"
              type="date"
              value={formValues.exam_date}
              onChange={handleChange('exam_date')}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              select
              label="Kết quả"
              value={formValues.result}
              onChange={handleChange('result')}
              fullWidth
            >
              <MenuItem value="PASSED">Đậu</MenuItem>
              <MenuItem value="FAILED">Rớt</MenuItem>
              <MenuItem value="ABSENT">Vắng thi</MenuItem>
            </TextField>

            {formValues.result === 'FAILED' && (
              <TextField
                label="Ngày thi lại"
                type="date"
                value={formValues.retake_date}
                onChange={handleChange('retake_date')}
                fullWidth
                required
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            )}

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
          <Button onClick={closeForm}>Hủy</Button>

          <Button variant="contained" onClick={handleSubmit}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}