"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
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
import { CreateStudentPayload, Student, studentsApi } from "@/api/students";
import { uploadsApi } from "@/api/uploads";

import DescriptionIcon from "@mui/icons-material/Description";
import FactCheckIcon from "@mui/icons-material/FactCheck";

import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import StudentExamHistoryDialog from "@/components/students/StudentExamHistoryDialog";
import { Course, coursesApi } from "@/api/courses";
import { enrollmentsApi } from "@/api/enrollments";
import PageHeader from "@/components/common/PageHeader";

const identityIssuePlaces = [
  "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
  "Bộ Công an",
];

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

  course_id: string;
  tuition_fee: string;
  first_payment_expected: string;
  second_payment_expected: string;
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

  course_id: "",
  tuition_fee: "",
  first_payment_expected: "",
  second_payment_expected: "",
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

function onlyNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getMainEnrollment(student: Student | null) {
  return student?.enrollments?.[0] || null;
}

function getTotalPaidByEnrollment(student: Student) {
  const enrollment = getMainEnrollment(student);

  if (!enrollment) return 0;

  return (enrollment.tuition_payments || []).reduce((sum, payment) => {
    return sum + Number(payment.amount || 0);
  }, 0);
}

function getRemainingAmountByEnrollment(student: Student) {
  const enrollment = getMainEnrollment(student);

  if (!enrollment) return 0;

  return Math.max(
    Number(enrollment.tuition_fee || 0) - getTotalPaidByEnrollment(student),
    0
  );
}

function getCourseName(student: Student) {
  const enrollment = getMainEnrollment(student);

  return enrollment?.course?.name || "-";
}

function getTuitionFee(student: Student) {
  const enrollment = getMainEnrollment(student);

  return Number(enrollment?.tuition_fee || 0);
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
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

  const [courses, setCourses] = useState<Course[]>([]);

  const [enrollDialog, setEnrollDialog] = useState<{
    open: boolean;
    student: Student | null;
  }>({
    open: false,
    student: null,
  });

  const [enrollForm, setEnrollForm] = useState({
    course_id: "",
    tuition_fee: "",
    first_payment_expected: "",
    second_payment_expected: "",
    note: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [studentData, courseData] = await Promise.all([
        studentsApi.findAll(),
        coursesApi.findAll(),
      ]);

      setStudents(studentData);
      setCourses(courseData);
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
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setFormValues(defaultFormValues);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((student: Student) => {
    const enrollment = getMainEnrollment(student);

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

      course_id: enrollment?.course?.id ? String(enrollment.course.id) : "",
      tuition_fee: enrollment?.tuition_fee
        ? String(enrollment.tuition_fee)
        : "",
      first_payment_expected: enrollment?.first_payment_expected
        ? String(enrollment.first_payment_expected)
        : "",
      second_payment_expected: enrollment?.second_payment_expected
        ? String(enrollment.second_payment_expected)
        : "",
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

    if (formValues.course_id) {
      if (!formValues.tuition_fee || Number(formValues.tuition_fee) <= 0) {
        setFormError("Vui lòng nhập học phí khi chọn khóa học");
        return;
      }

      const tuitionFee = Number(formValues.tuition_fee || 0);
      const firstExpected = formValues.first_payment_expected
        ? Number(formValues.first_payment_expected)
        : Math.floor(tuitionFee / 2);

      const secondExpected = formValues.second_payment_expected
        ? Number(formValues.second_payment_expected)
        : tuitionFee - firstExpected;

      if (firstExpected + secondExpected !== tuitionFee) {
        setFormError("Tổng dự kiến lần 1 và lần 2 phải bằng học phí");
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, payload);

        const currentEnrollment = getMainEnrollment(editingStudent);

        if (formValues.course_id) {
          const tuitionFee = Number(formValues.tuition_fee || 0);
          const firstExpected = formValues.first_payment_expected
            ? Number(formValues.first_payment_expected)
            : Math.floor(tuitionFee / 2);

          const secondExpected = formValues.second_payment_expected
            ? Number(formValues.second_payment_expected)
            : tuitionFee - firstExpected;

          if (currentEnrollment) {
            await enrollmentsApi.update(currentEnrollment.id, {
              student_id: editingStudent.id,
              course_id: Number(formValues.course_id),
              tuition_fee: tuitionFee,
              first_payment_expected: firstExpected,
              second_payment_expected: secondExpected,
              status: currentEnrollment.status || "STUDYING",
              note: currentEnrollment.note || null,
            });
          } else {
            await enrollmentsApi.create({
              student_id: editingStudent.id,
              course_id: Number(formValues.course_id),
              tuition_fee: tuitionFee,
              first_payment_expected: firstExpected,
              second_payment_expected: secondExpected,
              status: "STUDYING",
              note: null,
            });
          }
        }

        showSuccess("Cập nhật học viên thành công");
      } else {
        const createdStudent = await studentsApi.create(payload);

        if (formValues.course_id) {
          const tuitionFee = Number(formValues.tuition_fee || 0);
          const firstExpected = formValues.first_payment_expected
            ? Number(formValues.first_payment_expected)
            : Math.floor(tuitionFee / 2);

          const secondExpected = formValues.second_payment_expected
            ? Number(formValues.second_payment_expected)
            : tuitionFee - firstExpected;

          await enrollmentsApi.create({
            student_id: createdStudent.id,
            course_id: Number(formValues.course_id),
            tuition_fee: tuitionFee,
            first_payment_expected: firstExpected,
            second_payment_expected: secondExpected,
            status: "STUDYING",
            note: null,
          });
        }

        showSuccess("Thêm học viên thành công");
      }

      setDialogOpen(false);
      setEditingStudent(null);
      setFormValues(defaultFormValues);
      setFormError(null);

      await loadData();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không lưu được học viên"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSplitStudentTuition = () => {
    const tuitionFee = Number(formValues.tuition_fee || 0);

    if (tuitionFee <= 0) {
      setFormError("Vui lòng nhập học phí trước khi tự chia");
      return;
    }

    const firstExpected = Math.floor(tuitionFee / 2);
    const secondExpected = tuitionFee - firstExpected;

    setFormValues((prev) => ({
      ...prev,
      first_payment_expected: String(firstExpected),
      second_payment_expected: String(secondExpected),
    }));

    setFormError(null);
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

        await loadData();
      } catch (error) {
        showError(
          error instanceof Error ? error.message : "Không xóa được học viên"
        );
      } finally {
        setLoading(false);
      }
    },
    [loadData, showError, showSuccess]
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
        field: "course_name",
        headerName: "Khóa học",
        minWidth: 220,
        flex: 1,
        renderCell: (params) => getCourseName(params.row),
      },
      {
        field: "tuition_fee",
        headerName: "Học phí",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const tuitionFee = getTuitionFee(params.row);

          return tuitionFee > 0 ? formatCurrency(tuitionFee) : "-";
        },
      },
      {
        field: "total_paid",
        headerName: "Đã thu",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const totalPaid = getTotalPaidByEnrollment(params.row);

          return totalPaid > 0 ? formatCurrency(totalPaid) : "-";
        },
      },
      {
        field: "remaining_amount",
        headerName: "Còn nợ",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const enrollment = getMainEnrollment(params.row);

          if (!enrollment) return "-";

          const remainingAmount = getRemainingAmountByEnrollment(params.row);

          return (
            <Chip
              label={formatCurrency(remainingAmount)}
              color={remainingAmount <= 0 ? "success" : "warning"}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "payment_status",
        headerName: "Trạng thái học phí",
        width: 170,
        renderCell: (params) => {
          const enrollment = getMainEnrollment(params.row);

          if (!enrollment) {
            return (
              <Chip
                label="Chưa vào khóa"
                color="default"
                size="small"
                variant="outlined"
              />
            );
          }

          const remainingAmount = getRemainingAmountByEnrollment(params.row);

          return (
            <Chip
              label={remainingAmount <= 0 ? "Đã đóng đủ" : "Chưa đóng đủ"}
              color={remainingAmount <= 0 ? "success" : "error"}
              size="small"
              variant="outlined"
            />
          );
        },
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
      <PageHeader
        title="Quản lý học viên"
        description="Quản lý thông tin học viên, khóa học, học phí, hồ sơ và lịch sử thi."
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
              Thêm học viên
            </Button>
          </>
        }
      />

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
              Khóa học của học viên
            </Typography>

            <TextField
              select
              label="Khóa học"
              value={formValues.course_id}
              onChange={handleChange("course_id")}
              fullWidth
              helperText="Không bắt buộc. Nếu chọn khóa học thì cần nhập học phí."
            >
              <MenuItem value="">Chưa chọn khóa học</MenuItem>

              {courses
                .filter(
                  (course) =>
                    !course.is_finance_closed && course.status !== "FINISHED"
                )
                .map((course) => (
                  <MenuItem key={course.id} value={String(course.id)}>
                    {course.name}
                    {course.code ? ` - ${course.code}` : ""}
                  </MenuItem>
                ))}
            </TextField>

            {formValues.course_id && (
              <>
                <TextField
                  label="Học phí riêng của học viên"
                  value={
                    formValues.tuition_fee
                      ? Number(formValues.tuition_fee).toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(event) => {
                    const rawValue = onlyNumber(event.target.value);

                    setFormValues((prev) => ({
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
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                >
                  <TextField
                    label="Dự kiến đóng lần 1"
                    value={
                      formValues.first_payment_expected
                        ? Number(
                            formValues.first_payment_expected
                          ).toLocaleString("vi-VN")
                        : ""
                    }
                    onChange={(event) => {
                      const rawValue = onlyNumber(event.target.value);

                      setFormValues((prev) => ({
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
                            formValues.second_payment_expected
                          ).toLocaleString("vi-VN")
                        : ""
                    }
                    onChange={(event) => {
                      const rawValue = onlyNumber(event.target.value);

                      setFormValues((prev) => ({
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
                  onClick={handleAutoSplitStudentTuition}
                  disabled={!formValues.tuition_fee}
                >
                  Tự chia học phí thành 2 lần
                </Button>
              </>
            )}

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
                select
                label="Nơi cấp CCCD"
                value={formValues.identity_issue_place}
                onChange={handleChange("identity_issue_place")}
                fullWidth
              >
                <MenuItem value="">Chọn nơi cấp CCCD</MenuItem>

                {identityIssuePlaces.map((place) => (
                  <MenuItem key={place} value={place}>
                    {place}
                  </MenuItem>
                ))}
              </TextField>
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
