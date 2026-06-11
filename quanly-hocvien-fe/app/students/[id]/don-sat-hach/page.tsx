'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import { Student, studentsApi } from '@/api/students';
import {
  formatDate,
  formatFullName,
  getImageSrc,
  printPage,
} from '@/components/student-documents/StudentDocumentUtils';
import '@/components/student-documents/student-document.css';

const TESTING_RECEIVER = 'Phòng Cảnh sát Giao thông Công an TP. Đà Nẵng';
const TRAINING_CENTER_NAME = 'Trung tâm GDNN Minh Sơn';
const DEFAULT_LEARNING_LICENSE_CLASS = 'B';

export default function DrivingTestApplicationPage() {
  const params = useParams();
  const studentId = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        const data = await studentsApi.findOne(studentId);
        setStudent(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Không tải được thông tin học viên',
        );
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Không tìm thấy học viên'}</Alert>
      </Box>
    );
  }

  const imageSrc = getImageSrc(student.avatar_url);

  return (
    <>
      <Box className="student-doc-toolbar">
        <Button variant="outlined" onClick={() => window.close()}>
          Đóng
        </Button>

        <Button variant="contained" onClick={printPage}>
          In / Lưu PDF
        </Button>
      </Box>

      <div className="student-doc-print-root">
        <div className="student-doc-page">
          <div className="student-doc-header">
            <div className="nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="slogan">Độc lập - Tự do - Hạnh phúc</div>
          </div>

          <div className="student-doc-title">
            ĐỀ NGHỊ SÁT HẠCH ĐỂ CẤP
            <br />
            GIẤY PHÉP LÁI XE
          </div>

          <div className="student-doc-body">
            {imageSrc && (
              <img
                className="student-doc-photo"
                src={imageSrc}
                alt={student.full_name}
              />
            )}

            <div className="student-doc-line student-doc-center">
              Kính gửi: {TESTING_RECEIVER}
            </div>

            <br />
            <br />

            <div className="student-doc-line" style={{paddingTop: 10}}>
              Tôi là:{' '}
              <span className="student-doc-bold">
                {formatFullName(student.full_name)}
              </span>
            </div>

            <div className="student-doc-line">Quốc tịch: Việt Nam</div>

            <div className="student-doc-line">
              Ngày tháng năm sinh:{' '}
              <span className="student-doc-bold">
                {formatDate(student.date_of_birth)}
              </span>
            </div>

            <div className="student-doc-line">
              Số định danh hoặc Hộ chiếu số:{' '}
              <span className="student-doc-bold">
                {student.identity_number || '........................'}
              </span>{' '}
              ngày cấp{' '}
              <span className="student-doc-bold">
                {formatDate(student.identity_issue_date)}
              </span>{' '}
              nơi cấp:{' '}
              <span className="student-doc-bold">
                {student.identity_issue_place || '........................'}
              </span>
            </div>

            <div className="student-doc-line">
              Đã hoàn thành nội dung chương trình đào tạo lái xe hạng:{' '}
              <span className="student-doc-bold">
                {DEFAULT_LEARNING_LICENSE_CLASS}
              </span>{' '}
              tại{' '}
              <span className="student-doc-bold">{TRAINING_CENTER_NAME}</span>
            </div>

            <div className="student-doc-line">
              Đã có giấy phép lái xe số:{' '}
              <span className="student-doc-bold">
                {student.previous_license_number || '........................'}
              </span>{' '}
              hạng:{' '}
              <span className="student-doc-bold">
                {student.previous_license_class || 'A1'}
              </span>{' '}
              Do:{' '}
              <span className="student-doc-bold">
                {student.previous_license_issue_place || '........................'}
              </span>{' '}
              cấp ngày:{' '}
              <span className="student-doc-bold">
                {formatDate(student.previous_license_issue_date)}
              </span>
            </div>

            <div className="student-doc-line">
              Đề nghị cho tôi dự sát hạch để cấp giấy phép lái xe hạng:{' '}
              <span className="student-doc-bold">
                {DEFAULT_LEARNING_LICENSE_CLASS}
              </span>
            </div>

            <div className="student-doc-line">
              Vi phạm hành chính trong lĩnh vực giao thông đường bộ: Có
              <span className="student-doc-checkbox" />
              Không
              <span className="student-doc-checkbox" />
            </div>

            <div className="student-doc-line">
              Tôi xin cam đoan những điều ghi trên là đúng sự thật, nếu sai tôi xin
              hoàn toàn chịu trách nhiệm.
            </div>

            <div className="student-doc-sign-area">
              <div className="student-doc-sign-box">
                <div className="student-doc-sign-date">
                  Đà Nẵng, ngày ..... tháng ..... năm 2026
                </div>
                <div className="student-doc-sign-title">NGƯỜI ĐỀ NGHỊ</div>
                <div className="student-doc-sign-note">(ký và ghi rõ họ tên)</div>

                <div className="student-doc-sign-name">
                  {formatFullName(student.full_name)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}