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
import DownloadIcon from "@mui/icons-material/Download";
import PageHeader from "@/components/common/PageHeader";
import { Student, studentsApi } from "@/api/students";
import ExcelJS from "exceljs";

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
  type ReportMode = "COURSE" | "STUDENT";

  const [reportMode, setReportMode] = useState<ReportMode>("COURSE");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

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

      const filter =
        reportMode === "COURSE"
          ? {
              courseId: selectedCourseId ? Number(selectedCourseId) : undefined,
            }
          : {
              studentId: selectedStudentId
                ? Number(selectedStudentId)
                : undefined,
            };

      const [summaryData, paymentStatusData, expenseDetailData] =
        await Promise.all([
          reportsApi.getSummary(filter),
          reportsApi.getPaymentStatus(filter),
          reportsApi.getExpenseDetails(filter),
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
  }, [reportMode, selectedCourseId, selectedStudentId, showError]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      const [courseData, studentData] = await Promise.all([
        coursesApi.findAll(),
        studentsApi.findAll(),
      ]);

      setCourses(courseData);
      setStudents(studentData);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Không tải được dữ liệu bộ lọc"
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

  const expenseReceiptCategories = [
    "Chi giáo viên",
    "Chi phí đối tác 1",
    "Chi phí đối tác 2",
  ];

  const normalizeSheetName = (name: string) => {
    return name.replace(/[\\/*?:[\]]/g, "").slice(0, 31);
  };

  const safeFileName = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    if (method === "CASH") return "Tiền mặt";
    if (method === "BANK_TRANSFER") return "Chuyển khoản";
    return "";
  };

  const exportExpenseReceiptWorkbook = async () => {
    const filteredExpenses = expenseDetailRows.filter((item) =>
      expenseReceiptCategories.includes(item.category_name)
    );

    if (!filteredExpenses.length) {
      setSnackbar({
        open: true,
        message:
          "Không có khoản chi thuộc Chi giáo viên, Chi phí đối tác 1 hoặc Chi phí đối tác 2",
        severity: "error",
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Quản lý học viên";
    workbook.created = new Date();

    expenseReceiptCategories.forEach((categoryName) => {
      const rows = filteredExpenses.filter(
        (item) => item.category_name === categoryName
      );

      const worksheet = workbook.addWorksheet(
        normalizeSheetName(categoryName),
        {
          pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
              left: 0.3,
              right: 0.3,
              top: 0.5,
              bottom: 0.5,
              header: 0.2,
              footer: 0.2,
            },
          },
        }
      );

      worksheet.mergeCells("A1:K1");
      worksheet.getCell("A1").value = "BẢNG KÊ PHIẾU CHI";
      worksheet.getCell("A1").font = {
        name: "Times New Roman",
        size: 16,
        bold: true,
      };
      worksheet.getCell("A1").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.mergeCells("A2:K2");
      worksheet.getCell("A2").value = categoryName.toUpperCase();
      worksheet.getCell("A2").font = {
        name: "Times New Roman",
        size: 14,
        bold: true,
      };
      worksheet.getCell("A2").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      const selectedFilterName =
        reportMode === "COURSE"
          ? selectedCourse?.name || "Tất cả khóa học"
          : students.find((student) => student.id === Number(selectedStudentId))
              ?.full_name || "Tất cả học viên";

      worksheet.mergeCells("A3:K3");
      worksheet.getCell("A3").value =
        reportMode === "COURSE"
          ? `Khóa học: ${selectedFilterName}`
          : `Học viên: ${selectedFilterName}`;
      worksheet.getCell("A3").font = {
        name: "Times New Roman",
        size: 12,
        italic: true,
      };
      worksheet.getCell("A3").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        "STT",
        "Ngày chi",
        "Loại chi phí",
        "Học viên",
        "Số điện thoại",
        "Khóa học",
        "Người nhận tiền",
        "Số tiền",
        "Phương thức",
        "Ghi chú",
        "Ký nhận",
      ]);

      headerRow.eachCell((cell: any) => {
        cell.font = {
          name: "Times New Roman",
          size: 12,
          bold: true,
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
      });

      let totalAmount = 0;

      rows.forEach((item, index) => {
        const amount = Number(item.amount || 0);
        totalAmount += amount;

        const row = worksheet.addRow([
          index + 1,
          formatDate(item.expense_date),
          item.category_name || "",
          item.student?.full_name || "",
          item.student?.phone || "",
          item.course?.name || "",
          item.receiver_name || "",
          amount,
          getPaymentMethodLabel(item.payment_method),
          item.note || "",
          "",
        ]);

        row.eachCell((cell: any) => {
          cell.font = {
            name: "Times New Roman",
            size: 12,
          };
          cell.alignment = {
            vertical: "middle",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        row.getCell(1).alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        row.getCell(8).numFmt = "#,##0";
        row.getCell(8).alignment = {
          horizontal: "right",
          vertical: "middle",
        };

        row.height = 28;
      });

      const totalRow = worksheet.addRow([
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
      ]);

      totalRow.eachCell((cell: any) => {
        cell.font = {
          name: "Times New Roman",
          size: 12,
          bold: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          vertical: "middle",
        };
      });

      totalRow.getCell(7).alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      totalRow.getCell(8).numFmt = "#,##0";
      totalRow.getCell(8).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      worksheet.addRow([]);

      const signStartRow = worksheet.rowCount + 1;

      worksheet.mergeCells(`H${signStartRow}:K${signStartRow}`);
      worksheet.getCell(`H${signStartRow}`).value =
        "Ngày ..... tháng ..... năm ........";
      worksheet.getCell(`H${signStartRow}`).alignment = {
        horizontal: "center",
      };
      worksheet.getCell(`H${signStartRow}`).font = {
        name: "Times New Roman",
        size: 12,
        italic: true,
      };

      worksheet.mergeCells(`B${signStartRow + 1}:D${signStartRow + 1}`);
      worksheet.getCell(`B${signStartRow + 1}`).value = "NGƯỜI LẬP";
      worksheet.getCell(`B${signStartRow + 1}`).font = {
        name: "Times New Roman",
        size: 12,
        bold: true,
      };
      worksheet.getCell(`B${signStartRow + 1}`).alignment = {
        horizontal: "center",
      };

      worksheet.mergeCells(`H${signStartRow + 1}:K${signStartRow + 1}`);
      worksheet.getCell(`H${signStartRow + 1}`).value = "NGƯỜI DUYỆT";
      worksheet.getCell(`H${signStartRow + 1}`).font = {
        name: "Times New Roman",
        size: 12,
        bold: true,
      };
      worksheet.getCell(`H${signStartRow + 1}`).alignment = {
        horizontal: "center",
      };

      worksheet.columns = [
        { width: 6 },
        { width: 13 },
        { width: 22 },
        { width: 24 },
        { width: 16 },
        { width: 28 },
        { width: 22 },
        { width: 15 },
        { width: 15 },
        { width: 28 },
        { width: 20 },
      ];

      worksheet.getColumn(8).numFmt = "#,##0";

      worksheet.views = [
        {
          state: "frozen",
          ySplit: 5,
        },
      ];
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const filterName =
      reportMode === "COURSE"
        ? selectedCourse?.name || "tat-ca-khoa"
        : students.find((student) => student.id === Number(selectedStudentId))
            ?.full_name || "tat-ca-hoc-vien";

    const fileName = `phieu-chi-${safeFileName(filterName)}.xlsx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "Export phiếu chi Excel thành công",
      severity: "success",
    });
  };

  return (
    <Box>
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Tổng hợp học phí, khoản chi, công nợ và lợi nhuận tạm tính."
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadReports}
              disabled={loading}
            >
              Tải lại
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
              label="Kiểu báo cáo"
              value={reportMode}
              onChange={(event) => {
                const value = event.target.value as ReportMode;

                setReportMode(value);
                setSelectedCourseId("");
                setSelectedStudentId("");
              }}
              sx={{
                minWidth: {
                  xs: "100%",
                  md: 220,
                },
              }}
            >
              <MenuItem value="COURSE">Theo khóa học</MenuItem>
              <MenuItem value="STUDENT">Theo học viên</MenuItem>
            </TextField>

            {reportMode === "COURSE" && (
              <TextField
                select
                label="Chọn khóa học"
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
            )}

            {reportMode === "STUDENT" && (
              <TextField
                select
                label="Chọn học viên"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                fullWidth
              >
                <MenuItem value="">Tất cả học viên</MenuItem>

                {students.map((student) => (
                  <MenuItem key={student.id} value={String(student.id)}>
                    {student.full_name}
                    {student.phone ? ` - ${student.phone}` : ""}
                  </MenuItem>
                ))}
              </TextField>
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
          {reportMode === "COURSE"
            ? "Chi tiết thu học phí theo khóa học"
            : "Chi tiết thu học phí theo học viên"}
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
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        mb={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {reportMode === "COURSE"
              ? "Chi tiết khoản chi của khóa học"
              : "Chi tiết khoản chi của học viên"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bao gồm khoản chi theo học viên và khoản chi chung của khóa học.
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportExpenseDetailsCsv}
          disabled={loading || expenseDetailRows.length === 0}
        >
          Export CSV khoản chi
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportExpenseReceiptWorkbook}
          disabled={loading || expenseDetailRows.length === 0}
        >
          Export phiếu chi Excel
        </Button>
      </Stack>

      <GenericDataGrid<ReportExpenseDetailItem>
        rows={expenseDetailRows}
        columns={expenseColumns}
        loading={loading}
        height={520}
        getRowId={(row) => row.id}
      />

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
