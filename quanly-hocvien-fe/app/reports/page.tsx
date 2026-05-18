"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";

import GenericDataGrid from "@/components/common/GenericDataGrid";
import { Course, coursesApi } from "@/api/courses";
import {
  ReportExpenseDetailItem,
  ReportPaymentStatusItem,
  ReportSummary,
  reportsApi,
} from "@/api/reports";
import { formatDate } from "@/components/student-documents/StudentDocumentUtils";
import DownloadIcon from '@mui/icons-material/Download';

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPaymentStatusInfo(status?: string) {
  if (status === "PAID") {
    return {
      label: "Đã đóng",
      color: "success" as const,
    };
  }

  if (status === "PARTIAL") {
    return {
      label: "Đóng thiếu",
      color: "warning" as const,
    };
  }

  return {
    label: "Chưa đóng",
    color: "error" as const,
  };
}

function getStudentStatusLabel(status?: string) {
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "DROPPED") return "Đã nghỉ";
  return "Đang học";
}

function getStudentStatusColor(status?: string) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "DROPPED") return "error" as const;
  return "primary" as const;
}

type SummaryCardProps = {
  title: string;
  value: string | number;
  note?: string;
  color?: "default" | "success" | "warning" | "error" | "primary";
};

function SummaryCard({
  title,
  value,
  note,
  color = "default",
}: SummaryCardProps) {
  const getValueColor = () => {
    if (color === "success") return "success.main";
    if (color === "warning") return "warning.main";
    if (color === "error") return "error.main";
    if (color === "primary") return "primary.main";

    return "text.primary";
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>

        <Typography
          variant="h5"
          fontWeight={700}
          mt={1}
          color={getValueColor()}
        >
          {value}
        </Typography>

        {note && (
          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [paymentStatusRows, setPaymentStatusRows] = useState<
    ReportPaymentStatusItem[]
  >([]);

  const [expenseDetailRows, setExpenseDetailRows] = useState<
    ReportExpenseDetailItem[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showError = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "error",
    });
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);

      const courseId = selectedCourseId ? Number(selectedCourseId) : undefined;

      const [summaryData, paymentStatusData, expenseDetailData] =
        await Promise.all([
          reportsApi.getSummary(courseId),
          reportsApi.getPaymentStatus(courseId),
          reportsApi.getExpenseDetails(courseId),
        ]);

      setSummary(summaryData);
      setPaymentStatusRows(paymentStatusData);
      setExpenseDetailRows(expenseDetailData);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Không tải được báo cáo"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, showError]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      const courseData = await coursesApi.findAll();

      setCourses(courseData);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách khóa học"
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;

    return (
      courses.find((course) => course.id === Number(selectedCourseId)) || null
    );
  }, [courses, selectedCourseId]);

  const columns = useMemo<GridColDef<ReportPaymentStatusItem>[]>(
    () => [
      {
        field: "student_name",
        headerName: "Học viên",
        flex: 1,
        minWidth: 220,
        renderCell: (params) => params.row.student?.full_name || "-",
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
        renderCell: (params) => params.row.student?.phone || "-",
      },
      {
        field: "course_name",
        headerName: "Khóa học",
        flex: 1,
        minWidth: 230,
        renderCell: (params) => params.row.course?.name || "-",
      },
      {
        field: "tuition_fee",
        headerName: "Học phí",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.tuition_fee),
      },
      {
        field: "first_payment",
        headerName: "Lần 1",
        width: 180,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const statusInfo = getPaymentStatusInfo(
            params.row.first_payment_status
          );

          return (
            <Stack alignItems="flex-end" spacing={0.5}>
              <Typography variant="body2">
                {formatCurrency(params.row.first_payment_paid)}
              </Typography>

              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                variant="outlined"
              />
            </Stack>
          );
        },
      },
      {
        field: "second_payment",
        headerName: "Lần 2",
        width: 180,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const statusInfo = getPaymentStatusInfo(
            params.row.second_payment_status
          );

          return (
            <Stack alignItems="flex-end" spacing={0.5}>
              <Typography variant="body2">
                {formatCurrency(params.row.second_payment_paid)}
              </Typography>

              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                variant="outlined"
              />
            </Stack>
          );
        },
      },
      {
        field: "total_paid",
        headerName: "Tổng đã đóng",
        width: 160,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.total_paid),
      },
      {
        field: "remaining_amount",
        headerName: "Còn nợ",
        width: 160,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const remaining = Number(params.row.remaining_amount || 0);

          return (
            <Chip
              label={formatCurrency(remaining)}
              color={remaining <= 0 ? "success" : "warning"}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Trạng thái học",
        width: 150,
        renderCell: (params) => (
          <Chip
            label={getStudentStatusLabel(params.row.status)}
            color={getStudentStatusColor(params.row.status)}
            size="small"
            variant="outlined"
          />
        ),
      },
    ],
    []
  );

  const collectionColumns = useMemo<GridColDef<ReportPaymentStatusItem>[]>(
    () => [
      {
        field: "student_name",
        headerName: "Học viên",
        flex: 1,
        minWidth: 220,
        renderCell: (params) => params.row.student?.full_name || "-",
      },
      {
        field: "phone",
        headerName: "Số điện thoại",
        width: 150,
        renderCell: (params) => params.row.student?.phone || "-",
      },
      {
        field: "course_name",
        headerName: "Khóa học",
        flex: 1,
        minWidth: 230,
        renderCell: (params) => params.row.course?.name || "-",
      },
      {
        field: "tuition_fee",
        headerName: "Học phí",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.tuition_fee),
      },
      {
        field: "first_payment_paid",
        headerName: "Đã thu lần 1",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.first_payment_paid),
      },
      {
        field: "second_payment_paid",
        headerName: "Đã thu lần 2",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.second_payment_paid),
      },
      {
        field: "total_paid",
        headerName: "Tổng đã thu",
        width: 160,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.total_paid),
      },
      {
        field: "remaining_amount",
        headerName: "Còn nợ",
        width: 160,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
          const remaining = Number(params.row.remaining_amount || 0);

          return (
            <Chip
              label={formatCurrency(remaining)}
              color={remaining <= 0 ? "success" : "warning"}
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
          const remaining = Number(params.row.remaining_amount || 0);

          return (
            <Chip
              label={remaining <= 0 ? "Đã đóng đủ" : "Chưa đóng đủ"}
              color={remaining <= 0 ? "success" : "error"}
              size="small"
            />
          );
        },
      },
    ],
    []
  );

  const expenseColumns = useMemo<GridColDef<ReportExpenseDetailItem>[]>(
    () => [
      {
        field: "category_name",
        headerName: "Loại chi phí",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "target_type",
        headerName: "Loại",
        width: 140,
        renderCell: (params) => (
          <Chip
            label={
              params.row.target_type === "ENROLLMENT"
                ? "Theo học viên"
                : "Theo khóa"
            }
            color={
              params.row.target_type === "ENROLLMENT" ? "primary" : "warning"
            }
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "student_name",
        headerName: "Học viên",
        flex: 1,
        minWidth: 200,
        renderCell: (params) => params.row.student?.full_name || "-",
      },
      {
        field: "course_name",
        headerName: "Khóa học",
        flex: 1,
        minWidth: 220,
        renderCell: (params) => params.row.course?.name || "-",
      },
      {
        field: "amount",
        headerName: "Số tiền chi",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => formatCurrency(params.row.amount),
      },
      {
        field: "expense_date",
        headerName: "Ngày chi",
        width: 130,
        renderCell: (params) => formatDate(params.row.expense_date),
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
        flex: 1,
        minWidth: 180,
        renderCell: (params) => params.row.note || "-",
      },
    ],
    []
  );

  const profit = Number(summary?.profit || 0);
  const totalRemaining = Number(summary?.total_remaining || 0);

  const escapeCsvValue = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const downloadCsv = (filename: string, rows: unknown[][]) => {
    const csvContent = rows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    // Thêm BOM để Excel đọc tiếng Việt không lỗi font
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportExpenseDetailsCsv = () => {
    if (!expenseDetailRows.length) {
      setSnackbar({
        open: true,
        message: "Không có dữ liệu khoản chi để export",
        severity: "error",
      });
      return;
    }

    const courseName = selectedCourse
      ? selectedCourse.name.replace(/[\\/:*?"<>|]/g, "")
      : "tat-ca-khoa";

    const headers = [
      "STT",
      "Ngày chi",
      "Loại chi phí",
      "Loại đối tượng",
      "Học viên",
      "Số điện thoại",
      "Khóa học",
      "Người nhận tiền",
      "Số tiền",
      "Phương thức",
      "Ghi chú",
      "Ký nhận",
    ];

    const bodyRows = expenseDetailRows.map((item, index) => [
      index + 1,
      formatDate(item.expense_date),
      item.category_name || "",
      item.target_type === "ENROLLMENT" ? "Theo học viên" : "Theo khóa",
      item.student?.full_name || "",
      item.student?.phone || "",
      item.course?.name || "",
      item.receiver_name || "",
      Number(item.amount || 0),
      item.payment_method === "CASH"
        ? "Tiền mặt"
        : item.payment_method === "BANK_TRANSFER"
        ? "Chuyển khoản"
        : "",
      item.note || "",
      "",
    ]);

    const totalAmount = expenseDetailRows.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const totalRow = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "TỔNG CỘNG",
      totalAmount,
      "",
      "",
      "",
    ];

    downloadCsv(`chi-tiet-khoan-chi-${courseName}.csv`, [
      headers,
      ...bodyRows,
      totalRow,
    ]);

    setSnackbar({
      open: true,
      message: "Export CSV khoản chi thành công",
      severity: "success",
    });
  };

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
            Báo cáo tổng hợp
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Tổng hợp học phí, khoản chi, công nợ và lợi nhuận tạm tính.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadReports}
            disabled={loading}
          >
            Tải lại
          </Button>
        </Stack>
      </Stack>

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
              onChange={(event) => setSelectedCourseId(event.target.value)}
              fullWidth
            >
              <MenuItem value="">Tất cả khóa học</MenuItem>

              {courses.map((course) => (
                <MenuItem key={course.id} value={String(course.id)}>
                  {course.name}
                  {course.code ? ` - ${course.code}` : ""}
                </MenuItem>
              ))}
            </TextField>

            {selectedCourse && (
              <Alert severity="info" sx={{ width: "100%" }}>
                Đang xem báo cáo của khóa:{" "}
                <strong>{selectedCourse.name}</strong>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 2,
        }}
      >
        <SummaryCard
          title="Tổng học viên"
          value={summary?.total_students ?? 0}
          note="Số học viên đã thêm vào khóa"
          color="primary"
        />

        <SummaryCard
          title="Tổng học phí phải thu"
          value={formatCurrency(summary?.total_tuition)}
          note="Tổng học phí theo từng học viên"
        />

        <SummaryCard
          title="Tổng đã thu"
          value={formatCurrency(summary?.total_paid)}
          note="Tổng học phí đã đóng"
          color="success"
        />

        <SummaryCard
          title="Tổng còn nợ"
          value={formatCurrency(summary?.total_remaining)}
          note="Học phí chưa thu"
          color={totalRemaining > 0 ? "warning" : "success"}
        />

        <SummaryCard
          title="Tổng chi phí"
          value={formatCurrency(summary?.total_expense)}
          note="Chi phí theo học viên, khóa học và chi phí khác"
          color="error"
        />

        <SummaryCard
          title="Lợi nhuận tạm tính"
          value={formatCurrency(summary?.profit)}
          note="Đã thu trừ tổng chi phí"
          color={profit >= 0 ? "success" : "error"}
        />
      </Box>

      <Stack spacing={1} mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Chi tiết thu học phí từng học viên
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Dòng màu xanh là học viên đã đóng đủ học phí, dòng màu cam là học viên
          còn nợ.
        </Typography>
      </Stack>

      <GenericDataGrid<ReportPaymentStatusItem>
        rows={paymentStatusRows}
        columns={collectionColumns}
        loading={loading}
        height={520}
        getRowId={(row) => row.enrollment_id}
        getRowClassName={(params) =>
          Number(params.row.remaining_amount || 0) <= 0
            ? "row-paid-full"
            : "row-not-paid-full"
        }
      />

      <Box mt={4} />

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
          <Typography variant="h6" fontWeight={700}>
            Chi tiết khoản chi
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Bao gồm khoản chi theo học viên và khoản chi chung của khóa học.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportExpenseDetailsCsv}
          disabled={loading || expenseDetailRows.length === 0}
        >
          Export CSV khoản chi
        </Button>
      </Stack>

      <GenericDataGrid<ReportExpenseDetailItem>
        rows={expenseDetailRows}
        columns={expenseColumns}
        loading={loading}
        height={520}
        getRowId={(row) => row.id}
      />

      {/* <Stack spacing={1} mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Trạng thái đóng học phí
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Theo dõi học viên đã đóng lần 1, lần 2, tổng đã đóng và số tiền còn
          nợ.
        </Typography>
      </Stack>

      <GenericDataGrid<ReportPaymentStatusItem>
        rows={paymentStatusRows}
        columns={columns}
        loading={loading}
        height={650}
        getRowId={(row) => row.enrollment_id}
      /> */}

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
