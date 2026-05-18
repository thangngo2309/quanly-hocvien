import type { Metadata } from 'next';
import Providers from './providers';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'Quản lý trung tâm đào tạo lái xe',
  description: 'Phần mềm quản lý khóa học, học viên, học phí và chi phí',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}