"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { CreateStudentPayload, Student, studentsApi } from "@/api/students";
import { uploadsApi } from "@/api/uploads";

import DescriptionIcon from '@mui/icons-material/Description';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import StudentExamHistoryDialog from '@/components/students/StudentExamHistoryDialog';

type StudentFormValues = {
  full_name: string;
  date_of_birth: string;
  phone: string;
  avatar_url: string;

  identity_number: string;
  identity_issue_date: string;
  identity_issue_place: string;

  previous_license_number: string;
  previous_license_class: string;
  previous_license_issue_place: string;
  previous_license_issue_date: string;
};

const defaultFormValues: StudentFormValues = {
  full_name: "",
  date_of_birth: "",
  phone: "",
  avatar_url: "",

  identity_number: "",
  identity_issue_date: "",
  identity_issue_place: "",

  previous_license_number: "",
  previous_license_class: "A1",
  previous_license_issue_place: "",
  previous_license_issue_date: "",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  return value.slice(0, 10);
}

function getImageSrc(value?: string | null) {
  if (!value) return undefined;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  return value;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [previewImage, setPreviewImage] = useState<{
    open: boolean;
    src: string;
    title: string;
  }>({
    open: false,
    src: "",
    title: "",
  });

  const [formValues, setFormValues] =
    useState<StudentFormValues>(defaultFormValues);

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

  const [examDialog, setExamDialog] = useState<{
    open: boolean;
    student: Student | null;
  }>({
    open: false,
    student: null,
  });

  const openExamHistoryDialog = useCallback((student: Student) => {
    setExamDialog({
      open: true,
      student,
    });
  }, []);
  
  const closeExamHistoryDialog = () => {
    setExamDialog({
      open: false,
      student: null,
    });
  };

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);

      const data = await studentsApi.findAll();

      setStudents(data);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách học viên"
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((student: Student) => {
    setEditingStudent(student);

    setFormValues({
      full_name: student.full_name || "",
      date_of_birth: toDateInputValue(student.date_of_birth),
      phone: student.phone || "",
      avatar_url: student.avatar_url || "",

      identity_number: student.identity_number || "",
      identity_issue_date: toDateInputValue(student.identity_issue_date),
      identity_issue_place: student.identity_issue_place || "",

      previous_license_number: student.previous_license_number || "",
      previous_license_class: student.previous_license_class || "A1",
      previous_license_issue_place: student.previous_license_issue_place || "",
      previous_license_issue_date: toDateInputValue(
        student.previous_license_issue_date
      ),
    });

    setFormError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = () => {
    if (submitting || uploading) return;

    setDialogOpen(false);
    setEditingStudent(null);
    setFormValues(defaultFormValues);
    setFormError(null);
  };

  const handleChange =
    (field: keyof StudentFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      setFormError(null);
    };

  const handleUploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setFormError(null);

      const result = await uploadsApi.uploadStudentAvatar(file);

      setFormValues((prev) => ({
        ...prev,
        avatar_url: result.url,
      }));

      showSuccess("Upload hình học viên thành công");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Upload hình thất bại"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const buildPayload = (): CreateStudentPayload => {
    return {
      full_name: formValues.full_name.trim(),
      date_of_birth: formValues.date_of_birth || null,
      phone: formValues.phone.trim() || null,
      avatar_url: formValues.avatar_url.trim() || null,

      identity_number: formValues.identity_number.trim() || null,
      identity_issue_date: formValues.identity_issue_date || null,
      identity_issue_place: formValues.identity_issue_place.trim() || null,

      previous_license_number:
        formValues.previous_license_number.trim() || null,
      previous_license_class: formValues.previous_license_class.trim() || null,
      previous_license_issue_place:
        formValues.previous_license_issue_place.trim() || null,
      previous_license_issue_date:
        formValues.previous_license_issue_date || null,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (!payload.full_name) {
      setFormError("Vui lòng nhập họ và tên học viên");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, payload);
        showSuccess("Cập nhật học viên thành công");
      } else {
        await studentsApi.create(payload);
        showSuccess("Thêm học viên thành công");
      }

      setDialogOpen(false);
      setEditingStudent(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadStudents();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không lưu được học viên"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (student: Student) => {
      const confirmed = window.confirm(
        `Anh có chắc muốn xóa học viên "${student.full_name}" không?`
      );

      if (!confirmed) return;

      try {
        setLoading(true);

        await studentsApi.remove(student.id);

        showSuccess("Xóa học viên thành công");

        await loadStudents();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "Không xóa được học viên"
        );
      } finally {
        setLoading(false);
      }
    },
    [loadStudents, showError, showSuccess]
  );

  const openImagePreview = useCallback((student: Student) => {
    const imageSrc = getImageSrc(student.avatar_url);

    if (!imageSrc) return;

    setPreviewImage({
      open: true,
      src: imageSrc,
      title: student.full_name,
    });
  }, []);

  const closeImagePreview = () => {
    setPreviewImage({
      open: false,
      src: "",
      title: "",
    });
  };

  const openStudyApplication = useCallback((student: Student) => {
    window.open(`/students/${student.id}/don-hoc-lai-xe`, "_blank");
  }, []);

  const openTestingApplication = useCallback((student: Student) => {
    window.open(`/students/${student.id}/don-sat-hach`, "_blank");
  }, []);

  const columns = useMemo<GridColDef<Student>[]>(
    () => [
      {
        field: "avatar_url",
        headerName: "Hình",
        width: 90,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const imageSrc = getImageSrc(params.row.avatar_url);

          return (
            <Avatar
              src={imageSrc}
              alt={params.row.full_name}
              onClick={() => openImagePreview(params.row)}
              sx={{
                width: 42,
                height: 42,
                cursor: imageSrc ? "pointer" : "default",
                border: "1px solid #e5e7eb",
                "&:hover": imageSrc
                  ? {
                      opacity: 0.85,
                      transform: "scale(1.05)",
                    }
                  : undefined,
                transition: "all 0.15s ease",
              }}
            >
              {params.row.full_name?.charAt(0)?.toUpperCase()}
            </Avatar>
          );
        },
      },
      {
        field: "full_name",
        headerName: "Họ và tên",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "date_of_birth",
        headerName: "Ngày sinh",
        width: 140,
        renderCell: (params) => formatDate(params.row.date_of_birth),
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 160,
        renderCell: (params) => params.row.phone || "-",
      },
      {
        field: "identity_number",
        headerName: "Số CCCD",
        width: 160,
        renderCell: (params) => params.row.identity_number || "-",
      },
      {
        field: "previous_license_class",
        headerName: "GPLX đã có",
        width: 130,
        renderCell: (params) => params.row.previous_license_class || "-",
      },
      {
        field: "previous_license_number",
        headerName: "Số GPLX",
        width: 160,
        renderCell: (params) => params.row.previous_license_number || "-",
      },
      {
        field: "created_at",
        headerName: "Ngày tạo",
        width: 160,
        renderCell: (params) => formatDate(params.row.created_at),
      },
      {
        field: "actions",
        headerName: "Thao tác",
        width: 230,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Đơn học lái xe">
              <IconButton
                size="small"
                color="success"
                onClick={() => openStudyApplication(params.row)}
              >
                <DescriptionIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Đơn sát hạch">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => openTestingApplication(params.row)}
              >
                <FactCheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Lịch sử thi">
              <IconButton
                size="small"
                color="warning"
                onClick={() => openExamHistoryDialog(params.row)}
              >
                <HistoryEduIcon fontSize="small" />
              </IconButton>
            </Tooltip>

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
      openImagePreview, 
      openStudyApplication, 
      openTestingApplication,
      openExamHistoryDialog,
    ]
  );

  return (
    <Box>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Quản lý học viên
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Quản lý thông tin học viên: họ tên, ngày sinh, số điện thoại và
            hình.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStudents}
            disabled={loading}
          >
            Tải lại
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Thêm học viên
          </Button>
        </Stack>
      </Stack>

      <GenericDataGrid<Student>
        rows={students}
        columns={columns}
        loading={loading}
        height={620}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingStudent ? "Cập nhật học viên" : "Thêm học viên"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Họ và tên"
              value={formValues.full_name}
              onChange={handleChange("full_name")}
              fullWidth
              required
              autoFocus
            />

            <TextField
              label="Ngày sinh"
              type="date"
              value={formValues.date_of_birth}
              onChange={handleChange("date_of_birth")}
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              label="Số điện thoại"
              value={formValues.phone}
              onChange={handleChange("phone")}
              fullWidth
              placeholder="Ví dụ: 0905123456"
            />

            <Typography variant="subtitle1" fontWeight={700}>
              Thông tin căn cước công dân
            </Typography>

            <TextField
              label="Số căn cước công dân"
              value={formValues.identity_number}
              onChange={handleChange("identity_number")}
              fullWidth
              placeholder="Ví dụ: 048xxxxxxxxx"
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <TextField
                label="Ngày cấp CCCD"
                type="date"
                value={formValues.identity_issue_date}
                onChange={handleChange("identity_issue_date")}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Nơi cấp CCCD"
                value={formValues.identity_issue_place}
                onChange={handleChange("identity_issue_place")}
                fullWidth
                placeholder="Ví dụ: Cục Cảnh sát QLHC về TTXH"
              />
            </Stack>

            <Typography variant="subtitle1" fontWeight={700}>
              Giấy phép lái xe đã có trước khi học
            </Typography>

            <TextField
              label="Số giấy phép lái xe"
              value={formValues.previous_license_number}
              onChange={handleChange("previous_license_number")}
              fullWidth
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <TextField
                label="Hạng GPLX đã có"
                value={formValues.previous_license_class}
                onChange={handleChange("previous_license_class")}
                fullWidth
                placeholder="Ví dụ: A1"
              />

              <TextField
                label="Ngày cấp GPLX"
                type="date"
                value={formValues.previous_license_issue_date}
                onChange={handleChange("previous_license_issue_date")}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Stack>

            <TextField
              label="Nơi cấp GPLX"
              value={formValues.previous_license_issue_place}
              onChange={handleChange("previous_license_issue_place")}
              fullWidth
            />

            <Stack spacing={1}>
              <Button variant="outlined" component="label" disabled={uploading}>
                {uploading ? "Đang upload hình..." : "Upload hình học viên"}

                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUploadImage}
                />
              </Button>

              <TextField
                label="Đường dẫn hình"
                value={formValues.avatar_url}
                onChange={handleChange("avatar_url")}
                fullWidth
                placeholder="/uploads/students/hinh-hoc-vien.jpg"
              />
            </Stack>

            {formValues.avatar_url && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={getImageSrc(formValues.avatar_url)}
                  sx={{
                    width: 72,
                    height: 72,
                  }}
                >
                  {formValues.full_name?.charAt(0)?.toUpperCase()}
                </Avatar>

                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Hình học viên
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Hình sẽ được lưu tại backend, DB chỉ lưu đường dẫn.
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={submitting || uploading}>
            Hủy
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || uploading}
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
      <Dialog
        open={previewImage.open}
        onClose={closeImagePreview}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Hình học viên: {previewImage.title}</DialogTitle>

        <DialogContent>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "#f9fafb",
              borderRadius: 2,
              overflow: "hidden",
              p: 2,
            }}
          >
            {previewImage.src && (
              <Box
                component="img"
                src={previewImage.src}
                alt={previewImage.title}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: 2,
                }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeImagePreview}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <StudentExamHistoryDialog
        open={examDialog.open}
        student={examDialog.student}
        onClose={closeExamHistoryDialog}
      />
    </Box>
  );
}
